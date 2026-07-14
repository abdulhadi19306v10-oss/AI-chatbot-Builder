"use client";
import { getBackendUrl } from "../lib/config";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function ChatHistoryList({ botId }: { botId: string }) {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadMessages, setThreadMessages] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const token = (session as any)?.id_token || "test";
      if (!token || token === "test") return;
      try {
        const res = await fetch(`${getBackendUrl()}/bots/${botId}/conversations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setConversations(await res.json());
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    }
    if (session) loadData();
  }, [botId, session]);

  const loadThread = async (convId: string) => {
    if (expandedId === convId) {
      setExpandedId(null);
      return;
    }
    
    setExpandedId(convId);
    setThreadLoading(true);
    setThreadMessages([]);
    
    const token = (session as any)?.id_token || "test";
    try {
      const res = await fetch(`${getBackendUrl()}/bots/${botId}/conversations/${convId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setThreadMessages(data.messages);
      }
    } catch (e) {
    } finally {
      setThreadLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-slate-500">Loading conversations...</div>;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-8">
      {conversations.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-2xl shadow-sm border border-slate-200 text-center text-slate-500">
          No conversations found yet.
        </div>
      ) : (
        conversations.map((conv: any) => (
          <div key={conv.id} className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-200 overflow-hidden transition-all">
            <button 
              onClick={() => loadThread(conv.id)}
              className="w-full text-left px-6 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-800">Session: {conv.session_id.substring(0,8)}...</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    conv.resolved 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {conv.resolved ? 'Resolved' : 'Needs Follow-up'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span>{new Date(conv.started_at).toLocaleString()}</span>
                  <span>•</span>
                  <span>{conv.message_count} messages</span>
                </div>
              </div>
              <svg className={`w-5 h-5 text-slate-400 transition-transform ${expandedId === conv.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            
            {expandedId === conv.id && (
              <div className="px-6 py-6 bg-slate-50 border-t border-slate-200 max-h-[500px] overflow-y-auto">
                {threadLoading ? (
                  <div className="text-center py-4 text-slate-400 animate-pulse">Loading thread...</div>
                ) : threadMessages.length === 0 ? (
                  <div className="text-center py-4 text-slate-400">No messages in this thread.</div>
                ) : (
                  <div className="space-y-4">
                    {threadMessages.map((msg: any, i: number) => (
                      <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                          msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-tr-sm' 
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                        }`}>
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
