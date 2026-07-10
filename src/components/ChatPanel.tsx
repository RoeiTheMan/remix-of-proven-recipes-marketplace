import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function ChatPanel({
  messages, currentUserId, onSend, disabled,
}: {
  messages: ChatMessage[];
  currentUserId: string;
  onSend: (body: string) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  return (
    <div className="border border-border bg-card flex flex-col h-[400px]">
      <div className="border-b border-border px-4 py-2 label-eyebrow">Conversation</div>
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {messages.length === 0 && <p className="text-sm text-neutral-gray">No messages yet.</p>}
        {messages.map((m) => {
          const mine = m.authorId === currentUserId;
          return (
            <div key={m.id} className={"flex " + (mine ? "justify-end" : "justify-start")}>
              <div className={"max-w-[75%] px-3 py-2 text-sm border " + (mine ? "border-ink bg-ink text-warm" : "border-border bg-secondary text-ink")}>
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form
        className="flex gap-2 border-t border-border p-3"
        onSubmit={(e) => { e.preventDefault(); if (text.trim()) { onSend(text.trim()); setText(""); } }}
      >
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={disabled ? "Accept an offer to open chat" : "Write a message…"} disabled={disabled} />
        <Button type="submit" variant="default" disabled={disabled || !text.trim()}>Send</Button>
      </form>
    </div>
  );
}
