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
  Chip,
  Autocomplete,
  Box,
} from "@mui/material";
import { createFilterOptions } from "@mui/material/Autocomplete";
import SendIcon from "@mui/icons-material/Send";

import { useDocument } from "../../documents/editor/EditorContext";
import { renderToStaticMarkup } from "@usewaypoint/email-builder";

// ---------- Types ----------
type Importance = "Normal" | "High" | "Low";
interface UserResponse { fullName?: string; email?: string }

type RecipientKind = "email" | "list";
interface RecipientOption {
  kind: RecipientKind;
  label: string;   // shown in UI: "Full Name (email)" or "All Members"
  value: string;   // unique key: email or list key (lowercase for email)
  email?: string;  // raw email (for kind === "email")
}

// ---------- Constants ----------
const API_SEND  = "/api/sendEmail.php";
const API_LISTS = "/api/getMailingLists.php";

const MAILING_LISTS: { key: string; label: string }[] = [
  { key: "all",         label: "All Members" },
  { key: "general",     label: "General Emails" },
  { key: "promotional", label: "Promotional Emails" },
  { key: "surveys",     label: "Surveys" },
  { key: "event",       label: "Event Emails" },
  { key: "beehiiv",     label: "Newsletter Subscribers" },
];

const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

// ---------- HTML helpers (same tech as your original Send button) ----------
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
    try { return decodeURIComponent(once); } catch { return once; }
  } catch {
    return escaped;
  }
}

// ---------- Option builders ----------
function listOption(l: {key:string;label:string}): RecipientOption {
  return { kind: "list", label: l.label, value: l.key };
}
function emailOption(email: string, fullName?: string): RecipientOption {
  const e = email.toLowerCase().trim();
  const label = fullName ? `${fullName} (${e})` : e;
  return { kind: "email", label, value: e, email: e };
}
function useThisAddressOption(input: string): RecipientOption {
  const e = input.toLowerCase().trim();
  return { kind: "email", label: `Use this address: ${e}`, value: e, email: e };
}

// default filter (match by name and email)
const defaultFilter = createFilterOptions<RecipientOption>({
  stringify: (opt) => `${opt.label} ${opt.value}`,
});

// ===================================================================
// Exported component: IconButton + Modal (kept self-contained)
// ===================================================================
export default function SendEmailModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title="Send email">
        <IconButton color="primary" onClick={() => setOpen(true)}>
          <SendIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {open && <ComposerDialog open={open} onClose={() => setOpen(false)} />}
    </>
  );
}

