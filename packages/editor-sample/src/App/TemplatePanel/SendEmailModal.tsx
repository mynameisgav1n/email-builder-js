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
import SendIcon from "@mui/icons-material/Send";

import { useDocument } from "../../documents/editor/EditorContext";
import { renderToStaticMarkup } from "@usewaypoint/email-builder";

// ----------------- types -----------------
type Importance = "Normal" | "High" | "Low";
interface UserResponse { fullName?: string; email?: string }

type RecipientKind = "email" | "list";
interface RecipientOption {
  kind: RecipientKind;
  label: string;   // shown in chip/list
  value: string;   // email or list key
}

// Mail list keys mapped to your API `list` param
const MAILING_LISTS: { key: string; label: string }[] = [
  { key: "all",       label: "All Members" },
  { key: "general",   label: "General Emails" },
  { key: "promotional", label: "Promotional Emails" },
  { key: "surveys",   label: "Surveys" },
  { key: "event",     label: "Event Emails" },
  { key: "beehiiv",   label: "Newsletter Subscribers" },
];

const API_SEND = "/api/sendEmail.php";
const API_LISTS = "/api/getMailingLists.php";

// ----------------- html helpers (same as your original) -----------------
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

const EMAIL_RE =
  /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

// Build the option to “Use this address: …”
function addressOption(input: string): RecipientOption {
  return { kind: "email", label: input, value: input.toLowerCase() };
}

