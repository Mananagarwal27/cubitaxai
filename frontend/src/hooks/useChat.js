import { useState, useRef, useCallback } from "react";
import apiClient from "../api/client";

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeStep, setActiveStep] = useState(null);
  const [stepTimings, setStepTimings] = useState({});
  const [plan, setPlan] = useState(null);
  const [critiqueScores, setCritiqueScores] = useState(null);
  const [needsReview, setNeedsReview] = useState(false);
  const eventSourceRef = useRef(null);

  const sendMessage = useCallback(async (query, sessionId, token) => {
    setMessages((prev) => [
      ...prev,
      { role: "user", content: query, created_at: new Date().toISOString() },
    ]);
    setIsStreaming(true);
    setActiveStep("planning_node");
    setNeedsReview(false);
    setPlan(null);
    setCritiqueScores(null);
    setStepTimings({});

    let fullAnswer = "";
    const citations = [];

    try {
      const url = new URL(`${apiClient.defaults.baseURL}/api/chat/stream`);
      url.searchParams.set("query", query);
      url.searchParams.set("session_id", sessionId);
      if (token) url.searchParams.set("token", token);

      const eventSource = new EventSource(url.toString());
      eventSourceRef.current = eventSource;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", citations: [], isStreaming: true },
      ]);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "step") {
          setActiveStep(data.data.agent);
          if (data.data.duration_ms) {
            setStepTimings((prev) => ({
              ...prev,
              [data.data.agent]: data.data.duration_ms,
            }));
          }
        }

        if (data.type === "plan") {
          setPlan(data.data);
        }

        if (data.type === "token") {
          fullAnswer += data.data;
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === "assistant") {
              updated[updated.length - 1] = { ...last, content: fullAnswer };
            }
            return updated;
          });
        }

        if (data.type === "citation") {
          citations.push(data.data);
        }

        if (data.type === "critique") {
          setCritiqueScores(data.data);
        }

        if (data.type === "needs_review") {
          setNeedsReview(true);
        }

        if (data.type === "done") {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === "assistant") {
              updated[updated.length - 1] = {
                ...last,
                content: fullAnswer,
                citations,
                isStreaming: false,
              };
            }
            return updated;
          });
          setIsStreaming(false);
          setActiveStep(null);
          eventSource.close();
        }
      };

      eventSource.onerror = (e) => {
        setIsStreaming(false);
        setActiveStep(null);
        eventSource.close();
        // Surface the error to the user if no answer was received
        if (!fullAnswer) {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === "assistant") {
              updated[updated.length - 1] = {
                ...last,
                content: "⚠️ Connection lost. This may be due to an authentication issue or server error. Please try again.",
                isStreaming: false,
              };
            }
            return updated;
          });
        }
      };
    } catch (err) {
      setIsStreaming(false);
      setActiveStep(null);
      console.error("Chat stream error:", err);
    }
  }, []);

  const stopStreaming = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      setIsStreaming(false);
      setActiveStep(null);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setPlan(null);
    setCritiqueScores(null);
    setNeedsReview(false);
    setStepTimings({});
  }, []);

  return {
    messages,
    setMessages,
    isStreaming,
    activeStep,
    stepTimings,
    plan,
    critiqueScores,
    needsReview,
    sendMessage,
    stopStreaming,
    clearMessages,
  };
}
