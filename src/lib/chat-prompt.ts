import fs from "fs";
import path from "path";

interface ChatPrompts {
  systemPrompt: string;
  notePrompt: string;
}

let cached: ChatPrompts | null = null;

export function loadChatPrompts(): ChatPrompts {
  if (cached) return cached;

  const baseDir = path.join(process.cwd(), "content", "research");

  const systemPrompt = fs.readFileSync(
    path.join(baseDir, "system-prompt.txt"),
    "utf-8"
  );

  let notePrompt = "";
  try {
    notePrompt = fs.readFileSync(
      path.join(baseDir, "note-prompt.txt"),
      "utf-8"
    );
  } catch {
    // not generated yet
  }

  cached = { systemPrompt, notePrompt };
  return cached;
}
