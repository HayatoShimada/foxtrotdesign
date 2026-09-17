import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

// suggest-reading.ts と同じ約束: gemini-3.5 は思考トークンも maxOutputTokens に含むので大きめ、
// finishReason が STOP 以外なら途中で切れているのでエラーにする。

export const modelName = process.env.NEWS_MODEL || "gemini-3.5-flash";

export function getApiKey(): string | null {
  const apiKey = process.env.GEMINI_API_KEY;
  return !apiKey || apiKey === "your_gemini_api_key_here" ? null : apiKey;
}

export function getJsonModel(apiKey: string, temperature = 0.3): GenerativeModel {
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: modelName,
    generationConfig: {
      maxOutputTokens: 16384,
      responseMimeType: "application/json",
      temperature,
    },
  });
}

export function parseJson<T>(value: string): T {
  const cleaned = value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  return JSON.parse(cleaned) as T;
}

export async function generateJson<T>(model: GenerativeModel, prompt: string): Promise<T> {
  const result = await model.generateContent(prompt);
  const finishReason = result.response.candidates?.[0]?.finishReason;
  if (finishReason && finishReason !== "STOP") {
    throw new Error(`Gemini が途中で止まりました: ${finishReason}`);
  }
  return parseJson<T>(result.response.text());
}

// Search Grounding。SDK 0.24 には 3.x 世代の google_search ツールの型が無いので REST を直接叩く。
export interface GroundedResult {
  text: string;
  sources: { title: string; url: string }[];
}

export async function groundedSearch(apiKey: string, prompt: string): Promise<GroundedResult> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
    }),
  });
  if (!response.ok) {
    throw new Error(`grounded search ${response.status}: ${(await response.text()).slice(0, 200)}`);
  }
  const data = (await response.json()) as {
    candidates?: {
      content?: { parts?: { text?: string }[] };
      groundingMetadata?: { groundingChunks?: { web?: { uri?: string; title?: string } }[] };
    }[];
  };
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  const sources = (candidate?.groundingMetadata?.groundingChunks ?? [])
    .map((chunk) => chunk.web)
    .filter((web): web is { uri: string; title: string } => Boolean(web?.uri))
    .map((web) => ({ title: web.title ?? "", url: web.uri }));
  return { text, sources };
}
