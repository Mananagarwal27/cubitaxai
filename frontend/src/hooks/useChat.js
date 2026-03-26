import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import { api } from "../api/client";

function createSessionId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `session-${Date.now()}`;
}

/**
 * Manage dashboard chat history, streaming state, and message submission.
 * @returns {{
 * messages: Array,
 * isStreaming: boolean,
 * sessionId: string,
 * lastInteractionAt: string | null,
 * lastError: string,
 * sendMessage: (query: string) => Promise<void>,
 * clearHistory: () => Promise<void>
 * }}
 */
export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastInteractionAt, setLastInteractionAt] = useState(null);
  const [lastError, setLastError] = useState("");
  const [sessionId] = useState(() => {
    const existing = sessionStorage.getItem("cubitax_chat_session");
    if (existing) {
      return existing;
    }
    const next = createSessionId();
    sessionStorage.setItem("cubitax_chat_session", next);
    return next;
  });
  const streamRef = useRef(null);

  async function loadHistory() {
    try {
      const response = await api.chat.getHistory(sessionId);
      setMessages(response.messages || []);
      const latestMessage = response.messages?.[response.messages.length - 1];
      setLastInteractionAt(latestMessage?.created_at || null);
    } catch (error) {
      setMessages([]);
    }
  }

  async function sendMessage(query) {
    if (!query.trim() || isStreaming) {
      return;
    }

    const createdAt = new Date().toISOString();
    const userMessage = { role: "user", content: query, citations: [], created_at: createdAt };
    setLastError("");
    setMessages((current) => [
      ...current,
      userMessage,
      { role: "assistant", content: "", citations: [], created_at: createdAt }
    ]);
    setIsStreaming(true);

    await new Promise((resolve) => {
      let draft = "";
      let citations = [];

      streamRef.current = api.chat.streamMessage({
        query,
        sessionId,
        onToken(token) {
          draft += token;
          setMessages((current) => {
            const next = [...current];
            next[next.length - 1] = { role: "assistant", content: draft, citations, created_at: createdAt };
            return next;
          });
        },
        onCitation(citation) {
          citations = [...citations, citation];
          setMessages((current) => {
            const next = [...current];
            next[next.length - 1] = { role: "assistant", content: draft, citations, created_at: createdAt };
            return next;
          });
        },
        async onDone() {
          streamRef.current?.close();
          streamRef.current = null;
          setIsStreaming(false);
          setLastInteractionAt(new Date().toISOString());
          resolve();
        },
        async onError() {
          streamRef.current?.close();
          streamRef.current = null;
          try {
            const response = await api.chat.sendMessage({ query, session_id: sessionId });
            setMessages((current) => {
              const next = [...current];
              next[next.length - 1] = {
                role: "assistant",
                content: response.answer,
                citations: response.citations || [],
                created_at: createdAt,
                query_type: response.query_type
              };
              return next;
            });
            setLastInteractionAt(new Date().toISOString());
          } catch (error) {
            setLastError("Assistant response unavailable");
            toast.error("Unable to get a response from CubitaxAI");
            setMessages((current) => {
              const next = [...current];
              next[next.length - 1] = {
                role: "assistant",
                content: "I could not complete the response. Please retry in a few seconds or narrow the question.",
                citations: [],
                created_at: createdAt
              };
              return next;
            });
          } finally {
            setIsStreaming(false);
            resolve();
          }
        }
      });
    });
  }

  async function clearHistory() {
    streamRef.current?.close();
    streamRef.current = null;
    await api.chat.clearHistory(sessionId);
    setMessages([]);
    setLastError("");
    setLastInteractionAt(null);
  }

  useEffect(() => {
    loadHistory();
    return () => {
      streamRef.current?.close();
    };
  }, [sessionId]);

  return {
    messages,
    isStreaming,
    sessionId,
    lastInteractionAt,
    lastError,
    sendMessage,
    clearHistory
  };
}
