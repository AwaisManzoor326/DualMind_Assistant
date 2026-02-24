import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Mic,
  BarChart2,
  Volume2,
  VolumeX,
  StopCircle,
} from "lucide-react";
import AnalyticsDashboard from "./AnalyticsDashboard";
import ReactMarkdown from "react-markdown";
import { useSpeech } from "../hooks/useSpeech";

const ChatInterface = ({
  isRAG,
  setIsRAG,
  sessionId,
  onNewSession,
  onSessionUpdate,
}) => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am DualMind Assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("qwen"); // qwen or llama
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [metrics, setMetrics] = useState({ latency: 0, ragChunks: 0 });
  const [autoRead, setAutoRead] = useState(false); // TTS Auto-read toggle

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSpeaking,
    speak,
    stopSpeaking,
  } = useSpeech();

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Fill input with transcript when listening updates
    if (transcript) {
      // If we want real-time update:
      // setInput(prev => prev + " " + transcript);
      // But transcript in hook accumulates.
      // Let's simplistic approach: setInput to transcript (assuming clear on start)
      setInput(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    // Fetch history for specific session
    const fetchHistory = async () => {
      if (!sessionId) {
        setMessages([
          {
            role: "assistant",
            content:
              "Hello! I am DualMind Assistant. How can I help you today?",
          },
        ]);
        return;
      }

      try {
        const apiUrl = import.meta.env.VITE_API_URL || "/api";
        const res = await fetch(`${apiUrl}/chat/sessions/${sessionId}`);
        if (res.ok) {
          const history = await res.json();
          if (history.length > 0) {
            setMessages(history);
          } else {
            setMessages([
              {
                role: "assistant",
                content: "Start a new conversation!",
              },
            ]);
          }
        }
      } catch (e) {
        console.error("Failed to load history", e);
      }
    };
    fetchHistory();
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-read effect: triggered when a new assistant message *completes* loading
  // This is tricky with streaming. We can check when isLoading flips to false,
  // and the last message is assistant.
  useEffect(() => {
    if (!isLoading && autoRead && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "assistant") {
        speak(lastMsg.content);
      }
    }
  }, [isLoading, autoRead, messages, speak]);

  const handleSend = async () => {
    if (!input.trim()) return;

    if (isListening) stopListening(); // Ensure mic is off

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    const startTime = Date.now();

    let activeSessionId = sessionId;
    if (!activeSessionId) {
      // Auto-create session if none exists
      try {
        if (onNewSession) {
          const newSession = await onNewSession();
          if (newSession) {
            activeSessionId = newSession.id;
          }
        }
      } catch (e) {
        console.error("Failed to auto-create session", e);
      }
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "/api";
      const response = await fetch(`${apiUrl}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          model: selectedModel,
          use_rag: isRAG,
          session_id: activeSessionId,
        }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = { role: "assistant", content: "" };

      setMessages((prev) => [...prev, assistantMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantMsg.content += chunk;

        // Check for metrics tag
        if (assistantMsg.content.includes("[METRICS:")) {
          const parts = assistantMsg.content.split("[METRICS:");
          if (parts.length > 1) {
            const contentPart = parts[0];
            const metricsPart = parts[1].split("]")[0]; // naive parsing

            assistantMsg.content = contentPart.trim(); // Remove metrics from display

            try {
              const parsedMetrics = JSON.parse(metricsPart);
              setMetrics((prev) => ({
                ...prev,
                ragChunks: parsedMetrics.rag_chunks,
              }));
            } catch (e) {
              console.error("Failed to parse metrics", e);
            }
          }
        }

        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { ...assistantMsg };
          return newMessages;
        });
      }

      setMetrics((prev) => ({ ...prev, latency: Date.now() - startTime }));
      if (onSessionUpdate) onSessionUpdate(); // Refresh sidebar titles
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Error communicating with server. Please check if the backend is running.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header: Controls */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-background/80 backdrop-blur-md z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-secondary p-1 rounded-lg border border-slate-700">
            <button
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all uppercase tracking-wide ${selectedModel === "qwen" ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-muted hover:text-white hover:bg-slate-700/50"}`}
              onClick={() => setSelectedModel("qwen")}
            >
              Qwen 2.5
            </button>
            <button
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all uppercase tracking-wide ${selectedModel === "llama" ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-muted hover:text-white hover:bg-slate-700/50"}`}
              onClick={() => setSelectedModel("llama")}
            >
              Llama 3.2
            </button>
          </div>

          <button
            onClick={() => setIsRAG(!isRAG)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${isRAG ? "bg-emerald-900/20 border-emerald-500/50 text-emerald-400" : "bg-secondary border-slate-700 text-muted hover:border-slate-600"}`}
          >
            <div
              className={`w-2 h-2 rounded-full ${isRAG ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-slate-600"}`}
            />
            <span className="text-xs font-medium">RAG Mode</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-Read Toggle */}
          <button
            onClick={() => {
              setAutoRead(!autoRead);
              if (isSpeaking) stopSpeaking();
            }}
            className={`p-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${autoRead ? "text-accent bg-accent/10 ring-1 ring-accent/50" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}
            title={autoRead ? "Auto-read On" : "Auto-read Off"}
          >
            {autoRead ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span className="text-xs font-semibold hidden md:inline">
              {autoRead ? "Read ON" : "Read OFF"}
            </span>
          </button>

          <button
            onClick={() => setShowAnalytics(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Analytics"
          >
            <BarChart2 size={18} />
          </button>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded ${isRAG ? "bg-emerald-900/30 text-emerald-400 ring-1 ring-emerald-500/50" : "text-muted ring-1 ring-slate-700"}`}
          >
            {isRAG ? "RAG ON" : "RAG OFF"}
          </span>
        </div>

        {/* Stats Stub */}
        <div className="hidden md:flex gap-4 text-xs font-mono text-muted">
          <span>
            Lat:{" "}
            <span className="text-slate-300">
              {(metrics.latency || 0).toFixed(0)} ms
            </span>
          </span>
        </div>
      </header>

      <AnalyticsDashboard
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        metrics={metrics}
      />

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-muted opacity-50 select-none">
            <img
              src="/logo.png"
              alt="DualMind"
              className="w-20 h-20 mb-6 opacity-80"
            />
            <p>Select a model and start chatting</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300 group`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden">
                <img
                  src="/logo2.png"
                  alt="AI"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div className="flex flex-col gap-1 max-w-[85%] md:max-w-[75%] items-start">
              <div
                className={`rounded-2xl px-5 py-3.5 shadow-sm ${
                  msg.role === "user"
                    ? "bg-accent text-white rounded-br-none"
                    : "bg-secondary text-slate-200 border border-slate-700/50 rounded-bl-none"
                }`}
              >
                <div className="leading-relaxed text-sm whitespace-pre-wrap markdown-content">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
              {msg.role === "assistant" && (
                <button
                  onClick={() => speak(msg.content)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-500 hover:text-white"
                  title="Read aloud"
                >
                  <Volume2 size={14} />
                </button>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white flex-shrink-0 mt-1">
                <User size={16} />
              </div>
            )}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-4 justify-start fade-in pl-1">
            <div className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img
                src="/logo.png"
                alt="AI"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="bg-secondary px-4 py-3 rounded-2xl rounded-bl-none border border-slate-700/50 flex items-center gap-1.5 h-10 w-16 justify-center">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.1s]"></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-800 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={isListening ? "Listening..." : "Message DualMind..."}
            className={`w-full bg-secondary/50 border hover:border-slate-600 focus:border-accent rounded-xl py-3.5 pl-4 pr-32 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accent transition-all shadow-sm text-sm ${isListening ? "border-red-500/50 ring-1 ring-red-500/20" : "border-slate-700"}`}
            disabled={isLoading}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              onClick={handleMicClick}
              className={`p-2 rounded-lg transition-colors ${isListening ? "text-red-500 bg-red-500/10 animate-pulse" : "text-muted hover:text-white hover:bg-slate-700"}`}
              title="Voice Input"
            >
              {isListening ? <StopCircle size={18} /> : <Mic size={18} />}
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`p-2 rounded-lg transition-all ${input.trim() && !isLoading ? "bg-accent text-white shadow-md hover:bg-accent-hover" : "bg-transparent text-slate-600 cursor-not-allowed"}`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
        <div className="text-center mt-2 text-[10px] text-muted uppercase tracking-widest opacity-60">
          AI agent powered by Hugging Face
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
