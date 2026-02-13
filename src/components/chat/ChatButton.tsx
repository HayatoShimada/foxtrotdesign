"use client";

export function ChatButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent("toggle-chat"))}
      className="text-xs text-muted hover:text-foreground transition-colors px-2 py-1 border border-border"
      aria-label="Chat"
    >
      Chat
    </button>
  );
}
