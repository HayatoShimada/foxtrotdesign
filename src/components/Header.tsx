"use client";

import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { ChatButton } from "./chat/ChatButton";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="border-b border-border relative z-50 bg-background">
      <nav className="max-w-2xl mx-auto px-4 md:px-12 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="font-bold hover:underline z-50 relative">
            <svg
              className="w-6 h-6"
              viewBox="0 0 32 32"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="16" cy="16" r="16" fill="currentColor" />
              <path
                fill="var(--bg)"
                d="M12.65,17.64l-1.03,4.84h3.39c.74,0,1.24.11,1.5.34s.39.55.39.97c0,.67-.32,1.22-.95,1.66-.33.23-.88.34-1.63.34h-7.22c-.73,0-1.23-.12-1.49-.35s-.39-.55-.39-.96c0-.66.31-1.2.93-1.64.34-.24.9-.35,1.66-.35h.52l2.74-12.93h-.52c-.73,0-1.23-.12-1.49-.35s-.39-.56-.39-.98c0-.66.31-1.2.93-1.64.34-.24.9-.35,1.66-.35l15.56.02-1.06,5.05c-.17.8-.45,1.36-.83,1.69s-.82.5-1.31.5c-.38,0-.69-.12-.93-.35s-.37-.52-.37-.85c0-.21.05-.54.15-.98l.37-1.74h-8.43l-1.03,4.79h2.9c.18-.85.38-1.4.6-1.66.44-.53.97-.79,1.6-.79.38,0,.69.12.94.36s.38.52.38.85c0,.23-.05.56-.15,1l-.81,3.8c-.17.8-.45,1.36-.83,1.7s-.82.51-1.31.51c-.38,0-.69-.12-.93-.36s-.37-.53-.37-.86c0-.21.06-.63.19-1.24h-2.9Z"
              />
            </svg>
          </Link>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden z-50 relative p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
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
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
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
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <NavItems />
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-background z-40 flex flex-col justify-center items-center md:hidden animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col items-center gap-8 text-xl">
            <NavItems onClick={() => setIsMenuOpen(false)} />
          </div>
        </div>
      )}
    </header>
  );
}

function NavItems({ onClick }: { onClick?: () => void }) {
  return (
    <>
      <Link href="/research" className="hover:underline" onClick={onClick}>
        Research
      </Link>
      <Link href="/timeline" className="hover:underline" onClick={onClick}>
        Timeline
      </Link>
      <Link href="/images" className="hover:underline" onClick={onClick}>
        Images
      </Link>
      <div onClick={onClick}>
        <ChatButton />
      </div>
      <ThemeToggle />
    </>
  );
}
