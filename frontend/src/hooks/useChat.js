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
 * sendMessage: (query: string) => Promise<void>,
 * clearHistory: () => Promise<void>
 * }}
 */
export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
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
    } catch (error) {
      setMessages([]);
    }
  }

  async function sendMessage(query) {
    if (!query.trim() || isStreaming) {
      return;
    }

    const userMessage = { role: "user", content: query, citations: [] };
    setMessages((current) => [...current, userMessage, { role: "assistant", content: "", citations: [] }]);
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
            next[next.length - 1] = { role: "assistant", content: draft, citations };
            return next;
          });
        },
        onCitation(citation) {
          citations = [...citations, citation];
          setMessages((current) => {
            const next = [...current];
            next[next.length - 1] = { role: "assistant", content: draft, citations };
            return next;
          });
        },
        async onDone() {
          streamRef.current?.close();
          streamRef.current = null;
          setIsStreaming(false);
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
                citations: response.citations || []
              };
              return next;
            });
          } catch (error) {
            toast.error("Unable to get a response from CubitaxAI");
            setMessages((current) => current.slice(0, -1));
          } finally {
            setIsStreaming(false);
            resolve();
          }
        }
      });
    });
  }

  async function clearHistory() {
    await api.chat.clearHistory(sessionId);
    setMessages([]);
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
    sendMessage,
    clearHistory
  };
}

