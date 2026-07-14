"use client";
import { getBackendUrl } from "../lib/config";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";


export default function BotManager({ botId }: { botId: string }) {
  const { data: session } = useSession();
  const getToken = async () => (session as any)?.id_token || "test";
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [docs, setDocs] = useState<any[]>([]);
  const [widgetCode, setWidgetCode] = useState<string>('');
  const [botToken, setBotToken] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  
  const [botName, setBotName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [welcomeMsg, setWelcomeMsg] = useState('Hi! How can I help you today?');
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch bot data and documents on load
  useEffect(() => {
    async function loadBotData() {
      const token = await getToken();
      if (!token || token === "test") return;
      try {
        const res = await fetch(`${getBackendUrl()}/bots/${botId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setBotName(data.name || '');
          setAvatar(data.avatar || '');
          setColor(data.color || '#6366f1');
          setWelcomeMsg(data.welcome_msg || 'Hi! How can I help you today?');
        }
      } catch(e) {}
    }
    loadBotData();

    async function loadSnippet() {
      const token = await getToken();
      if (!token || token === "test") return;
      try {
        const res = await fetch(`${getBackendUrl()}/bots/${botId}/embed-snippet`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setWidgetCode(data.snippet);
          setBotToken(data.bot_token);
        }
      } catch (e) {}
    }
    loadSnippet();
    let interval: NodeJS.Timeout;
    async function loadDocs() {
      const token = await getToken();
      if (!token || token === "test") return;
      try {
        const res = await fetch(`${getBackendUrl()}/bots/${botId}/documents`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setDocs(data);
        }
      } catch (e) {}
    }
    
    loadDocs();
    interval = setInterval(loadDocs, 3000);
    return () => clearInterval(interval);
  }, [botId, session]);



  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;
    
    setUploading(true);
    try {
      const token = await getToken();
      
      // Upload all files concurrently
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${getBackendUrl()}/bots/${botId}/documents`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(`${file.name} failed: ${err?.detail || res.statusText}`);
        }
        return res.json();
      });

      const uploadedDocs = await Promise.all(uploadPromises);
      setDocs(prev => [...prev, ...uploadedDocs]);
      setFiles([]);
      alert(`Successfully uploaded ${uploadedDocs.length} document(s) and started processing!`);
      
    } catch (err: any) {
      console.error(err);
      alert(`Upload error: ${err.message || "Error connecting to server."}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      const token = await getToken();
      await fetch(`${getBackendUrl()}/bots/${botId}/documents/${docId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocs(prev => prev.filter(d => d.id !== docId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setSaveSuccess(false);
    try {
      const token = await getToken();
      const res = await fetch(`${getBackendUrl()}/bots/${botId}`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: botName,
          avatar: avatar,
          color: color,
          welcome_msg: welcomeMsg
        })
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert("Failed to save bot configuration.");
      }
    } catch(err) {
      alert("Error saving configuration.");
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-8 mt-8">
      <div className="flex gap-4">
        <a 
          href={`/bot/${botId}/conversations`}
          className="px-6 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
          Chat History
        </a>
        <a 
          href={`/bot/${botId}/analytics`}
          className="px-6 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          View Analytics
        </a>
      </div>
      {/* Configuration Section */}
      <section className="manager-section p-8 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight mb-6">Bot Configuration</h2>
        <form onSubmit={handleSaveConfig} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Bot Name</label>
              <input 
                type="text" 
                value={botName}
                onChange={e => setBotName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Avatar (Emoji)</label>
              <input 
                type="text" 
                maxLength={2}
                value={avatar}
                onChange={e => setAvatar(e.target.value)}
                placeholder="🤖"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Theme Color</label>
              <div className="flex gap-4 items-center">
                <input 
                  type="color" 
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="h-12 w-12 rounded-lg cursor-pointer border-0 p-0"
                />
                <input 
                  type="text" 
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Welcome Message</label>
              <textarea 
                value={welcomeMsg}
                onChange={e => setWelcomeMsg(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              type="submit" 
              disabled={savingConfig}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 disabled:opacity-50"
            >
              {savingConfig ? "Saving..." : "Save Configuration"}
            </button>
            {saveSuccess && <span className="text-emerald-600 font-medium flex items-center gap-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Saved!</span>}
          </div>
        </form>
      </section>

      {/* Knowledge Base Section */}
      <section className="manager-section p-8 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight mb-6">Knowledge Base</h2>
        
        {docs.length > 0 && (
          <div className="mb-6 space-y-3">
            {docs.map((doc, i) => (
              <div key={i} className="flex flex-col p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-700">{doc.filename}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      doc.status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                      doc.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {doc.status}
                    </span>
                    <button onClick={() => handleDeleteDoc(doc.id)} className="text-slate-400 hover:text-red-500 transition-colors" title="Delete document">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                </div>
                {doc.status === 'failed' && doc.error_message && (
                  <p className="text-xs text-red-500 mt-2 bg-red-50 p-2 rounded border border-red-100">{doc.error_message}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const droppedFiles = Array.from(e.dataTransfer.files);
              const validExtensions = ['.pdf', '.docx', '.txt'];
              const valid = droppedFiles.filter(f => {
                const ext = f.name.toLowerCase().substring(f.name.lastIndexOf('.'));
                return validExtensions.includes(ext);
              });
              if (valid.length !== droppedFiles.length) {
                alert("Only PDF, DOCX, and TXT files are accepted. Invalid files were ignored.");
              }
              if (valid.length > 0) {
                setFiles(valid);
              }
            }}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100/50 hover:border-slate-400'
            }`}
          >
            <input 
              type="file" 
              accept=".pdf,.txt,.docx"
              multiple
              onChange={(e) => {
                const selected = Array.from(e.target.files || []);
                setFiles(selected);
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title=""
            />
            <div className="pointer-events-none flex flex-col items-center gap-2">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
              <p className="text-slate-600 font-medium">
                Drag and drop your files here, or click to browse
              </p>
              <p className="text-xs text-slate-400">
                Supports PDF, DOCX, TXT
              </p>
            </div>
          </div>
          
          {files.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
              <span className="text-sm text-slate-600 font-medium">{files.length} file(s) selected</span>
              <button 
                type="submit" 
                disabled={uploading}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload & Train"}
              </button>
            </div>
          )}
        </form>
      </section>

      {/* Embed Code Section */}
      <section className="manager-section p-8 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h2 className="text-2xl font-semibold mb-2 text-slate-800 dark:text-slate-100">Deploy Widget</h2>
        <p className="text-slate-500 mb-6">Paste this code right before the closing <code className="bg-slate-100 px-1 py-0.5 rounded">&lt;/body&gt;</code> tag on your website.</p>
        
        <div className="relative">
          <pre className="bg-slate-900 text-slate-50 p-5 rounded-xl overflow-x-auto text-sm shadow-inner">
            <code>{widgetCode}</code>
          </pre>
          <button 
            onClick={() => navigator.clipboard.writeText(widgetCode)}
            className="absolute top-3 right-3 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition backdrop-blur-sm"
          >
            Copy
          </button>
        </div>

        <div className="mt-6 flex items-center justify-between p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
          <div>
            <h3 className="font-medium text-slate-800">Test Your Bot</h3>
            <p className="text-sm text-slate-500">View a live preview of your bot on a demo landing page.</p>
          </div>
          <a 
            href={`${getBackendUrl()}/widget/demo.html?bot_token=${botToken}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-md shadow-blue-500/20"
          >
            Open Live Demo
          </a>
        </div>
      </section>
    </div>
  );
}
