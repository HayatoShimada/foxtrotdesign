import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";
import { loadChatPrompts } from "@/lib/chat-prompt";

export const maxDuration = 30;

interface ChatMessage {
  role: "user" | "model";
  content: string;
}

// Simple rate limiter: 1 request per 3 seconds
let lastRequestTime = 0;
const MIN_INTERVAL_MS = 3000;

async function callWithRetry<T>(fn: () => T | Promise<T>, retries = 2): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const isRateLimit =
        error instanceof Error && error.message.includes("429");
      if (isRateLimit && i < retries) {
        const wait = (i + 1) * 3000;
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Unreachable");
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response("Configuration error", { status: 500 });
  }

  // Rate limit check
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_INTERVAL_MS) {
    return new Response("少し待ってからもう一度お試しください。", {
      status: 429,
    });
  }
  lastRequestTime = now;

  let body: { messages: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid request", { status: 400 });
  }

  const { messages } = body;
  if (!messages || messages.length === 0) {
    return new Response("No messages", { status: 400 });
  }

  if (messages.length > 50) {
    return new Response(
      "会話が長くなりすぎました。ページをリロードしてください。",
      { status: 400 }
    );
  }

  const { systemPrompt, notePrompt } = loadChatPrompts();

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-lite",
    systemInstruction: systemPrompt,
  });

  // note-prompt as initial context in conversation history
  const noteContext = notePrompt
    ? [
        {
          role: "user" as const,
          parts: [
            {
              text: "以下は僕のnote.com記事から抽出した人格プロファイルです。これを参考にして会話してください。\n\n"
                + notePrompt,
            },
          ],
        },
        {
          role: "model" as const,
          parts: [
            { text: "了解。プロファイルを参考にして会話するよ。" },
          ],
        },
      ]
    : [];

  const history = [
    ...noteContext,
    ...messages.slice(0, -1).map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    })),
  ];

  const lastMessage = messages[messages.length - 1].content;

  try {
    const chat = model.startChat({ history });
    const result = await callWithRetry(() =>
      chat.sendMessageStream(lastMessage)
    );

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    const isRateLimit =
      error instanceof Error && error.message.includes("429");
    if (isRateLimit) {
      return new Response(
        "APIの利用制限に達しました。少し時間をおいてお試しください。",
        { status: 429 }
      );
    }
    return new Response("エラーが発生しました", { status: 500 });
  }
}
