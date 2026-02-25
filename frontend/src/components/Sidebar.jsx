import React, { useState, useRef } from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Plus,
  MessageSquare,
  Trash2,
} from "lucide-react";

const Sidebar = ({
  isOpen,
  toggle,
  files,
  onFileUpload,
  sessions = [],
  currentSessionId,
  onNewSession,
  onSelectSession,
  onDeleteSession,
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "/api";
      const response = await fetch(`${apiUrl}/documents/upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onFileUpload({
          name: data.filename,
          status: "success",
          chunks: data.chunks,
        });
      } else {
        onFileUpload({ name: file.name, status: "error" });
      }
    } catch (error) {
      console.error(error);
      onFileUpload({ name: file.name, status: "error" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  return (
    <aside
      className={`
                ${isOpen ? "w-64" : "w-16"} 
                h-full bg-secondary border-r border-slate-800 transition-all duration-300 flex flex-col
            `}
    >
      <div className="p-4 flex items-center justify-between border-b border-slate-700">
        {isOpen && (
          <div className="flex items-center cursor-pointer justify-center transition-transform w-full">
            <img
              src="/logo2.png"
              alt="DualMind Logo"
              className="h-10 w-auto object-contain"
            />
            <span className="text-blue-400 font-semibold ">
              DualMind <span className="text-orange-300">Assistant</span>
            </span>
          </div>
        )}
        <button
          onClick={toggle}
          className="p-1 hover:bg-slate-700 rounded text-muted hover:text-white transition"
        >
          {isOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-6">
        {isOpen && (
          <>
            {/* Session Management */}
            <div>
              <button
                onClick={onNewSession}
                className="w-full flex items-center justify-center gap-2 p-3 bg-accent text-white rounded-lg shadow-lg shadow-accent/20 hover:bg-accent-hover transition-all mb-4 font-semibold text-sm"
              >
                <Plus size={18} />
                New Chat
              </button>

              <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                Recent Chats
              </h2>
              <div className="space-y-1 mb-6 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {Array.isArray(sessions) && sessions.length === 0 && (
                  <p className="text-xs text-muted italic">No chats yet.</p>
                )}
                {Array.isArray(sessions) &&
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => onSelectSession(session.id)}
                      className={`group flex items-center justify-between p-2 rounded cursor-pointer text-sm transition-colors ${currentSessionId === session.id ? "bg-slate-700 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <MessageSquare size={16} />
                        <span className="truncate">{session.title}</span>
                      </div>
                      <button
                        onClick={(e) => onDeleteSession(e, session.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            {/* Upload Section */}
            <div>
              <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                Knowledge Base
              </h2>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept=".txt,.pdf,.docx,.doc"
              />
              <button
                onClick={handleUploadClick}
                disabled={uploading}
                className={`w-full flex items-center gap-2 p-3 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-all ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Upload size={18} />
                )}
                <span className="text-sm font-medium">
                  {uploading ? "Processing..." : "Upload Document"}
                </span>
              </button>
            </div>

            {/* Recent Visuals */}
            <div>
              <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                Uploaded Docs
              </h2>
              <div className="space-y-1">
                {files.length === 0 && (
                  <p className="text-xs text-muted italic">No documents yet.</p>
                )}
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded hover:bg-slate-700/50 cursor-pointer text-slate-300 text-sm group"
                  >
                    <FileText
                      size={16}
                      className="text-muted group-hover:text-blue-400"
                    />
                    <span className="truncate flex-1">{file.name}</span>
                    {file.chunks !== undefined && (
                      <span className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded border border-slate-700">
                        {file.chunks} chunks
                      </span>
                    )}
                    {file.status === "success" ? (
                      <CheckCircle size={14} className="text-emerald-500" />
                    ) : (
                      <AlertCircle size={14} className="text-rose-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer / User */}
      <div className="p-4 border-t border-slate-700">
        {isOpen && (
          <div className="text-xs text-slate-500 text-center">
            Version 1.0.0
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
