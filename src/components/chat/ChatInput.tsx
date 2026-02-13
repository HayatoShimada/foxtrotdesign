"use client";

import { useState, type KeyboardEvent } from "react";

export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [text, setText] = useState("");

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="border-t border-border p-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="メッセージを入力..."
          className="flex-1 bg-background text-foreground border border-border px-2 py-1 text-xs font-mono placeholder:text-muted focus:outline-none focus:border-foreground"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
          className="px-3 py-1 border border-border text-xs hover:border-foreground disabled:opacity-30"
        >
          Send
        </button>
      </div>
    </div>
  );
}
