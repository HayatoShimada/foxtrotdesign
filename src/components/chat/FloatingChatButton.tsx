"use client";

import { useEffect, useState } from "react";

export function FloatingChatButton() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const handleStateChange = (e: Event) => {
            const customEvent = e as CustomEvent;
            setIsVisible(!customEvent.detail.isOpen);
        };

        window.addEventListener("chat-state-change", handleStateChange);
        return () =>
            window.removeEventListener("chat-state-change", handleStateChange);
    }, []);

    if (!isVisible) return null;

    return (
        <button
            onClick={() => window.dispatchEvent(new CustomEvent("toggle-chat"))}
            className="fixed bottom-6 right-6 z-50 bg-background text-foreground border border-border p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
            aria-label="Toggle Chat"
            title="Chat with AI Assistant"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
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
