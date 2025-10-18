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
  Grid,
  Paper,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

import { useDocument } from "../../documents/editor/EditorContext";
import { renderToStaticMarkup } from "@usewaypoint/email-builder";

type Importance = "Normal" | "High" | "Low";
interface UserResponse {
  fullName?: string;
  email?: string;
}

const API_ENDPOINT = "/api/sendEmail.php";

// --- same minify + minimalEscape logic from your original code ---
function minifyHTML(html: string) {
  return html
    .replace(/\n/g, "")
    .replace(/\s\s+/g, " ")
    .replace(/>\s+</g, "><")
    .replace(/<!--.*?-->/g, "");
}
function minimalEscape(str: string) {
  return str
    .replace(/%/g, "%25")
    .replace(/#/g, "%23")
    .replace(/&/g, "%26")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E")
    .replace(/"/g, "%22");
}
function decodeEscapedHtml(escaped: string) {
  try {
    const once = decodeURIComponent(escaped);
    try {
      return decodeURIComponent(once);
    } catch {
      return once;
    }
  } catch {
    return escaped;
  }
}

export default function SendEmailButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title="Send email">
        <IconButton color="primary" onClick={() => setOpen(true)}>
          <SendIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {open && <SendComposerDialog open={open} onClose={() => setOpen(false)} />}
    </>
  );
}

function SendComposerDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const document = useDocument();
  const [escapedHtml, setEscapedHtml] = useState<string>("");
  const [resolvedHtml, setResolvedHtml] = useState<string>("");

  const [loadingUser, setLoadingUser] = useState(false);
  const [user, setUser] = useState<UserResponse>({});
  const [fromName, setFromName] = useState("Inspire Youth NJ");
  const [fromEmail, setFromEmail] = useState("members@inspireyouthnj.org");
  const [replyTo, setReplyTo] = useState("members@inspireyouthnj.org");
  const [subject, setSubject] = useState("");
  const [importance, setImportance] = useState<Importance>("Normal");

  const [snack, setSnack] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Generate HTML using same logic as original SendButton
  useEffect(() => {
    if (!open) return;
    try {
      const html = renderToStaticMarkup(document, { rootBlockId: "root" });
      const minified = minifyHTML(html);
      const escaped = minimalEscape(minified);
      const decoded = decodeEscapedHtml(escaped);
      setEscapedHtml(escaped);
      setResolvedHtml(decoded);
    } catch (e) {
      setSnack("Failed to render HTML.");
    }
  }, [open, document]);

  // Load user info
  useEffect(() => {
    if (!open) return;
    setLoadingUser(true);
    fetch("/api/user.php")
      .then((r) =>
        r.ok ? r.json() : Promise.reject(new Error("Failed to load user"))
      )
      .then((data: UserResponse) => {
        setUser(data || {});
        if (data?.email) setReplyTo(data.email);
      })
      .catch(() => {})
      .finally(() => setLoadingUser(false));
  }, [open]);

  // Render email preview
  useEffect(() => {
    if (!open || !iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(resolvedHtml || "");
    doc.close();
  }, [open, resolvedHtml]);

  // Dropdown options
  const fromNameOptions = useMemo(() => {
    const opts = ["Inspire Youth NJ"];
    const ufn = (user?.fullName || "").trim();
    if (ufn) {
      opts.push(`${ufn} (Inspire Youth NJ)`);
      opts.push(ufn);
    }
    return opts;
  }, [user]);

  const emailOptions = useMemo(() => {
    const staticEmails = [
      "members@inspireyouthnj.org",
      "info@inspireyouthnj.org",
      "important-notifications@inspireyouthnj.org",
      "noreply@inspireyouthnj.org",
    ];
    const opts = [...staticEmails];
    if (user?.email && !opts.includes(user.email)) opts.push(user.email);
    return opts;
  }, [user]);

  useEffect(() => {
    if (!open) return;
    setReplyTo((prev) => (prev === fromEmail ? fromEmail : prev));
  }, [fromEmail, open]);

  const handleSend = async () => {
    if (!subject.trim()) return setSnack("Subject is required");
    if (!fromEmail) return setSnack("From email is required");
    if (!fromName) return setSnack("From name is required");
    if (!resolvedHtml.trim()) return setSnack("Email HTML is empty");

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
        escapedHtml, // for debugging/Make-compatibility
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
          sx: { borderRadius: 3, overflow: "hidden" },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            bgcolor: "#f8f9fb",
            borderBottom: "1px solid #eaecef",
          }}
        >
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
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
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
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
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
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
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

            {/* HTML Preview */}
            <Grid item xs={12}>
              {resolvedHtml ? (
                <Paper
                  variant="outlined"
                  sx={{ height: 420, overflow: "hidden", borderRadius: 2 }}
                >
                  <iframe
                    ref={iframeRef}
                    title="email-preview"
                    style={{ width: "100%", height: "100%", border: 0 }}
                  />
                </Paper>
              ) : (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  Unable to render preview from builder document.
                </Paper>
              )}
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions
          sx={{
            p: 2,
            bgcolor: "#f8f9fb",
            borderTop: "1px solid #eaecef",
          }}
        >
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
