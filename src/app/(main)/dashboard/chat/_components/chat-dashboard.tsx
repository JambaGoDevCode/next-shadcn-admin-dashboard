"use client";

import * as React from "react";

import { io, type Socket } from "socket.io-client";
import { ArrowLeft, Circle, MessageCircle, Send } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

import {
  getChatDataAction,
  getChatMessagesAction,
  getChatRealtimeCredentialsAction,
  markChatReadAction,
  sendChatMessageAction,
  type ChatConversation,
  type ChatMessage,
  type ChatResult,
} from "./actions";

interface Props {
  initialResult: ChatResult<{ userId: number; conversations: ChatConversation[] }>;
}

function socketUrl(): string {
  const override = process.env.NEXT_PUBLIC_PELADEIRO_API_URL;
  if (override) return override.replace(/\/$/, "");
  return `${window.location.protocol}//${window.location.hostname}:3000`;
}

function formatTime(value: string | null): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function initials(conversation: ChatConversation): string {
  return `J${conversation.matchId}`.slice(0, 2).toUpperCase();
}

export function ChatDashboard({ initialResult }: Props) {
  const [conversations, setConversations] = React.useState(initialResult.ok ? initialResult.data.conversations : []);
  const [userId, setUserId] = React.useState(initialResult.ok ? initialResult.data.userId : null);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [draft, setDraft] = React.useState("");
  const [error, setError] = React.useState(initialResult.ok ? "" : initialResult.error);
  const [loadingMessages, setLoadingMessages] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const selected = conversations.find((conversation) => conversation.id === selectedId) ?? null;

  const refreshConversations = React.useCallback(async () => {
    const result = await getChatDataAction();
    if (result.ok) {
      setConversations(result.data.conversations);
      setUserId(result.data.userId);
      setError("");
    } else {
      setError(result.error);
    }
  }, []);

  const loadMessages = React.useCallback(async (conversationId: number) => {
    setLoadingMessages(true);
    const result = await getChatMessagesAction(conversationId);
    if (result.ok) {
      setMessages(result.data);
      setError("");
    } else {
      setMessages([]);
      setError(result.error);
    }
    setLoadingMessages(false);
  }, []);

  React.useEffect(() => {
    if (!selectedId) return;
    void loadMessages(selectedId);
    void markChatReadAction(selectedId).then(() => refreshConversations());
  }, [loadMessages, refreshConversations, selectedId]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  React.useEffect(() => {
    let disposed = false;
    let socket: Socket | null = null;
    void getChatRealtimeCredentialsAction().then((result) => {
      if (disposed || !result.ok) return;
      socket = io(socketUrl(), { auth: { token: result.data.accessToken }, transports: ["websocket", "polling"] });
      socket.on("chat:message", (event: { conversationId?: number }) => {
        void refreshConversations();
        if (event.conversationId && event.conversationId === selectedId) void loadMessages(event.conversationId);
      });
      socket.on("chat:opened", () => void refreshConversations());
      socket.on("chat:closed", () => {
        void refreshConversations();
        if (selectedId) void loadMessages(selectedId);
      });
    });
    return () => {
      disposed = true;
      socket?.disconnect();
    };
  }, [loadMessages, refreshConversations, selectedId]);

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !draft.trim() || sending || selected.status !== "OPEN") return;
    setSending(true);
    setError("");
    const result = await sendChatMessageAction(selected.id, draft.trim());
    if (result.ok) {
      setMessages((current) => current.some((message) => message.id === result.data.id) ? current : [...current, result.data]);
      setDraft("");
      void refreshConversations();
    } else {
      setError(result.error);
    }
    setSending(false);
  }

  return (
    <section className="flex h-[calc(100dvh-7rem)] min-h-[28rem] overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
      <aside className={`${selectedId ? "hidden md:flex" : "flex"} w-full shrink-0 flex-col border-r md:w-80`}>
        <div className="border-b p-4">
          <h1 className="text-lg font-semibold tracking-tight">Conversas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Mensagens das partidas</p>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          {conversations.length ? conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => setSelectedId(conversation.id)}
              className={`flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-muted/60 ${selectedId === conversation.id ? "bg-muted" : ""}`}
            >
              <Avatar className="size-10"><AvatarFallback>{initials(conversation)}</AvatarFallback></Avatar>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">Partida #{conversation.matchId}</span>
                  <span className="text-xs text-muted-foreground">{formatTime(conversation.lastMessageAt)}</span>
                </span>
                <span className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="truncate">Equipas {conversation.homeTeamId} · {conversation.awayTeamId}</span>
                  {conversation.unreadCount > 0 && <span className="rounded-full bg-primary px-1.5 py-0.5 text-primary-foreground">{conversation.unreadCount}</span>}
                </span>
              </span>
            </button>
          )) : (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <MessageCircle className="mb-3 size-8 text-muted-foreground" />
              <p className="text-sm font-medium">Ainda sem conversas</p>
              <p className="mt-1 text-xs text-muted-foreground">As conversas ficam disponíveis quando uma partida é confirmada.</p>
            </div>
          )}
        </ScrollArea>
      </aside>

      <div className={`${selectedId ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col`}>
        {selected ? <>
          <header className="flex items-center gap-3 border-b px-4 py-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedId(null)} aria-label="Voltar às conversas"><ArrowLeft /></Button>
            <Avatar className="size-9"><AvatarFallback>{initials(selected)}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-semibold">Partida #{selected.matchId}</h2>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Circle className={`size-2 fill-current ${selected.status === "OPEN" ? "text-emerald-500" : "text-muted-foreground"}`} />
                {selected.status === "OPEN" ? `Equipas ${selected.homeTeamId} · ${selected.awayTeamId}` : "Conversa encerrada"}
              </p>
            </div>
            <span className="hidden text-xs text-muted-foreground sm:block">{selected.status === "OPEN" ? `Disponível até ${new Intl.DateTimeFormat("pt-PT", { dateStyle: "short", timeStyle: "short" }).format(new Date(selected.closesAt))}` : "Só leitura"}</span>
          </header>

          <ScrollArea className="min-h-0 flex-1 bg-muted/20 px-4">
            <div className="mx-auto flex max-w-3xl flex-col gap-3 py-5">
              {loadingMessages ? <p className="py-10 text-center text-sm text-muted-foreground">A carregar mensagens…</p> : messages.length ? messages.map((message) => {
                const own = message.senderId === userId;
                if (message.type === "SYSTEM") return <p key={message.id} className="py-1 text-center text-xs text-muted-foreground">{message.content}</p>;
                return (
                  <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 sm:max-w-[70%] ${own ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border bg-card"}`}>
                      {message.type === "VOICE" && message.mediaUrl ? <audio controls src={message.mediaUrl} className="max-w-full" /> : <p className="whitespace-pre-wrap break-words text-sm">{message.content ?? ""}</p>}
                      <p className={`mt-1 text-right text-[10px] ${own ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{formatTime(message.createdAt)}</p>
                    </div>
                  </div>
                );
              }) : !error ? <div className="py-14 text-center text-sm text-muted-foreground">Esta conversa ainda não tem mensagens.</div> : null}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {error && <p role="alert" className="border-t px-4 py-2 text-sm text-destructive">{error}</p>}
          <form onSubmit={handleSend} className="flex items-end gap-2 border-t bg-background p-3 sm:p-4">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }}
              placeholder={selected.status === "OPEN" ? "Escreva uma mensagem…" : "Esta conversa foi encerrada"}
              aria-label="Mensagem"
              maxLength={2000}
              disabled={selected.status !== "OPEN" || sending}
              className="max-h-32 min-h-10 resize-none bg-muted/30 text-sm"
            />
            <Button type="submit" size="icon" aria-label="Enviar mensagem" disabled={!draft.trim() || sending || selected.status !== "OPEN"}>
              <Send />
            </Button>
          </form>
        </> : <div className="hidden flex-1 flex-col items-center justify-center gap-3 text-center md:flex">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted"><MessageCircle className="size-6 text-muted-foreground" /></div>
          <div><h2 className="text-sm font-medium">Selecione uma conversa</h2><p className="mt-1 text-sm text-muted-foreground">Escolha uma partida para ver as mensagens.</p></div>
        </div>}
      </div>
    </section>
  );
}
