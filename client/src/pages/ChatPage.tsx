import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Send, Loader2, AlertCircle, FileText, MessageSquare, Trash2, ArrowLeft, BookOpen } from 'lucide-react';
import { conversationService } from '../services/conversation.service';
import type { Conversation, Message, MessageSource } from '../types';

function SourceTag({ source }: { source: MessageSource }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-400 font-medium">
      <BookOpen className="h-3 w-3" />
      {source.documentTitle} · Page {source.pageNumber}
    </span>
  );
}

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'USER';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold ${
          isUser
            ? 'bg-brand-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
        }`}
      >
        {isUser ? 'You' : 'AI'}
      </div>

      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-brand-600 text-white rounded-tr-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm'
          }`}
        >
          {message.content}
        </div>

        {/* Source citations */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {message.sources.map((s, i) => (
              <SourceTag key={i} source={s} />
            ))}
          </div>
        )}

        <span className="text-xs text-gray-400 dark:text-gray-500 px-1">
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchData = useCallback(async () => {
    if (!conversationId) return;
    const [conv, msgs] = await Promise.all([
      conversationService.get(conversationId),
      conversationService.getMessages(conversationId),
    ]);
    setConversation(conv);
    setMessages(msgs);
  }, [conversationId]);

  useEffect(() => {
    setLoading(true);
    fetchData().catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [fetchData]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending || !conversationId) return;
    const content = input.trim();
    setInput('');
    setSending(true);
    setError('');

    // Optimistically show the user message
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      conversationId,
      role: 'USER',
      content,
      sources: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const assistantMsg = await conversationService.sendMessage(conversationId, content);
      // Replace temp message + add assistant response
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempUserMsg.id);
        // The user message was persisted – get it from the response or keep the temp
        return [...withoutTemp, tempUserMsg, assistantMsg];
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send message.');
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDelete = async () => {
    if (!conversationId) return;
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await conversationService.delete(conversationId);
      navigate('/dashboard');
    } catch {
      setError('Failed to delete conversation.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-md p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
            {conversation?.title ?? 'Chat'}
          </h1>
          {conversation?.document && (
            <Link
              to={`/documents/${conversation.document.id}`}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-brand-600 transition-colors mt-0.5"
            >
              <FileText className="h-3 w-3" />
              {conversation.document.title}
            </Link>
          )}
        </div>

        <button
          onClick={handleDelete}
          className="rounded-md p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Delete conversation"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 dark:text-gray-500 py-16">
            <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">Ask anything about this document.</p>
            <p className="text-xs mt-1 max-w-xs">
              Tip: Try "Summarize this document", "What are the main findings?" or "Explain the methodology."
            </p>
          </div>
        ) : (
          messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
        )}

        {sending && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-gray-100 dark:bg-gray-800 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              Thinking…
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3">
        <div className="mx-auto max-w-3xl flex items-end gap-3">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Auto-resize
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question… (Enter to send, Shift+Enter for new line)"
            disabled={sending}
            className="input flex-1 resize-none py-2.5 min-h-[42px]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="btn-primary flex-shrink-0 px-3 py-2.5"
            aria-label="Send message"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-1.5">
          Answers are grounded in the document content. Always verify important information.
        </p>
      </div>
    </div>
  );
}

