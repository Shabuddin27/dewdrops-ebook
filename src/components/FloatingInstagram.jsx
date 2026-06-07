export default function FloatingInstagram() {
  return (
    <a
      href="https://www.instagram.com/dewdrop_stories"
      target="_blank"
      rel="noopener noreferrer"
      title="Follow on Instagram"
      className="group fixed right-4 bottom-6 z-50 flex items-center h-11 px-3 rounded-full shadow-lg bg-white dark:bg-gray-800 border border-amber-100 dark:border-amber-900/30 text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-amber-200/50 dark:hover:shadow-amber-900/40 hover:shadow-xl transition-all duration-300"
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4.5" />
        <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
      </svg>
      <span className="overflow-hidden max-w-0 group-hover:max-w-[4rem] whitespace-nowrap text-xs font-semibold transition-all duration-300">
        &nbsp;Follow
      </span>
    </a>
  );
}
