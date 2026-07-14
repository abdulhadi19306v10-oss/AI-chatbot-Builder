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
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch documents on load and poll every 3 seconds
  useEffect(() => {
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

  return (
    <div ref={containerRef} className="grid gap-8 mt-8">
      {/* Knowledge Base Section */}
      <section className="manager-section p-8 border border-slate-200 rounded-2xl bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-6">Knowledge Base</h2>
        
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

        <form onSubmit={handleUpload} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <input 
            type="file" 
            accept=".pdf,.txt,.docx"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="flex-1 block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition cursor-pointer"
          />
          <button 
            type="submit" 
            disabled={uploading || files.length === 0}
            className="px-6 py-3 whitespace-nowrap bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-500/30 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : `Upload & Train (${files.length})`}
          </button>
        </form>
      </section>

      {/* Embed Code Section */}
      <section className="manager-section p-8 border border-slate-200 rounded-2xl bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h2 className="text-2xl font-semibold mb-2 text-slate-800">Deploy Widget</h2>
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
