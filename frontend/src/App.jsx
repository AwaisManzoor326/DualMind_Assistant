import React, { useState, useEffect } from "react";
import ChatInterface from "./components/ChatInterface";
import Sidebar from "./components/Sidebar";

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRAG, setIsRAG] = useState(false);
  const [files, setFiles] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "/api";
      const res = await fetch(`${apiUrl}/chat/sessions`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setSessions(data);
        } else {
          console.error("Sessions API returned non-array:", data);
          setSessions([]);
        }
      }
    } catch (e) {
      console.error("Failed to fetch sessions", e);
      setSessions([]);
    }
  };

  const handleNewSession = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "/api";
      const res = await fetch(`${apiUrl}/chat/sessions`, { method: "POST" });
      if (res.ok) {
        const newSession = await res.json();
        setSessions([newSession, ...sessions]);
        setCurrentSessionId(newSession.id);
        setIsRAG(false);
        return newSession; // Return for auto-save logic
      }
    } catch (e) {
      console.error("Failed to create session", e);
    }
    return null;
  };

  const handleSelectSession = (id) => {
    setCurrentSessionId(id);
  };

  const handleDeleteSession = async (e, id) => {
    e.stopPropagation();
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "/api";
      await fetch(`${apiUrl}/chat/sessions/${id}`, { method: "DELETE" });
      setSessions(sessions.filter((s) => s.id !== id));
      if (currentSessionId === id) setCurrentSessionId(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Auto-switch to RAG mode when a file is uploaded successfully
  const handleFileUpload = (newFile) => {
    setFiles((prev) => [...prev, newFile]);
    if (newFile.status === "success") {
      setIsRAG(true);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-text">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        toggle={() => setIsSidebarOpen(!isSidebarOpen)}
        files={files}
        onFileUpload={handleFileUpload}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewSession={handleNewSession}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative h-full transition-all duration-300">
        <ChatInterface
          isRAG={isRAG}
          setIsRAG={setIsRAG}
          sessionId={currentSessionId}
          onNewSession={handleNewSession}
          onSessionUpdate={fetchSessions}
        />
      </main>
    </div>
  );
}

export default App;
