import { useState } from "react";
import { Mail, MessageCircle, Send, User, AtSign, Tag, CheckCircle, AlertCircle, Loader } from "lucide-react";

const FIELD = "flex flex-col gap-1.5";
const LABEL = "text-xs font-semibold text-gray-600 dark:text-gray-400 tracking-wide flex items-center gap-1.5";
const INPUT = "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-amber-400 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900/30 transition-all";

const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY || "";

export default function Contact() {
  const DOMAINS = ["gmail.com","yahoo.com","hotmail.com","outlook.com","icloud.com","yahoo.in"];

  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [emailError, setEmailError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggIdx, setSuggIdx] = useState(-1);

  const handleEmailKeyDown = e => {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSuggIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSuggIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && suggIdx >= 0) { e.preventDefault(); pickSuggestion(suggestions[suggIdx]); setSuggIdx(-1); }
    else if (e.key === "Escape") { setSuggestions([]); setSuggIdx(-1); }
  };

  const set = e => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (name === "email") {
      setEmailError("");
      const atIdx = value.indexOf("@");
      if (atIdx !== -1) {
        const typed = value.slice(atIdx + 1).toLowerCase();
        setSuggestions(typed ? DOMAINS.filter(d => d.startsWith(typed)) : DOMAINS);
      } else {
        setSuggestions([]);
      }
    }
  };

  const pickSuggestion = domain => {
    const prefix = form.email.includes("@") ? form.email.slice(0, form.email.indexOf("@")) : form.email;
    setForm(p => ({ ...p, email: prefix + "@" + domain }));
    setSuggestions([]);
    setEmailError("");
  };

  const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validEmail(form.email)) { setEmailError("Please enter a valid email address."); return; }
    setStatus("sending");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ access_key: WEB3FORMS_KEY, ...form }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="px-4 py-10 mx-auto max-w-4xl sm:px-6 sm:py-14">

      {/* Hero */}
      <div className="mb-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-amber-400 dark:to-amber-700" />
          <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-amber-600 dark:text-amber-500">Reach Out</span>
          <span className="h-px w-10 bg-gradient-to-l from-transparent to-amber-400 dark:to-amber-700" />
        </div>
        <h1 className="mb-3 text-3xl font-bold text-transparent sm:text-4xl bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text">
          Get in Touch
        </h1>
        <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400 font-serif italic">
          Have a question, a thought, or a story to share?<br />I'd love to hear from you.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ── Contact form ── */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 sm:p-8">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-6">Send a Message</h2>

          {status === "success" ? (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/20 mb-4">
                <CheckCircle size={24} className="text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Message sent!</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Thanks for reaching out — I'll get back to you soon.</p>
              <button onClick={() => { setForm({ name: "", email: "", subject: "", message: "" }); setStatus("idle"); }} className="mt-5 text-xs text-amber-600 dark:text-amber-400 hover:underline">
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={FIELD}>
                  <label className={LABEL}><User size={11} />Name</label>
                  <input name="name" value={form.name} onChange={set} required placeholder="Your name" className={INPUT} />
                </div>
                <div className={FIELD + " relative"}>
                  <label className={LABEL}><AtSign size={11} />Email</label>
                  <input name="email" type="email" value={form.email} onChange={set} required placeholder="you@example.com"
                    className={INPUT + (emailError ? " border-red-400 focus:border-red-400 focus:ring-red-100" : "")}
                    onKeyDown={handleEmailKeyDown}
                    onBlur={() => setTimeout(() => { setSuggestions([]); setSuggIdx(-1); }, 150)} />
                  {suggestions.length > 0 && (
                    <ul className="absolute z-50 top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
                      {suggestions.map((d, i) => (
                        <li key={d} onMouseDown={() => { pickSuggestion(d); setSuggIdx(-1); }}
                          className={"px-3.5 py-2 text-sm cursor-pointer " + (i === suggIdx ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" : "text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/20")}>
                          {form.email.includes("@") ? form.email.slice(0, form.email.indexOf("@")) : form.email}@{d}
                        </li>
                      ))}
                    </ul>
                  )}
                  {emailError && <p className="text-[11px] text-red-500">{emailError}</p>}
                </div>
              </div>

              <div className={FIELD}>
                <label className={LABEL}><Tag size={11} />Subject</label>
                <input name="subject" value={form.subject} onChange={set} required placeholder="What's this about?" className={INPUT} />
              </div>

              <div className={FIELD}>
                <label className={LABEL}><MessageCircle size={11} />Message</label>
                <textarea name="message" value={form.message} onChange={set} required rows={5}
                  placeholder="Write your message here…" className={INPUT + " resize-none"} />
              </div>

              {status === "error" && (
                <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2.5">
                  <AlertCircle size={13} className="shrink-0" />
                  Something went wrong. Please try again or email us directly.
                </div>
              )}

              <button type="submit" disabled={status === "sending"}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] text-white text-sm font-semibold shadow-sm transition-all">
                {status === "sending"
                  ? <><Loader size={14} className="animate-spin" />Sending…</>
                  : <><Send size={14} />Send Message</>}
              </button>
            </form>
          )}
        </div>

        {/* ── Email card ── */}
        <div className="w-full lg:w-72 shrink-0 relative overflow-hidden p-7 rounded-2xl shadow-xl bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 text-white">
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/5" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-white/15">
                <Mail size={20} className="opacity-90" />
              </div>
              <h2 className="text-base font-bold">Email Directly</h2>
            </div>

            <p className="text-xs text-white/70 leading-relaxed mb-4">
              Prefer to write your own email? Reach us directly at:
            </p>

            <a href="mailto:thedewdropstories@gmail.com"
              className="block text-sm font-semibold text-white underline decoration-white/40 hover:decoration-white transition-colors break-all">
              thedewdropstories@gmail.com
            </a>

            <div className="mt-6 pt-5 border-t border-white/20 flex items-start gap-3">
              <MessageCircle size={15} className="mt-0.5 opacity-60 shrink-0" />
              <p className="text-xs text-white/70 leading-relaxed">
                I read every message personally and typically reply within a day or two.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
