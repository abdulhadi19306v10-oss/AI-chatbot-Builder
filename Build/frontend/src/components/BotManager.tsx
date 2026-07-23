"use client";
import { getBackendUrl } from "../lib/config";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Joyride } from "react-joyride";
import { useOnboarding } from "@/components/OnboardingProvider";
import { OnboardingTooltip, joyrideStyles, useReducedMotion } from "@/components/OnboardingTour";
import { useSearchParams } from "next/navigation";

type Tab = "configuration" | "knowledge" | "deploy";

export default function BotManager({ botId }: { botId: string }) {
  const { data: session } = useSession();
  const getToken = async () => (session as any)?.id_token || "test";
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [docs, setDocs] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Stable boolean so useMemo dep and step body use the exact same value
  const hasReadyDoc = docs.length > 0 && docs.some((d: any) => d.status === "ready");

  const steps = useMemo(() => [
    {
      target: "#tour-bot-name",
      title: "Bot Name",
      content: "Give your bot a name your visitors will recognize.",
      spotlightRadius: 8,
    },
    {
      target: "#tour-bot-appearance",
      title: "Appearance & Brand",
      content: "Match your bot's look and style to your brand.",
      spotlightRadius: 8,
    },
    {
      target: "#tour-bot-welcome",
      title: "Welcome Message",
      content: "This is the first message your visitors will see.",
      spotlightRadius: 8,
    },
    {
      target: "#tour-bot-save",
      title: "Save Changes",
      content: "Save your bot's settings before moving on.",
      spotlightRadius: 8,
    },
    {
      target: "#tour-kb-upload",
      title: "Upload Knowledge Base",
      content: "Upload FAQ documents, PDF, DOCX or TXT files. Your bot learns from these automatically.",
      spotlightRadius: 8,
    },
    {
      target: "#tour-kb-status",
      title: "Training Status",
      content: "Once this shows 'Ready', your bot can answer questions using the document.",
      showNextButton: hasReadyDoc,
      spotlightRadius: 8,
    },
    {
      target: "#tour-deploy-copy",
      title: "Copy Embed Snippet",
      content: "Copy this script tag and paste it into your website right before the </body> tag.",
      spotlightRadius: 8,
    },
    {
      target: "#tour-deploy-preview",
      title: "Test Your Chatbot",
      content: "Open the live demo page to test your chatbot interface.",
      spotlightRadius: 8,
    },
    {
      target: "body",
      placement: "center",
      title: "All Set! 🎉",
      content: "Your custom chatbot is now ready. Replay this tour anytime from the menu.",
    }
  ], [hasReadyDoc]);


  const {
    runTour: globalRunTour,
    currentStep,
    updateStep,
    completeOnboarding,
    setRunTour,
  } = useOnboarding();
  const reducedMotion = useReducedMotion();
  const searchParams = useSearchParams();

  // Honour ?tour=1 — used by Replay Tour and post-bot-creation routing.
  // Depend on the param value so this re-fires if the URL changes while
  // BotManager is already mounted (e.g. user clicks Replay Tour on the same page).
  const tourParam = searchParams.get("tour");
  useEffect(() => {
    if (tourParam === "1") {
      setRunTour(true);
      // Remove param from URL without triggering navigation
      const url = new URL(window.location.href);
      url.searchParams.delete("tour");
      window.history.replaceState(null, "", url.toString());
    }
  }, [tourParam, setRunTour]);

  const [activeTab, setActiveTab] = useState<Tab>("configuration");

  // Track active tab matching step
  useEffect(() => {
    if (!globalRunTour) return;
    if (currentStep >= 2 && currentStep <= 5) {
      setActiveTab("configuration");
    } else if (currentStep === 6 || currentStep === 7) {
      setActiveTab("knowledge");
    } else if (currentStep >= 8) {
      setActiveTab("deploy");
    }
  }, [currentStep, globalRunTour]);

  // Auto-advance step 6 to 7 when document is uploaded
  useEffect(() => {
    if (globalRunTour && currentStep === 6 && docs.length > 0) {
      updateStep(7);
    }
  }, [docs.length, currentStep, globalRunTour, updateStep]);

  // Skip step 7 if there are no docs
  useEffect(() => {
    if (globalRunTour && currentStep === 7) {
      if (docs.length === 0) {
        updateStep(8);
      }
    }
  }, [docs.length, currentStep, globalRunTour, updateStep]);

  const handleJoyrideCallback = useCallback(async (data: any) => {
    const { action, index, status, type, size } = data;
    const isLastStep = index === size - 1;

    // Only advance/retreat when not on the last step to avoid writing step 11+
    if (type === "step:after" && !isLastStep && (action === "next" || action === "prev")) {
      const nextIndex = action === "next" ? index + 1 + 2 : index - 1 + 2;
      await updateStep(nextIndex);
    }

    if (status === "skipped" || status === "finished" || status === "error" || type === "error:target_not_found") {
      await completeOnboarding();
    }
  }, [updateStep, completeOnboarding]);

  const [iframeKey, setIframeKey] = useState(0);
  const [widgetCode, setWidgetCode] = useState<string>('');
  const [botToken, setBotToken] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isAvatarDragging, setIsAvatarDragging] = useState(false);
  const [copied, setCopied] = useState(false);

  const [botName, setBotName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [welcomeMsg, setWelcomeMsg] = useState('Hi! How can I help you today?');
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch bot data and documents on load
  useEffect(() => {
    async function loadBotData() {
      const token = await getToken();
      if (!token || token === "test") return;
      try {
        const res = await fetch(`${getBackendUrl()}/bots/${botId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          console.error("Failed to load bot data:", res.status, res.statusText);
          return;
        }
        const data = await res.json();
        setBotName(data.name || '');
        setAvatar(data.avatar || '');
        setColor(data.color || '#6366f1');
        setWelcomeMsg(data.welcome_msg || 'Hi! How can I help you today?');
      } catch(e) { console.error("Failed to load bot data:", e); }
    }
    loadBotData();

    async function loadSnippet() {
      const token = await getToken();
      if (!token || token === "test") return;
      try {
        const res = await fetch(`${getBackendUrl()}/bots/${botId}/embed-snippet`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          console.error("Failed to load embed snippet:", res.status, res.statusText);
          return;
        }
        const data = await res.json();
        setWidgetCode(data.snippet);
        setBotToken(data.bot_token);
      } catch (e) { console.error("Failed to load embed snippet:", e); }
    }
    loadSnippet();

    async function loadDocs() {
      const token = await getToken();
      if (!token || token === "test") return;
      try {
        const res = await fetch(`${getBackendUrl()}/bots/${botId}/documents`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          console.error("Failed to load documents:", res.status, res.statusText);
          return;
        }
        const data = await res.json();
        setDocs(data);
      } catch (e) { console.error("Failed to load documents:", e); }
    }

    loadDocs();
    const interval = setInterval(loadDocs, 3000);
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
        setIframeKey(k => k + 1);
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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(widgetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAvatarUpload = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be smaller than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatar(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "configuration", label: "Configuration" },
    { id: "knowledge", label: "Knowledge Base" },
    { id: "deploy", label: "Deploy Widget" },
  ];

  const inputClass =
    "w-full px-4 py-3 rounded-lg border border-border bg-card text-inkink placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-signal-teal focus:border-signal-teal transition text-sm";
  const labelClass = "block text-sm font-bold text-ink mb-1.5";
  const JoyrideComponent = Joyride as any;

  return (
    <div className="space-y-6 relative">

      {mounted && (
        <JoyrideComponent
          steps={steps as any[]}
          run={globalRunTour && currentStep >= 2 && currentStep <= 10}
          stepIndex={currentStep - 2}
          onEvent={handleJoyrideCallback}
          continuous={true}
          spotlightClicks={true}
          disableOverlay={true}
          tooltipComponent={OnboardingTooltip}
          styles={joyrideStyles as any}
          disableOverlayAnimate={reducedMotion}
          disableScrollParentAnimate={reducedMotion}
        />
      )}
      {/* Page heading */}
      <div>
        <h1
          className="text-3xl font-bold text-ink"
          style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
        >
          Customize Your Bot
        </h1>
        <p className="text-secondary mt-1 text-[15px]">
          Configure settings, upload documents, and deploy your widget.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`tour-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? "bg-signal-teal text-white shadow-sm"
                : "text-signal-teal hover:text-teal-dark hover:bg-[#F5F5F3]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Configuration tab ─────────────────────────── */}
      {activeTab === "configuration" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form — left */}
          <div className="lg:col-span-3 bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2
              className="text-lg font-bold text-ink mb-6"
              style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
            >
              Bot Configuration
            </h2>
            <form onSubmit={handleSaveConfig} className="space-y-5">
              <div id="tour-bot-appearance" className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-5">
                  <div>
                    <label className={labelClass}>Bot Name</label>
                    <input
                      id="tour-bot-name"
                      type="text"
                      value={botName}
                      onChange={e => setBotName(e.target.value)}
                      required
                      className={inputClass}
                      placeholder="My Bot"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Theme Color</label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={color}
                        onChange={e => setColor(e.target.value)}
                        className="h-11 w-11 rounded-lg cursor-pointer border border-border p-0.5"
                      />
                      <input
                        type="text"
                        value={color}
                        onChange={e => setColor(e.target.value)}
                        className={`${inputClass} flex-1 uppercase`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Bot Avatar</label>
                  <label 
                    className={`flex flex-col items-center justify-center w-full h-[124px] border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                      isAvatarDragging 
                        ? "border-signal-teal bg-card" 
                        : "border-border bg-card hover:border-signal-teal hover:bg-paper"
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setIsAvatarDragging(true); }}
                    onDragLeave={() => setIsAvatarDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsAvatarDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleAvatarUpload(file);
                    }}
                  >
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/svg+xml" 
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleAvatarUpload(e.target.files[0]);
                      }} 
                    />
                    
                    {avatar?.startsWith('data:image') || avatar?.startsWith('http') ? (
                      <div className="relative group w-12 h-12 rounded-full overflow-hidden border border-border shadow-sm mb-2 shrink-0">
                        <img src={avatar} className="w-full h-full object-cover" alt="Avatar" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-card border border-border shadow-sm mb-2 flex items-center justify-center text-xl shrink-0">
                        {avatar || "🤖"}
                      </div>
                    )}
                    
                    <span className="text-xs font-medium text-secondary mt-1">
                      <span className="text-signal-teal">Click to upload</span> or drag and drop
                    </span>
                    <span className="text-[10px] text-secondary mt-0.5">PNG, JPG, SVG up to 2MB</span>
                  </label>
                  {avatar && (
                     <div className="flex justify-end mt-1.5">
                        <button type="button" onClick={() => setAvatar("")} className="text-[11px] text-secondary font-medium hover:underline">
                          Clear image
                        </button>
                     </div>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Welcome Message</label>
                  <textarea
                    id="tour-bot-welcome"
                    value={welcomeMsg}
                    onChange={e => setWelcomeMsg(e.target.value)}
                    rows={3}
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 pt-1">
                <button
                  id="tour-bot-save"
                  type="submit"
                  disabled={savingConfig}
                  className="px-6 py-3 bg-signal-teal hover:bg-teal-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50 text-sm"
                >
                  {savingConfig ? "Saving…" : "Save Configuration"}
                </button>
                {saveSuccess && (
                  <span className="text-secondary font-medium flex items-center gap-1.5 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Saved!
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Preview panel — right */}
          <div className="lg:col-span-2 relative bg-gray-50 border border-border rounded-xl overflow-hidden shadow-sm flex flex-col h-[600px] justify-center items-center">
            {!botToken ? (
              <div className="text-secondary text-sm">Loading preview...</div>
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 pointer-events-none opacity-50" />
                <p className="absolute top-4 left-4 text-xs font-bold text-secondary uppercase tracking-wider z-10">Live Preview</p>
                <div className="relative z-10 w-[380px] h-[550px] bg-transparent rounded-2xl overflow-hidden shadow-2xl border border-border/50">
                  <iframe 
                    key={iframeKey}
                    src={`${getBackendUrl()}/widget/iframe.html?bot_token=${botToken}`}
                    className="w-full h-full border-none"
                    title="Bot Preview"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Knowledge Base tab ────────────────────────── */}
      {activeTab === "knowledge" && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
          <h2
            className="text-lg font-bold text-ink"
            style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
          >
            Knowledge Base
          </h2>

          {/* Doc list */}
          {docs.length > 0 && (
            <div className="space-y-2">
              {docs.map((doc, idx) => (
                <div key={doc.id} className="flex flex-col p-4 border border-border rounded-xl bg-card">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-soft-mint flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span className="font-medium text-ink text-sm">{doc.filename}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        id={idx === 0 ? "tour-kb-status" : undefined}
                        className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        doc.status === 'ready'
                          ? 'bg-card text-ink'
                          : doc.status === 'failed'
                          ? 'bg-red-50 text-error'
                          : 'bg-amber-50 text-amber'
                      }`}>
                        {doc.status === 'ready' ? 'Ready' : doc.status === 'failed' ? 'Failed' : 'Training'}
                      </span>
                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="text-signal-teal hover:text-teal-dark transition-colors"
                        title="Delete document"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {doc.status === 'failed' && doc.error_message && (
                    <p className="text-xs text-error mt-2 bg-red-50 p-2 rounded border border-red-100">{doc.error_message}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload zone */}
          <form onSubmit={handleUpload} className="space-y-4">
            <div
              id="tour-kb-upload"
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
              className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
                isDragging
                  ? 'border-signal-teal bg-soft-mint'
                  : 'border-border bg-card hover:border-signal-teal hover:bg-soft-mint/30'
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
              <div className="pointer-events-none flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-paper flex items-center justify-center">
                  <svg className="w-6 h-6 text-signal-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-ink font-semibold text-sm">
                  Drag and drop your files here, or click to browse
                </p>
                <p className="text-xs text-secondary">
                  Supports PDF, DOCX, TXT
                </p>
              </div>
            </div>

            {files.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-paper p-4 border border-border/20 rounded-xl">
                <span className="text-sm text-secondary font-medium">{files.length} file(s) selected</span>
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full sm:w-auto px-6 py-2.5 bg-signal-teal hover:bg-teal-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50 text-sm"
                >
                  {uploading ? "Uploading…" : "Upload & Train"}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* ── Deploy Widget tab ─────────────────────────── */}
      {activeTab === "deploy" && (
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2
              className="text-lg font-bold text-ink mb-1"
              style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
            >
              Deploy Widget
            </h2>
            <p className="text-secondary text-sm mb-5">
              Paste this code right before the closing{" "}
              <code className="bg-paper text-ink px-1.5 py-0.5 rounded border border-border text-xs font-mono">&lt;/body&gt;</code>{" "}
              tag on your website.
            </p>

            <div id="tour-deploy-copy" className="relative group">
              <pre className="bg-[#0a0a0a] text-gray-200 p-5 rounded-xl text-sm font-mono leading-relaxed border border-border/10 whitespace-pre-wrap break-all">
                <code>{widgetCode}</code>
              </pre>
              <button
                onClick={handleCopyCode}
                className="absolute top-3 right-3 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition font-medium opacity-0 group-hover:opacity-100"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          <div id="tour-deploy-preview" className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center justify-between gap-4">
            <div>
              <h3
                className="font-bold text-ink text-base mb-1"
                style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
              >
                Test Your Bot
              </h3>
              <p className="text-sm text-secondary">View a live preview of your bot on a demo landing page.</p>
            </div>
            <a
              href={`${getBackendUrl()}/widget/demo.html?bot_token=${botToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-5 py-2.5 bg-signal-teal hover:bg-teal-dark text-white font-semibold rounded-lg transition-colors text-sm"
            >
              Open Live Demo
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
