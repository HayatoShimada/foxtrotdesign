"use client";

import { useEffect, useRef } from "react";

interface Message {
  role: "user" | "model";
  content: string;
}

export function ChatMessages({
  messages,
  isLoading,
}: {
  messages: Message[];
  isLoading: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-3 text-xs space-y-2">
      {messages.length === 0 && (
        <p className="text-muted">
          Hayato ShimadaのAIです.何でも聞いてください.
        </p>
      )}
      {messages.map((msg, i) => (
        <div key={i} className="border-b border-border pb-2">
          <span className="text-muted">
            {msg.role === "user" ? "> " : ""}
          </span>
          <span className="whitespace-pre-wrap">
            {msg.content || (isLoading ? "..." : "")}
          </span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
