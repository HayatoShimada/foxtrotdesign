"use client";

export function ChatButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent("toggle-chat"))}
      className="text-muted hover:text-foreground transition-colors p-2 rounded-full border border-border hover:bg-neutral-100 dark:hover:bg-neutral-800"
      aria-label="Chat"
      title="Chat with AI Assistant"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="18" height="10" x="3" y="11" rx="2" />
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7v4" />
        <line x1="8" y1="16" x2="8.01" y2="16" />
        <line x1="16" y1="16" x2="16.01" y2="16" />
      </svg>
    </button>
  );
}