// ----------------- component -----------------
export default function SendEmailButton() {
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

function ComposerDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const document = useDocument();

  // HTML pipeline (same tech as your old SendButton)
  const [escapedHtml, setEscapedHtml] = useState("");
  const [resolvedHtml, setResolvedHtml] = useState("");

  // user & from-fields
  const [user, setUser] = useState<UserResponse>({});
  const [fromName, setFromName] = useState("Inspire Youth NJ");
  const [fromEmail, setFromEmail] = useState("members@inspireyouthnj.org");
  const [replyTo, setReplyTo] = useState("members@inspireyouthnj.org");
  const [subject, setSubject] = useState("");
  const [importance, setImportance] = useState<Importance>("Normal");

  // recipients UI state
  const [to, setTo] = useState<RecipientOption[]>([]);
  const [cc, setCc] = useState<RecipientOption[]>([]);
  const [bcc, setBcc] = useState<RecipientOption[]>([]);
  const [suggestions, setSuggestions] = useState<RecipientOption[]>([]); // emails & lists suggestions

  // misc
  const [snack, setSnack] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // --------- bootstrap when dialog opens ---------
  useEffect(() => {
    if (!open) return;

    // build html exactly like original
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

    // fetch user
    fetch("/api/user.php")
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((u: UserResponse) => {
        setUser(u || {});
        if (u?.email) setReplyTo(u.email);
      })
      .catch(() => { /* ignore */ });

    // preload suggestions:
    // - hard-coded mailing lists
    // - a small sample of member emails (from All Members)
    const base: RecipientOption[] = MAILING_LISTS.map(l => ({
      kind: "list",
      label: l.label,
      value: l.key,
    }));

    // try pulling a sample of members to help autocomplete (if API is heavy, it's fine to remove)
    fetch(`${API_LISTS}?list=all`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        // Airtable returns {members:[{fullName,email,profileURL}], ...}
        const emails: string[] =
          data?.emails ??
          (data?.members || []).map((m: any) => m.email).filter(Boolean);

        const uniq = Array.from(new Set(emails)).slice(0, 200); // cap suggestions
        const emailOpts: RecipientOption[] = uniq.map((e: string) => ({
          kind: "email",
          label: e,
          value: e.toLowerCase(),
        }));

        setSuggestions([...base, ...emailOpts]);
      })
      .catch(() => setSuggestions(base));
  }, [open, document]);

  // render preview into iframe
  useEffect(() => {
    if (!open || !iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(resolvedHtml || "");
    doc.close();
  }, [open, resolvedHtml]);

  // From name options
  const fromNameOptions = useMemo(() => {
    const opts = ["Inspire Youth NJ"];
    const ufn = (user?.fullName || "").trim();
    if (ufn) {
      opts.push(`${ufn} (Inspire Youth NJ)`);
      opts.push(ufn);
    }
    return opts;
  }, [user]);

  // From/Reply-To options
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

  // keep reply-to in sync unless user already changed it
  useEffect(() => {
    if (!open) return;
    setReplyTo(prev => (prev === fromEmail ? fromEmail : prev));
  }, [fromEmail, open]);

  // ------- utilities -------
  const asEmails = (arr: RecipientOption[]) =>
    arr.filter(r => r.kind === "email").map(r => r.value.toLowerCase());

  const selectedListKeys = (arr: RecipientOption[]) =>
    arr.filter(r => r.kind === "list").map(r => r.value);

  async function expandList(key: string): Promise<string[]> {
    // Maps list key to API calls
    const listParam = key; // keys already match our API
    const url = `${API_LISTS}?list=${encodeURIComponent(listParam)}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`List fetch failed: ${key}`);
    const data = await r.json();
    if (key === "beehiiv") {
      // {emails: [...]}
      return (data?.emails || []).map((e: string) => e.toLowerCase());
    }
    // airtable => {members:[{email,...}]}
    const mems = (data?.members || []) as Array<{ email?: string }>;
    return mems.map(m => (m.email || "").toLowerCase()).filter(Boolean);
  }

  async function expandRecipients(arr: RecipientOption[]): Promise<string[]> {
    const emails = new Set<string>(asEmails(arr));
    const lists = selectedListKeys(arr);
    for (const key of lists) {
      try {
        const listEmails = await expandList(key);
        listEmails.forEach(e => emails.add(e));
      } catch {
        // swallow and continue; we'll still send to what we have
      }
    }
    return Array.from(emails);
  }

  // ------- autocomplete config -------
  function filterOptions(options: RecipientOption[], state: any) {
    const input = (state.inputValue || "").trim();
    let out = options;

    // Show “Use this address” suggestion when input looks like an email
    if (EMAIL_RE.test(input)) {
      out = [
        { kind: "email", label: `Use this address: ${input}`, value: input.toLowerCase() },
        ...options.filter(o => o.value !== input.toLowerCase()),
      ];
    }
    return out;
  }

  function onChangeRecipients(
    _e: any,
    value: (RecipientOption | string)[],
    setState: React.Dispatch<React.SetStateAction<RecipientOption[]>>
  ) {
    // Allow free text emails and list options
    const normalized: RecipientOption[] = value.map(v => {
      if (typeof v === "string") {
        // freeSolo typed; if it's an email, store email; otherwise ignore
        if (EMAIL_RE.test(v.trim())) return addressOption(v.trim());
        return addressOption(v.trim()); // still store; backend will re-validate
      }
      if (v.kind === "email" && v.label.startsWith("Use this address:")) {
        const email = v.value;
        return addressOption(email);
      }
      return v as RecipientOption;
    });

    // de-dupe by value
    const uniqMap = new Map(normalized.map(n => [n.kind + ":" + n.value.toLowerCase(), n]));
    setState(Array.from(uniqMap.values()));
  }

  // ------- send -------
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
        Promise.resolve(asEmails(cc)),   // CC/BCC accept emails only here
        Promise.resolve(asEmails(bcc)),
      ]);

      // final dedupe across all (leave duplicates across fields? usually we dedupe per-field)
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
        selectedLists: selectedListKeys(to),
        user: { fullName: user?.fullName || null, email: user?.email || null },
        source: "iynj-emailbuilder",
        // keep for debug parity with old flow
        escapedHtml,
      };

      const res = await fetch(API_SEND, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(`API returned ${res.status}: ${t}`);
      }
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

  // ----------------- UI -----------------
  const fieldSx = { "& .MuiInputBase-root": { borderRadius: 2 } };

  const listOptions: RecipientOption[] = useMemo(
    () => MAILING_LISTS.map(l => ({ kind: "list", label: l.label, value: l.key })),
    []
  );

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
          {/* Stacked like an email client */}
          <Box sx={{ display: "grid", gap: 1.25 }}>
            {/* To */}
            <Autocomplete
              multiple
              freeSolo
              filterOptions={filterOptions as any}
              options={[...listOptions, ...suggestions]}
              value={to}
              onChange={(e, v) => onChangeRecipients(e, v, setTo)}
              getOptionLabel={(o) => (typeof o === "string" ? o : o.label)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.kind + ":" + option.value}
                    label={option.label}
                    color={option.kind === "list" ? "secondary" : "default"}
                    variant={option.kind === "list" ? "filled" : "outlined"}
                    size="small"
                  />
                ))
              }
              renderInput={(params) => (
                <TextField {...params} size="small" label="To" placeholder="Type an email or choose a list…" sx={fieldSx} />
              )}
            />

            {/* Cc */}
            <Autocomplete
              multiple
              freeSolo
              filterOptions={filterOptions as any}
              options={suggestions.filter(o => o.kind === "email")}
              value={cc}
              onChange={(e, v) => onChangeRecipients(e, v, setCc)}
              getOptionLabel={(o) => (typeof o === "string" ? o : o.label)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip {...getTagProps({ index })} key={"cc:"+option.value} label={option.label} size="small" />
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
              filterOptions={filterOptions as any}
              options={suggestions.filter(o => o.kind === "email")}
              value={bcc}
              onChange={(e, v) => onChangeRecipients(e, v, setBcc)}
              getOptionLabel={(o) => (typeof o === "string" ? o : o.label)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip {...getTagProps({ index })} key={"bcc:"+option.value} label={option.label} size="small" />
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
                {emailOptions.map((opt) => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Reply-To */}
            <FormControl size="small">
              <InputLabel>Reply-To</InputLabel>
              <Select label="Reply-To" value={replyTo} onChange={(e) => setReplyTo(e.target.value)}>
                {emailOptions.map((opt) => (
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
