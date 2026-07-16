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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-border border-t-signal-teal animate-spin" />
          <p className="text-sm text-secondary">Loading conversations…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1
          className="text-3xl font-bold text-ink"
          style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
        >
          Chat History
        </h1>
        <p className="text-secondary mt-1 text-[15px]">
          Browse and review all visitor conversations.
        </p>
      </div>

      {conversations.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-soft-mint flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-signal-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-ink font-semibold mb-1">No conversations yet</p>
          <p className="text-sm text-secondary">Conversations will appear here once your bot receives messages.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv: any) => (
            <div
              key={conv.id}
              className="bg-card border border-border rounded-xl overflow-hidden shadow-sm"
            >
              <button
                onClick={() => loadThread(conv.id)}
                className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-paper transition-colors"
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-ink text-sm">
                      Session: {conv.session_id.substring(0, 8)}…
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      conv.resolved
                        ? 'bg-card text-ink'
                        : 'bg-red-50 text-error'
                    }`}>
                      {conv.resolved ? 'Resolved' : 'Needs Follow-up'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-secondary">
                    <span>{new Date(conv.started_at).toLocaleString()}</span>
                    <span>·</span>
                    <span>{conv.message_count} messages</span>
                  </div>
                </div>
                <svg
                  className={`w-4 h-4 text-secondary transition-transform shrink-0 ${expandedId === conv.id ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedId === conv.id && (
                <div className="px-6 py-5 bg-paper border-t border-border max-h-[500px] overflow-y-auto">
                  {threadLoading ? (
                    <div className="flex items-center justify-center py-6 gap-2 text-secondary text-sm">
                      <div className="w-4 h-4 rounded-full border-2 border-border border-t-signal-teal animate-spin" />
                      Loading thread…
                    </div>
                  ) : threadMessages.length === 0 ? (
                    <p className="text-center py-6 text-secondary text-sm">No messages in this thread.</p>
                  ) : (
                    <div className="space-y-4">
                      {threadMessages.map((msg: any, i: number) => (
                        <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                            msg.role === 'user'
                              ? 'bg-[#0a0a0a] text-gray-200 rounded-tr-sm'
                              : 'bg-card text-ink rounded-tl-sm border border-border/50'
                          }`}>
                            {msg.content}
                          </div>
                          <span className="text-[10px] text-secondary mt-1 px-1">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
