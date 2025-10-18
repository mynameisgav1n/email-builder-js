// ==============================================
// File: /components/SendEmailButton.tsx
// Purpose: MUI IconButton that opens a Gmail-style composer Dialog.
//          HTML is auto-resolved from the URL (?html= or ?HTML=).
//          On Send, POSTs JSON to /api/sendEmail.php.
//
// Usage:
//   <SendEmailButton />
//
// If your original SendButton used a different icon, replace SendOutlined below,
// or pass a custom icon via the `icon` prop.
// ==============================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Box,
  Grid,
  Paper,
} from "@mui/material";
import { SendOutlined } from "@mui/icons-material"; // swap to your original icon if different

type Importance = "Normal" | "High" | "Low";
interface UserResponse { fullName?: string; email?: string }

interface SendEmailButtonProps {
  tooltip?: string;
  icon?: React.ReactNode; // if you want to inject the exact icon from your current SendButton
}

const API_ENDPOINT = "/api/sendEmail.php";

// Robustly decode ?html= (or ?HTML=), handling double-encoding and potential base64
function resolveHtmlFromQuery(): string {
  try {
    const sp = new URLSearchParams(window.location.search);
    let raw = sp.get("html") ?? sp.get("HTML");
    if (!raw) return "";

    let decoded = "";
    try { decoded = decodeURIComponent(raw); } catch { decoded = raw; }
    try { decoded = decodeURIComponent(decoded); } catch {}

    const looksLikeHtml = /<(!doctype|html|head|body|table|div|span|p|mj-|style)/i.test(decoded);
    const looksLikeBase64 = /^[A-Za-z0-9+/=\s]+$/.test(decoded) && decoded.length % 4 === 0;
    if (!looksLikeHtml && looksLikeBase64) {
      try {
        const b64 = atob(decoded.replace(/\s+/g, ""));
        if (/<(html|head|body|table|div|span|p|mj-|style)/i.test(b64)) return b64;
      } catch {}
    }
    return decoded;
  } catch {
    return "";
  }
}

export default function SendEmailButton({ tooltip = "Send email", icon }: SendEmailButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title={tooltip}>
        <IconButton color="primary" onClick={() => setOpen(true)}>
          {icon || <SendOutlined fontSize="small" />}
        </IconButton>
      </Tooltip>

      <SendDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function SendDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [loadingUser, setLoadingUser] = useState(false);
  const [user, setUser] = useState<UserResponse>({});

  const [fromName, setFromName] = useState("Inspire Youth NJ");
  const [fromEmail, setFromEmail] = useState("members@inspireyouthnj.org");
  const [replyTo, setReplyTo] = useState("members@inspireyouthnj.org");
  const [subject, setSubject] = useState("");
  const [importance, setImportance] = useState<Importance>("Normal");

  const [resolvedHtml, setResolvedHtml] = useState<string>("");
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const [snack, setSnack] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Pull current user for personalized options
  useEffect(() => {
    if (!open) return;
    setLoadingUser(true);
    fetch("/api/user.php")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load user"))))
      .then((data: UserResponse) => {
        setUser(data || {});
        if (data?.email) setReplyTo(data.email);
      })
      .catch(() => {})
      .finally(() => setLoadingUser(false));
  }, [open]);

  // Resolve HTML from the URL the moment dialog opens
  useEffect(() => {
    if (!open) return;
    const html = resolveHtmlFromQuery();
    setResolvedHtml(html || "");
  }, [open]);

  // Render preview into iframe
  useEffect(() => {
    if (!open || !iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(resolvedHtml || "");
    doc.close();
  }, [open, resolvedHtml]);

  // From Name options
  const fromNameOptions = useMemo(() => {
    const opts = ["Inspire Youth NJ"];
    const ufn = (user?.fullName || "").trim();
    if (ufn) {
      opts.push(`${ufn} (Inspire Youth NJ)`);
      opts.push(ufn);
    } else {
      opts.push("Full Name (Inspire Youth NJ)");
    }
    return opts;
  }, [user]);

  // Email options (from, reply-to)
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

  // Keep reply-to synced with fromEmail by default (unless user already changed it)
  useEffect(() => {
    if (!open) return;
    setReplyTo((prev) => (prev === fromEmail ? fromEmail : prev));
  }, [fromEmail, open]);

  const handleSend = async () => {
    if (!subject.trim()) return setSnack("Subject is required");
    if (!fromEmail) return setSnack("From email is required");
    if (!fromName) return setSnack("From name is required");
    if (!resolvedHtml || !resolvedHtml.trim()) return setSnack("Email HTML is empty (expecting ?html= in URL)");

    setSending(true);
    try {
      const payload = {
        fromName,
        fromEmail,
        replyTo,
        subject,
        importance,
        html: resolvedHtml,
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

      setSnack("Queued for sending");
      // Optionally close shortly after
      // setTimeout(onClose, 900);
    } catch (e: any) {
      setSnack(e?.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, bgcolor: "#f8f9fb", borderBottom: "1px solid #eaecef" }}>
          New message
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>From name</InputLabel>
                <Select
                  label="From name"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                >
                  {fromNameOptions.map((opt) => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>From email</InputLabel>
                <Select
                  label="From email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                >
                  {emailOptions.map((opt) => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Reply-To</InputLabel>
                <Select
                  label="Reply-To"
                  value={replyTo}
                  onChange={(e) => setReplyTo(e.target.value)}
                >
                  {emailOptions.map((opt) => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Importance</InputLabel>
                <Select
                  label="Importance"
                  value={importance}
                  onChange={(e) => setImportance(e.target.value as Importance)}
                >
                  <MenuItem value="Normal">Normal</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={9}>
              <TextField
                fullWidth
                size="small"
                label="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </Grid>

            {/* Preview */}
            <Grid item xs={12}>
              {resolvedHtml ? (
                <Paper variant="outlined" sx={{ height: 420, overflow: "hidden", borderRadius: 2 }}>
                  <iframe
                    ref={iframeRef}
                    title="email-preview"
                    style={{ width: "100%", height: "100%", border: 0 }}
                  />
                </Paper>
              ) : (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  No HTML found in the URL. This composer expects <code>?html=...</code> (or <code>?HTML=...</code>),
                  same as your original redirect flow.
                </Paper>
              )}
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: "#f8f9fb", borderTop: "1px solid #eaecef" }}>
          <Button onClick={onClose}>Close</Button>
          <Button variant="contained" onClick={handleSend} disabled={sending}>
            {sending ? "Sending…" : "Send"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snack}
        message={snack || ""}
        autoHideDuration={5000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      />
    </>
  );
}
