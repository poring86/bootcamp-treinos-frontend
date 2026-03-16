"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useQueryStates, parseAsBoolean, parseAsString } from "nuqs";
import { Sparkles, X, ArrowUp, LoaderPinwheel } from "lucide-react";
import { Streamdown } from "streamdown";
import "streamdown/styles.css";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const SUGGESTED_MESSAGES = ["Monte meu plano de treino"];

const chatFormSchema = z.object({
  message: z.string().min(1),
});

type ChatFormValues = z.infer<typeof chatFormSchema>;

function sanitizeAiText(text: string): string {
  // Remove patterns like <function=...>, {"tool_name": ...}, etc.
  return text
    .replace(/<function[\s\S]*?>/g, "")
    .replace(/<tool_call[\s\S]*?>/g, "")
    // Hide JSON-like blocks that look like internal states
    .replace(/\{"[\s\S]*?"\}/g, "")
    .trim();
}

interface ChatProps {
  embedded?: boolean;
  initialMessage?: string;
}

export function Chat({ embedded = false, initialMessage }: ChatProps) {
  const [chatParams, setChatParams] = useQueryStates({
    chat_open: parseAsBoolean.withDefault(false),
    chat_initial_message: parseAsString,
  });

  const router = useRouter();
  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({
      api: `${process.env.NEXT_PUBLIC_API_URL}/ai`,
      credentials: "include",
    }),
    maxSteps: 20,
    onFinish: (message) => {
      // Check if this message (or any previous) has the creation result
      const hasCreation = message.role === "assistant" && message.parts?.some(
        (p: any) => p.type === "tool-invocation" && p.toolInvocation.toolName === "createWorkoutPlan" && p.toolInvocation.state === "result"
      );
      if (hasCreation && embedded) {
        setTimeout(() => {
          window.location.assign("/");
        }, 5000);
      }
    }
  });

  const onboardingCompleted = messages.some(
    (m) =>
      m.role === "assistant" &&
      m.parts?.some(
        (p: any) =>
          (p.type === "tool-invocation" &&
            p.toolInvocation.toolName === "createWorkoutPlan" &&
            p.toolInvocation.state === "result") ||
          (p.type === "text" &&
            (p.text.toLowerCase().includes("treino criado") ||
              p.text.toLowerCase().includes("plano pronto") ||
              p.text.toLowerCase().includes("acesse seu treino")))
      )
  );

  const form = useForm<ChatFormValues>({
    resolver: zodResolver(chatFormSchema),
    defaultValues: { message: "" },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialMessageSentRef = useRef(false);

  useEffect(() => {
    if (embedded && initialMessage && !initialMessageSentRef.current) {
      initialMessageSentRef.current = true;
      sendMessage({ text: initialMessage });
    }
  }, [embedded, initialMessage, sendMessage]);

  useEffect(() => {
    if (onboardingCompleted && embedded) {
      const timer = setTimeout(() => {
        window.location.assign("/");
      }, 5000); // 5 seconds to be safe
      return () => clearTimeout(timer);
    }
  }, [onboardingCompleted, embedded]);

  useEffect(() => {
    if (
      !embedded &&
      chatParams.chat_open &&
      chatParams.chat_initial_message &&
      !initialMessageSentRef.current
    ) {
      initialMessageSentRef.current = true;
      sendMessage({ text: chatParams.chat_initial_message });
      setChatParams({ chat_initial_message: null });
    }
  }, [
    embedded,
    chatParams.chat_open,
    chatParams.chat_initial_message,
    sendMessage,
    setChatParams,
  ]);

  useEffect(() => {
    if (!embedded && !chatParams.chat_open) {
      initialMessageSentRef.current = false;
    }
  }, [embedded, chatParams.chat_open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleClose = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    try {
      stop();
    } catch (err) { }

    if (embedded) {
      window.location.assign("/");
    } else {
      setChatParams({ chat_open: false, chat_initial_message: null });
    }
  };

  if (!chatParams.chat_open && !embedded) return null;

  const onSubmit = (values: ChatFormValues) => {
    sendMessage({ text: values.message });
    form.reset();
  };

  const handleSuggestion = (text: string) => {
    sendMessage({ text });
  };

  const isStreaming = status === "streaming";
  const isLoading = status === "submitted" || isStreaming;

  const chatContent = (
    <div
      className={
        embedded
          ? "flex h-svh flex-col bg-background"
          : "flex flex-1 flex-col overflow-hidden rounded-[20px] bg-background"
      }
    >
      <div className="relative z-50 flex h-[72px] shrink-0 items-center justify-between border-b border-border bg-background px-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="size-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-heading text-sm font-semibold text-foreground">
              Coach AI
            </h2>
            <p className="font-heading text-[10px] font-medium text-primary">
              Online
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="relative z-[60] hover:bg-accent hover:text-accent-foreground"
        >
          <X className="size-5 text-foreground" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto pb-5">
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "assistant"
                ? "flex flex-col items-start pl-5 pr-[60px] pt-5"
                : "flex flex-col items-end pl-[60px] pr-5 pt-5"
            }
          >
            <div
              className={
                message.role === "assistant"
                  ? "rounded-xl bg-secondary p-3"
                  : "rounded-xl bg-primary p-3"
              }
            >
              {message.role === "assistant" ? (
                message.parts.map((part, index) =>
                  part.type === "text" ? (
                    <Streamdown
                      key={index}
                      isAnimating={
                        isStreaming &&
                        messages[messages.length - 1]?.id === message.id
                      }
                      className="font-heading text-sm leading-relaxed text-foreground"
                    >
                      {sanitizeAiText(part.text)}
                    </Streamdown>
                  ) : part.type === "tool-invocation" ? (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-primary"
                    >
                      <LoaderPinwheel className="size-4 animate-spin" />
                      <span className="font-heading text-xs font-medium">
                        {part.toolInvocation.toolName === "createWorkoutPlan"
                          ? "Montando seu treino personalizado..."
                          : part.toolInvocation.toolName ===
                            "updateUserTrainData"
                            ? "Salvando seus dados..."
                            : "Processando..."}
                      </span>
                    </div>
                  ) : null
                )
              ) : (
                <p className="font-heading text-sm leading-relaxed text-primary-foreground">
                  {message.parts
                    .filter((part) => part.type === "text")
                    .map(
                      (part) =>
                        (part as { type: "text"; text: string }).text
                    )
                    .join("")}
                </p>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex shrink-0 flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex gap-2.5 overflow-x-auto px-5">
            {SUGGESTED_MESSAGES.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestion(suggestion)}
                className="whitespace-nowrap rounded-full bg-primary/10 px-4 py-2 font-heading text-sm text-foreground"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {embedded && onboardingCompleted && (
          <div className="mx-5 mb-2 flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center animate-in fade-in slide-in-from-bottom-2">
            <p className="font-heading text-sm font-medium text-foreground">
              Seu plano de treino foi criado com sucesso! 🎉
            </p>
            <Button size="sm" className="w-full" asChild>
              <Link href="/">Acessar meu Treino</Link>
            </Button>
          </div>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex items-center gap-2 border-t border-border p-5"
          >
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Digite sua mensagem"
                      className="rounded-full border-border bg-secondary px-4 py-3 font-heading text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={!form.watch("message").trim() || isLoading}
              size="icon"
              className="size-[42px] shrink-0 rounded-full"
            >
              <ArrowUp className="size-5" />
            </Button>
            {embedded && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-foreground"
                onClick={handleClose}
              >
                <X className="size-4" />
              </Button>
            )}
          </form>
        </Form>

        {/* Informational Message when embedded and no messages yet */}
        {embedded && messages.length === 0 && !initialMessage && (
          <div className="flex flex-1 items-center justify-center p-6 text-center">
            <div className="max-w-[280px] space-y-4">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="size-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-heading text-lg font-semibold">
                  Seu Coach FIT.AI
                </h3>
                <p className="text-sm text-muted-foreground">
                  Estou aqui para criar seu plano de treino ideal. Vamos começar?
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => sendMessage({ text: "Monte meu plano de treino" })}
                  className="w-full"
                >
                  Montar meu Plano
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="text-xs text-muted-foreground hover:underline"
                  onClick={handleClose}
                >
                  Ou pular e ir para a área principal
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div >
  );

  if (embedded) {
    return chatContent;
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-foreground/30"
        onClick={handleClose}
      />

      <div className="absolute inset-x-4 bottom-4 top-40 flex flex-col">
        {chatContent}
      </div>
    </div>
  );
}