// ===================================================================
// Dialog (composer UI)
// ===================================================================
function ComposerDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const document = useDocument();

  // HTML pipeline
  const [escapedHtml, setEscapedHtml] = useState("");
  const [resolvedHtml, setResolvedHtml] = useState("");

  // user + headers
  const [user, setUser] = useState<UserResponse>({});
  const [fromName, setFromName] = useState("Inspire Youth NJ");
  const [fromEmail, setFromEmail] = useState("members@inspireyouthnj.org");
  const [replyTo, setReplyTo] = useState("members@inspireyouthnj.org");
  const [subject, setSubject] = useState("");
  const [importance, setImportance] = useState<Importance>("Normal");

  // recipients
  const [to,  setTo]  = useState<RecipientOption[]>([]);
  const [cc,  setCc]  = useState<RecipientOption[]>([]);
  const [bcc, setBcc] = useState<RecipientOption[]>([]);

  // suggestions (people only; lists are separate so we don't duplicate)
  const [peopleSuggestions, setPeopleSuggestions] = useState<RecipientOption[]>([]);

  // misc
  const [snack, setSnack] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Build HTML like original button
  useEffect(() => {
    if (!open) return;
    try {
      const html = renderToStaticMarkup(document, { rootBlockId: "root" });
      const minified = minifyHTML(html);
      const escaped = minimalEscape(minified);
      const decoded = decodeEscapedHtml(escaped);
      setEscapedHtml(escaped);
      setResolvedHtml(decoded);
    } catch {
      setSnack("Failed to render HTML.");
    }
  }, [open, document]);

  // Load user info
  useEffect(() => {
    if (!open) return;
    fetch("/api/user.php")
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((u: UserResponse) => {
        setUser(u || {});
        if (u?.email) setReplyTo(u.email);
      })
      .catch(() => {});
  }, [open]);

  // Load All Members -> suggestions as "Full Name (email)"
  useEffect(() => {
    if (!open) return;
    fetch(`${API_LISTS}?list=all`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const members: Array<{fullName?: string; email?: string}> = data?.members || [];
        const emails: string[] = data?.emails || members.map(m => m.Email).filter(Boolean);
        const byEmail = new Map<string, RecipientOption>();
        for (const m of members) {
          const e = (m.Email || "").trim();
          if (!e) continue;
          byEmail.set(e.toLowerCase(), emailOption(e, m.fullName));
        }
        for (const e of emails) {
          const key = (e || "").toLowerCase();
          if (!key) continue;
          if (!byEmail.has(key)) byEmail.set(key, emailOption(key));
        }
        setPeopleSuggestions(Array.from(byEmail.values()));
      })
      .catch(() => setPeopleSuggestions([]));
  }, [open]);

  // Render preview
  useEffect(() => {
    if (!open || !iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    doc.open(); doc.write(resolvedHtml || ""); doc.close();
  }, [open, resolvedHtml]);

  // Select options
  const fromNameOptions = useMemo(() => {
    const opts = ["Inspire Youth NJ"];
    const ufn = (user?.fullName || "").trim();
    if (ufn) { opts.push(`${ufn} (Inspire Youth NJ)`); opts.push(ufn); }
    return opts;
  }, [user]);

  const fromEmailOptions = useMemo(() => {
    const staticEmails = [
      "members@inspireyouthnj.org",
      "info@inspireyouthnj.org",
      "important-notifications@inspireyouthnj.org",
      "noreply@inspireyouthnj.org",
    ];
    const out = [...staticEmails];
    if (user?.email && !out.includes(user.email)) out.push(user.email);
    return out;
  }, [user]);

  useEffect(() => {
    if (!open) return;
    setReplyTo(prev => (prev === fromEmail ? fromEmail : prev));
  }, [fromEmail, open]);

  // Options for To field: lists (once) + people suggestions
  const listOptions = useMemo(() => MAILING_LISTS.map(listOption), []);
  const toOptions = useMemo(() => [...listOptions, ...peopleSuggestions], [listOptions, peopleSuggestions]);

  const isOptionEqualToValue = (a: RecipientOption, b: RecipientOption) =>
    a.kind === b.kind && a.value.toLowerCase() === b.value.toLowerCase();

  // --- smarter filtering for To ---
  function filterToOptions(_options: RecipientOption[], state: { inputValue: string }) {
    const input = (state.inputValue || "").trim();

    // people filtered by name/email
    const peopleFiltered = defaultFilter(peopleSuggestions, state);

    // typing: show people; include lists only if they match text
    if (input.length > 0) {
      const matchingLists = listOptions.filter((l) =>
        l.label.toLowerCase().includes(input.toLowerCase())
      );
      const emailPrompt = EMAIL_RE.test(input) ? [useThisAddressOption(input)] : [];

      // dedupe while preserving order
      const seen = new Set<string>();
      const result = [...matchingLists, ...emailPrompt, ...peopleFiltered].filter(o => {
        const k = o.kind + ":" + o.value.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      return result;
    }

    // empty input: lists first, then people (unique)
    const seen = new Set<string>();
    return [...listOptions, ...peopleFiltered].filter(o => {
      const k = o.kind + ":" + o.value.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  // normalize chips, allow freeSolo emails, dedupe
  function onChangeRecipients(
    _e: any,
    value: (RecipientOption | string)[],
    setState: React.Dispatch<React.SetStateAction<RecipientOption[]>>
  ) {
    const normalized: RecipientOption[] = value.map(v => {
      if (typeof v === "string") return emailOption(v);
      if (v.kind === "email" && v.label.startsWith("Use this address:")) return emailOption(v.value);
      return v;
    });
    const uniq = new Map(normalized.map(n => [n.kind + ":" + n.value.toLowerCase(), n]));
    setState(Array.from(uniq.values()));
  }

  // expand list(s) to emails via API
  async function expandList(key: string): Promise<string[]> {
    const r = await fetch(`${API_LISTS}?list=${encodeURIComponent(key)}`);
    if (!r.ok) throw new Error(`List fetch failed: ${key}`);
    const data = await r.json();
    if (key === "beehiiv") return (data?.emails || []).map((e: string) => e.toLowerCase());
    const mems = (data?.members || []) as Array<{email?: string}>;
    return mems.map(m => (m.email || "").toLowerCase()).filter(Boolean);
  }
  async function expandRecipients(arr: RecipientOption[]) {
    const emails = new Set<string>(arr.filter(r => r.kind === "email").map(r => r.value.toLowerCase()));
    const lists  = arr.filter(r => r.kind === "list").map(r => r.value);
    for (const key of lists) {
      try { (await expandList(key)).forEach(e => emails.add(e)); } catch {}
    }
    return Array.from(emails);
  }

  // send
  const onSend = async () => {
    if (!subject.trim()) return setSnack("Subject is required");
    if (!fromEmail) return setSnack("From email is required");
    if (!fromName) return setSnack("From name is required");
    if (!resolvedHtml.trim()) return setSnack("Email HTML is empty");
    if (to.length === 0) return setSnack("Please add at least one recipient in To");

    setSending(true);
    try {
      const [toEmails, ccEmails, bccEmails] = await Promise.all([
        expandRecipients(to),
        Promise.resolve(cc.filter(r => r.kind === "email").map(r => r.value.toLowerCase())),
        Promise.resolve(bcc.filter(r => r.kind === "email").map(r => r.value.toLowerCase())),
      ]);

      const dedupe = (xs: string[]) => Array.from(new Set(xs.map(x => x.toLowerCase())));

      const payload = {
        fromName,
        fromEmail,
        replyTo,
        subject,
        importance,
        html: resolvedHtml,
        to: dedupe(toEmails),
        cc: dedupe(ccEmails),
        bcc: dedupe(bccEmails),
        selectedLists: to.filter(r => r.kind === "list").map(r => r.value),
        user: { fullName: user?.fullName || null, email: user?.email || null },
        source: "iynj-emailbuilder",
        escapedHtml,
      };

      const res = await fetch(API_SEND, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`API returned ${res.status}: ${await res.text()}`);
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error || "Unknown error");

      setSnack("Queued for sending");
      // setTimeout(onClose, 900);
    } catch (e: any) {
      setSnack(e?.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  // ---------- UI ----------
  const fieldSx = { "& .MuiInputBase-root": { borderRadius: 2 } };
  const grayChipSx = { bgcolor: "#e5e7eb", color: "#111827" };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, bgcolor: "#f8f9fb", borderBottom: "1px solid #eaecef" }}>
          New message
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2 }}>
          {/* Stacked like a mail client */}
          <Box sx={{ display: "grid", gap: 1.25 }}>
            {/* To */}
            <Autocomplete
              multiple
              freeSolo
              options={toOptions}
              filterOptions={filterToOptions as any}
              isOptionEqualToValue={isOptionEqualToValue}
              value={to}
              onChange={(e, v) => onChangeRecipients(e, v, setTo)}
              getOptionLabel={(o) => (typeof o === "string" ? o : o.label)}
              filterSelectedOptions
              autoHighlight
              selectOnFocus
              handleHomeEndKeys
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.kind + ":" + option.value}
                    label={option.label}
                    size="small"
                    sx={grayChipSx}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label="To"
                  placeholder="Type a name/email or choose a list…"
                  sx={fieldSx}
                />
              )}
            />

            {/* Cc */}
            <Autocomplete
              multiple
              freeSolo
              options={peopleSuggestions}
              filterOptions={defaultFilter as any}
              isOptionEqualToValue={isOptionEqualToValue}
              value={cc}
              onChange={(e, v) => onChangeRecipients(e, v, setCc)}
              getOptionLabel={(o) => (typeof o === "string" ? o : o.label)}
              filterSelectedOptions
              autoHighlight
              selectOnFocus
              handleHomeEndKeys
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={"cc:"+option.value}
                    label={option.label}
                    size="small"
                    sx={grayChipSx}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField {...params} size="small" label="Cc" placeholder="Add recipients…" sx={fieldSx} />
              )}
            />

            {/* Bcc */}
            <Autocomplete
              multiple
              freeSolo
              options={peopleSuggestions}
              filterOptions={defaultFilter as any}
              isOptionEqualToValue={isOptionEqualToValue}
              value={bcc}
              onChange={(e, v) => onChangeRecipients(e, v, setBcc)}
              getOptionLabel={(o) => (typeof o === "string" ? o : o.label)}
              filterSelectedOptions
              autoHighlight
              selectOnFocus
              handleHomeEndKeys
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={"bcc:"+option.value}
                    label={option.label}
                    size="small"
                    sx={grayChipSx}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField {...params} size="small" label="Bcc" placeholder="Add recipients…" sx={fieldSx} />
              )}
            />

            {/* From name */}
            <FormControl size="small">
              <InputLabel>From name</InputLabel>
              <Select label="From name" value={fromName} onChange={(e) => setFromName(e.target.value)}>
                {fromNameOptions.map((opt) => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* From email */}
            <FormControl size="small">
              <InputLabel>From email</InputLabel>
              <Select label="From email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)}>
                {fromEmailOptions.map(opt => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Reply-To */}
            <FormControl size="small">
              <InputLabel>Reply-To</InputLabel>
              <Select label="Reply-To" value={replyTo} onChange={(e) => setReplyTo(e.target.value)}>
                {fromEmailOptions.map(opt => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Subject */}
            <TextField
              size="small"
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              sx={fieldSx}
            />

            {/* Importance */}
            <FormControl size="small">
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
          </Box>

          {/* Preview */}
          <Box mt={2}>
            {resolvedHtml ? (
              <Paper variant="outlined" sx={{ height: 420, overflow: "hidden", borderRadius: 2 }}>
                <iframe ref={iframeRef} title="email-preview" style={{ width: "100%", height: "100%", border: 0 }} />
              </Paper>
            ) : (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                Unable to render preview from builder document.
              </Paper>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: "#f8f9fb", borderTop: "1px solid #eaecef" }}>
          <Button onClick={onClose}>Close</Button>
          <Button variant="contained" onClick={onSend} disabled={sending}>
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
