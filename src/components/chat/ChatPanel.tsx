"use client";

import { useState, useEffect, useCallback } from "react";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";

interface Message {
  role: "user" | "model";
  content: string;
}

export function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    window.addEventListener("toggle-chat", toggle);
    return () => window.removeEventListener("toggle-chat", toggle);
  }, [toggle]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  async function sendMessage(text: string) {
    const userMessage: Message = { role: "user", content: text };
    const updated = [...messages, userMessage];
    setMessages([...updated, { role: "model", content: "" }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "model", content: accumulated };
          return copy;
        });
      }
    } catch (e) {
      const errorMsg =
        e instanceof Error && e.message.length > 0 && e.message.length < 200
          ? e.message
          : "エラーが発生しました.もう一度お試しください.";
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "model", content: errorMsg };
        return copy;
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 h-96 bg-background border border-foreground flex flex-col text-foreground">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-bold">Chat</span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-xs text-muted hover:text-foreground"
        >
          ×
        </button>
      </div>
      <ChatMessages messages={messages} isLoading={isLoading} />
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
