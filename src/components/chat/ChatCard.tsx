"use client";

export function ChatCard() {
    return (
        <button
            onClick={() => window.dispatchEvent(new CustomEvent("toggle-chat"))}
            className="block w-full text-left border border-foreground p-4 shadow-brutal-sm hover:shadow-brutal-md transition-shadow"
        >
            <h3 className="font-bold mb-2">Chat →</h3>
            <p className="text-muted text-xs">Hayato Shimada AIとの対話.</p>
        </button>
    );
}
