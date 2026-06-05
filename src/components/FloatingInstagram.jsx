export default function FloatingInstagram() {
  return (
    <a
      href="https://www.instagram.com/dewdrop_stories"
      target="_blank"
      rel="noopener noreferrer"
      title="Follow on Instagram"
      className="fixed right-4 bottom-6 z-50 flex items-center justify-center w-11 h-11 rounded-full shadow-lg bg-white dark:bg-gray-800 border border-amber-100 dark:border-amber-900/30 text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-amber-200/50 dark:hover:shadow-amber-900/40 hover:shadow-xl transition-all duration-200 hover:scale-110"
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4.5" />
        <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
      </svg>
    </a>
  );
}
