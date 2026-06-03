import { Mail, MessageCircle } from "lucide-react";

export default function Contact() {
  return (
    <div className="px-4 py-10 mx-auto max-w-xl sm:px-6 lg:px-8 sm:py-14 lg:py-18">

      {/* HERO */}
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

      {/* EMAIL CARD */}
      <div className="relative overflow-hidden p-8 rounded-2xl shadow-xl bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 text-white">
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/5" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl bg-white/15">
              <Mail size={20} className="opacity-90" />
            </div>
            <h2 className="text-lg font-bold">Email</h2>
          </div>

          <a
            href="mailto:thedewdropstories@gmail.com"
            className="flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white underline decoration-white/40 hover:decoration-white transition-colors"
          >
            thedewdropstories@gmail.com
          </a>

          <div className="mt-6 pt-5 border-t border-white/20 flex items-start gap-3">
            <MessageCircle size={16} className="mt-0.5 opacity-60 shrink-0" />
            <p className="text-xs text-white/70 leading-relaxed">
              I read every message personally and typically reply within a day or two.
              Whether it's feedback, a story suggestion, or just a kind word — I'm all ears.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
