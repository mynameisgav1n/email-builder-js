// ==============================================
// File: /components/SendComposer.tsx
// Combined: Send button + inline SendComposer modal in one file
// ==============================================

import React, { useEffect, useMemo, useRef, useState } from "react";

export type Importance = "Normal" | "High" | "Low";

interface UserResponse { fullName?: string; email?: string }

interface SendComposerProps {
  html: string;              // the email HTML to preview/send
  defaultSubject?: string;   // optional default subject
  buttonClassName?: string;  // optional custom button styles
  buttonLabel?: string;      // optional label (default: "Send")
}

// Our API endpoint (server forwards to Make or sends email itself)
const API_ENDPOINT = "/api/sendEmail.php";

export default function SendComposer({ html, defaultSubject, buttonClassName, buttonLabel = "Send" }: SendComposerProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className={buttonClassName || "px-4 py-2 rounded-lg bg-black text-white"}
        onClick={() => setOpen(true)}
        title="Send"
      >{buttonLabel}</button>
      {open && (
        <SendComposer
          open={open}
          onClose={() => setOpen(false)}
          html={html}
          defaultSubject={defaultSubject}
        />
      )}
    </>
  );
}

// ==============================================
// Inline modal component (kept private to this file)
// ==============================================

function SendComposer({ open, onClose, html, defaultSubject }: { open: boolean; onClose: () => void; html: string; defaultSubject?: string; }) {
  const [loadingUser, setLoadingUser] = useState(false);
  const [user, setUser] = useState<UserResponse>({});

  const [fromName, setFromName]   = useState<string>("Inspire Youth NJ");
  const [fromEmail, setFromEmail] = useState<string>("members@inspireyouthnj.org");
  const [replyTo, setReplyTo]     = useState<string>("members@inspireyouthnj.org");
  const [subject, setSubject]     = useState<string>(defaultSubject || "");
  const [importance, setImportance] = useState<Importance>("Normal");

  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Load current user info
  useEffect(() => {
    if (!open) return;
    setLoadingUser(true);
    fetch("/api/user.php")
      .then(r => r.ok ? r.json() : Promise.reject(new Error("Failed to load user")))
      .then((data: UserResponse) => {
        setUser(data || {});
        if (data?.email) setReplyTo(data.email);
      })
      .catch(() => {})
      .finally(() => setLoadingUser(false));
  }, [open]);

  // Options for fromName
  const fromNameOptions = useMemo(() => {
    const opts = ["Inspire Youth NJ"] as string[];
    const ufn = (user?.fullName || "").trim();
    if (ufn) {
      opts.push(`${ufn} (Inspire Youth NJ)`);
      opts.push(ufn);
    } else {
      opts.push("Full Name (Inspire Youth NJ)");
    }
    return opts;
  }, [user]);

  // Options for emails
  const staticEmails = [
    "members@inspireyouthnj.org",
    "info@inspireyouthnj.org",
    "important-notifications@inspireyouthnj.org",
    "noreply@inspireyouthnj.org",
  ];
  const emailOptions = useMemo(() => {
    const opts = [...staticEmails];
    if (user?.email && !opts.includes(user.email)) opts.push(user.email);
    return opts;
  }, [user]);

  // Keep reply-to in sync with fromEmail by default (but allow manual override)
  useEffect(() => {
    if (!open) return;
    setReplyTo(prev => (prev === fromEmail ? fromEmail : prev));
  }, [fromEmail, open]);

  // Render HTML preview in an iframe
  useEffect(() => {
    if (!open || !iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(html || "");
    doc.close();
  }, [open, html]);

  const onSend = async () => {
    setError("");
    setSuccess("");

    if (!subject.trim()) { setError("Subject is required"); return; }
    if (!fromEmail) { setError("From email is required"); return; }
    if (!fromName) { setError("From name is required"); return; }

    setSending(true);
    try {
      const payload = {
        fromName,
        fromEmail,
        replyTo,
        subject,
        importance,
        html,
        user: { fullName: user?.fullName || null, email: user?.email || null },
        source: "iynj-emailbuilder",
      };

      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API returned ${res.status}: ${text}`);
      }

      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error || "Unknown error");

      setSuccess("Queued for sending");
      // Optionally auto-close
      // setTimeout(onClose, 800);
    } catch (e: any) {
      setError(e?.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Composer Card */}
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl border overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <div className="font-semibold">New message</div>
          <div className="flex items-center gap-2">
            {error && <span className="text-red-600 text-sm">{error}</span>}
            {success && <span className="text-green-600 text-sm">{success}</span>}
            <button
              onClick={onSend}
              className="px-4 py-2 text-sm rounded-lg bg-black text-white disabled:opacity-50"
              disabled={sending}
            >{sending ? "Sending…" : "Send"}</button>
            <button onClick={onClose} className="px-3 py-2 text-sm rounded-lg border">Close</button>
          </div>
        </div>

        {/* Fields */}
        <div className="px-4 py-3 space-y-3 border-b">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex flex-col text-sm">
              <span className="text-gray-600 mb-1">From name</span>
              <select className="border rounded-lg px-3 py-2" value={fromName} onChange={e=>setFromName(e.target.value)}>
                {fromNameOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </label>

            <label className="flex flex-col text-sm">
              <span className="text-gray-600 mb-1">From email</span>
              <select className="border rounded-lg px-3 py-2" value={fromEmail} onChange={e=>setFromEmail(e.target.value)}>
                {emailOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </label>

            <label className="flex flex-col text-sm">
              <span className="text-gray-600 mb-1">Reply-To</span>
              <select className="border rounded-lg px-3 py-2" value={replyTo} onChange={e=>setReplyTo(e.target.value)}>
                {emailOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </label>

            <label className="flex flex-col text-sm">
              <span className="text-gray-600 mb-1">Importance</span>
              <select className="border rounded-lg px-3 py-2" value={importance} onChange={e=>setImportance(e.target.value as Importance)}>
                <option>Normal</option>
                <option>High</option>
                <option>Low</option>
              </select>
            </label>
          </div>

          <label className="flex flex-col text-sm">
            <span className="text-gray-600 mb-1">Subject</span>
            <input className="border rounded-lg px-3 py-2" value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Subject" />
          </label>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-auto bg-gray-25">
          <iframe ref={iframeRef} title="email-preview" className="w-full h-full min-h-[300px]" />
        </div>
      </div>
    </div>
  );
}
