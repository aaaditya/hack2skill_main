"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useWellnessStore } from "@/features/wellness/hooks/use-wellness-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Bot, User, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

const ChatInputSchema = z.object({
  message: z.string().min(1).max(1000),
});

type ChatInputForm = z.infer<typeof ChatInputSchema>;

function MessageBubble({ message }: { message: ChatMessage }) {
  const isAssistant = message.role === "assistant";
  return (
    <div
      className={cn(
        "flex gap-2 max-w-[85%]",
        isAssistant ? "self-start" : "self-end flex-row-reverse"
      )}
    >
      <div
        className={cn(
          "shrink-0 h-7 w-7 rounded-full flex items-center justify-center",
          isAssistant
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
        )}
        aria-hidden="true"
      >
        {isAssistant ? (
          <Bot className="h-4 w-4" />
        ) : (
          <User className="h-4 w-4" />
        )}
      </div>
      <div
        className={cn(
          "rounded-2xl px-3 py-2 text-sm leading-relaxed",
          isAssistant
            ? "bg-muted text-foreground rounded-tl-sm"
            : "bg-primary text-primary-foreground rounded-tr-sm"
        )}
        role={isAssistant ? "article" : undefined}
        aria-label={isAssistant ? "Assistant response" : undefined}
      >
        {message.content}
      </div>
    </div>
  );
}

export function WellnessChat() {
  const { state, addChatMessage, clearChat } = useWellnessStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChatInputForm>({
    resolver: zodResolver(ChatInputSchema),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.chatHistory]);

  const getContext = useCallback(() => {
    const recent = state.moodEntries[0];
    return {
      recentMoodLevel: recent?.moodLevel,
      recentTriggers: recent?.triggers,
    };
  }, [state.moodEntries]);

  const onSubmit = useCallback(
    async (data: ChatInputForm) => {
      setError(null);
      addChatMessage({ role: "user", content: data.message });
      reset();

      setIsLoading(true);
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: data.message,
            context: getContext(),
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(
            (errData as { error?: string }).error ?? "Chat unavailable"
          );
        }

        const result = await response.json() as { reply: string };
        addChatMessage({ role: "assistant", content: result.reply });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [addChatMessage, getContext, reset]
  );

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" aria-hidden="true" />
            Wellness Chat
          </CardTitle>
          {state.chatHistory.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              aria-label="Clear chat history"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
        <CardDescription>
          Talk to your AI wellness companion. Share what&apos;s on your mind.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 min-h-0 gap-4">
        <div
          className="flex flex-col gap-3 overflow-y-auto flex-1 pr-1"
          role="log"
          aria-label="Chat conversation"
          aria-live="polite"
          aria-relevant="additions"
        >
          {state.chatHistory.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <Bot className="h-12 w-12 text-muted-foreground/40" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Hi! I&apos;m your wellness companion.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Share how you&apos;re feeling, ask for coping strategies, or just talk.
                </p>
              </div>
              <div className="flex flex-col gap-1 w-full max-w-xs">
                {[
                  "I'm feeling overwhelmed with exams",
                  "How can I manage academic stress?",
                  "I haven't been sleeping well",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      void onSubmit({ message: suggestion });
                    }}
                    className="text-xs text-left rounded-md border border-border px-3 py-2 hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {state.chatHistory.map((msg) => (
            <MessageBubble key={`${msg.timestamp}-${msg.role}`} message={msg} />
          ))}

          {isLoading && (
            <div className="flex gap-2 max-w-[85%] self-start" aria-live="polite" aria-label="Assistant is thinking">
              <div className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center bg-primary/10">
                <Bot className="h-4 w-4 text-primary" aria-hidden="true" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-muted px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} aria-hidden="true" />
        </div>

        {error && (
          <p className="text-xs text-destructive" role="alert" aria-live="assertive">
            {error}
          </p>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex gap-2"
          aria-label="Send a message"
        >
          <Input
            {...register("message")}
            ref={(e) => {
              register("message").ref(e);
              (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
            }}
            placeholder="Type a message..."
            disabled={isLoading}
            maxLength={1000}
            aria-label="Chat message"
            aria-describedby={errors.message ? "chat-error" : undefined}
            className="flex-1"
            autoComplete="off"
          />
          <Button
            type="submit"
            disabled={isLoading}
            size="icon"
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </form>
        {errors.message && (
          <p id="chat-error" className="text-xs text-destructive" role="alert">
            {errors.message.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
