import { useState, useEffect, useRef, useCallback } from "react";
import books from "../data/books.json";
import { Search, X, ChevronDown, Clock, BookOpen, Heart, Grid, List, Share2, Info } from "lucide-react";
import { motion as framerMotion, AnimatePresence } from "framer-motion";

const MotionDiv = framerMotion.div;

// ─── helpers ────────────────────────────────────────────────────────────────

const getRecentReading = () => {
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem("reading-progress")) || []; } catch { saved = []; }
  if (!Array.isArray(saved)) return [];

  return saved
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map((p) => {
      const book = books.find((b) => b.id === p.bookId);
      if (!book) return null;
      const chapter = book.chapters?.[p.chapter];
      if (!chapter) return { ...p, book, totalPages: 0, currentPage: 0, progressPercent: 0 };
      const contentLength = chapter.content?.length || 0;
      const totalPages = p.totalPages && p.totalPages > 0
        ? p.totalPages : Math.max(1, Math.ceil(contentLength / 800));
      let currentPage = 1, progressPercent = 0;
      if (p.pageIndex !== undefined) {
        currentPage = Math.min(p.pageIndex + 1, totalPages);
        progressPercent = currentPage >= totalPages ? 100 : (currentPage / totalPages) * 100;
      }
      return { ...p, book, currentPage, totalPages, progressPercent };
    })
    .filter((p) => p && p.book);
};

const getWishlist = () => {
  try { const s = JSON.parse(localStorage.getItem("wishlist")) || []; return Array.isArray(s) ? s : []; }
  catch { return []; }
};

const openReader = (bookId, resume = false) => {
  const params = new URLSearchParams({ id: bookId });
  if (resume) params.set("resume", "true");
  window.location.href = `/reader.html?${params.toString()}`;
};

// words ÷ 200 wpm; counts all chapters
const readingMinutes = (book) => {
  const chars = book.chapters?.reduce((s, ch) => s + (ch.content?.length || 0), 0) || 0;
  return Math.max(1, Math.round(chars / 5 / 200));
};

// unique categories across all books
const ALL_CATEGORIES = ["All", ...Array.from(new Set(books.map(b => b.category).filter(Boolean)))];

// ─── component ──────────────────────────────────────────────────────────────

function Home() {
  const [search, setSearch]               = useState("");
  const [searchOpen, setSearchOpen]       = useState(false);
  const [sort, setSort]                   = useState("recent");
  const [sortOpen, setSortOpen]           = useState(false);
  const [recent, setRecent]               = useState(getRecentReading);
  const [viewMode, setViewMode]           = useState("grid");
  const [wishlist, setWishlist]           = useState(getWishlist);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [category, setCategory]           = useState("All");
  const [copiedId, setCopiedId]           = useState(null);   // share toast
  const [descBook, setDescBook]           = useState(null);   // description modal

  const searchRef = useRef(null);
  const inputRef  = useRef(null);
  const sortRef   = useRef(null);

  // sync recent on storage changes (from reader)
  useEffect(() => {
    const onStorage = () => setRecent(getRecentReading());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // auto-focus search input when bar opens
  useEffect(() => {
    if (searchOpen && inputRef.current) inputRef.current.focus();
  }, [searchOpen]);

  // close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // "/" key focuses search
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
        e.preventDefault();
        setSearchOpen(true);
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setDescBook(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // ── actions ────────────────────────────────────────────────────────────────

  const removeFromRecent = (bookId, e) => {
    e.stopPropagation();
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem("reading-progress")) || []; } catch { saved = []; }
    localStorage.setItem("reading-progress", JSON.stringify(saved.filter((p) => p.bookId !== bookId)));
    setRecent(getRecentReading());
  };

  const toggleWishlist = (bookId, e) => {
    e.stopPropagation();
    const next = wishlist.includes(bookId) ? wishlist.filter(id => id !== bookId) : [...wishlist, bookId];
    setWishlist(next);
    localStorage.setItem("wishlist", JSON.stringify(next));
  };

  const shareBook = useCallback(async (book, e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/reader.html?id=${book.id}`;
    const title = `Read ${book.title}`;
    const text = `Check out ${book.title} on DewDrop Stories.`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // User cancelled or share failed — fall back.
      }
    }

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        setCopiedId(book.id);
        setTimeout(() => setCopiedId(null), 2000);
        return;
      } catch {
        // Fall through to prompt fallback.
      }
    }

    window.prompt("Copy this link", url);
  }, []);

  const openDesc = useCallback((book, e) => {
    e.stopPropagation();
    setDescBook(book);
  }, []);

  // ── derived lists ──────────────────────────────────────────────────────────

  const sortOptions = [
    { value: "recent", label: "Recently Added" },
    { value: "az",     label: "A → Z" },
    { value: "za",     label: "Z → A" },
  ];

  let filtered = books.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) &&
    (category === "All" || b.category === category) &&
    (!showFavoritesOnly || wishlist.includes(b.id))
  );
  if (sort === "az") filtered.sort((a, b) => a.title.localeCompare(b.title));
  else if (sort === "za") filtered.sort((a, b) => b.title.localeCompare(a.title));

  const suggestions = search.length > 0
    ? books.filter(b => b.title.toLowerCase().includes(search.toLowerCase())).slice(0, 5)
    : [];

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-full px-3 pt-2 pb-12 mx-auto sm:px-5 md:px-7 lg:px-10">

      {/* ── SEARCH & FILTERS ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between md:gap-5">
        <div ref={searchRef} className="relative flex-1 max-w-md">
          <div className="flex items-center w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 transition-all sm:px-4 sm:py-2.5">
            <Search size={16} className="text-gray-400 sm:size-[18px]" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search books…  /"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              className="flex-1 ml-2 text-sm bg-transparent outline-none placeholder:text-gray-400 dark:text-white sm:text-base select-text"
            />
            {search && (
              <button onClick={() => setSearch("")} className="p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <X size={12} className="text-gray-400 sm:size-[14px]" />
              </button>
            )}
          </div>

          {searchOpen && suggestions.length > 0 && (
            <MotionDiv
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute left-0 right-0 z-50 mt-2 overflow-hidden bg-white border border-gray-100 shadow-lg dark:bg-gray-800 dark:border-gray-700 rounded-xl top-full"
            >
              {suggestions.map((book) => (
                <div
                  key={book.id}
                  onClick={() => openReader(book.id)}
                  className="flex items-center gap-3 p-2 transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 sm:p-3"
                >
                  <img src={book.cover} className="object-cover h-10 rounded-md w-7 sm:w-8 sm:h-11" alt="" />
                  <div>
                    <p className="text-xs font-medium dark:text-white sm:text-sm">{book.title}</p>
                    {book.category && <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5">{book.category}</p>}
                  </div>
                </div>
              ))}
            </MotionDiv>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Sort */}
          <div ref={sortRef} className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors sm:gap-1.5 sm:px-3 sm:py-2.5 sm:text-sm"
            >
              <span className="hidden xs:inline dark:text-white">Sort</span>
              <span className="dark:text-white">{sortOptions.find(s => s.value === sort)?.label}</span>
              <ChevronDown size={12} className={`transition-transform sm:size-[14px] ${sortOpen ? "rotate-180" : ""}`} />
            </button>
            {sortOpen && (
              <MotionDiv
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-0 z-50 mt-1 overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg rounded-xl min-w-[130px]"
              >
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSort(opt.value); setSortOpen(false); }}
                    className={`block w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 sm:px-4 sm:py-2 sm:text-sm
                      ${sort === opt.value ? "text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400" : "text-gray-700 dark:text-gray-300"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </MotionDiv>
            )}
          </div>

          {/* Favorites */}
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center gap-1 px-2.5 py-2 text-xs font-medium transition-colors rounded-xl sm:gap-1.5 sm:px-3 sm:py-2.5 sm:text-sm ${
              showFavoritesOnly
                ? "bg-red-500 text-white"
                : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            <Heart size={14} className={showFavoritesOnly ? "fill-white" : ""} />
            <span>Favorites</span>
          </button>

          {/* View mode */}
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-amber-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-amber-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── CATEGORY CHIPS ───────────────────────────────────────────────── */}
      {ALL_CATEGORIES.length > 1 && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-0.5 scrollbar-hide">
          {ALL_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                category === cat
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-amber-400 hover:text-amber-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* ── CONTINUE READING ─────────────────────────────────────────────── */}
      {recent.length > 0 && (
        <section className="relative mb-4 sm:mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-amber-600 dark:text-amber-500" />
            <h2 className="text-base font-semibold tracking-tight dark:text-white sm:text-lg">Continue Reading</h2>
          </div>
          <div className="flex gap-2 py-0.5 overflow-x-auto scrollbar-hide">
            {recent.slice(0, 5).map((item, i) => (
              <MotionDiv
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => openReader(item.bookId, true)}
                className="group relative min-w-[160px] max-w-[160px] snap-start cursor-pointer flex-shrink-0"
              >
                <div className="flex items-center gap-2 px-2 py-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 rounded-lg shadow-sm active:scale-[0.98] transition-transform">
                  <img
                    src={item.book.cover}
                    className="w-8 h-11 object-cover rounded flex-shrink-0"
                    style={{ boxShadow: "1px 2px 5px rgba(0,0,0,0.22)" }}
                    alt=""
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[10px] font-semibold truncate text-gray-900 dark:text-white leading-tight">{item.book.title}</h3>
                    <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">Ch {item.chapter + 1} · {Math.round(item.progressPercent)}%</p>
                    <div className="mt-1.5 h-[3px] bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <MotionDiv
                        initial={{ width: 0 }}
                        animate={{ width: `${item.progressPercent}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-amber-500 rounded-full"
                      />
                    </div>
                  </div>
                  <button
                    onClick={(e) => removeFromRecent(item.bookId, e)}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-[10px] leading-none"
                    title="Remove"
                  >✕</button>
                </div>
              </MotionDiv>
            ))}
          </div>
        </section>
      )}

      {/* ── LIBRARY ──────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={18} className="text-amber-600 dark:text-amber-500" />
          <h2 className="text-base font-semibold tracking-tight dark:text-white sm:text-lg">
            Library
            {filtered.length > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500 sm:text-sm">({filtered.length} books)</span>
            )}
          </h2>
        </div>

        {/* Grid view */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 xs:grid-cols-3 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.map((book, index) => (
              <MotionDiv
                key={book.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="cursor-pointer group"
              >
                {/* Cover */}
                <div
                  onClick={() => openReader(book.id)}
                  className="relative aspect-[2/3] rounded-r-md rounded-l-[3px] overflow-hidden transition-all duration-300 md:group-hover:-translate-y-2"
                  style={{ boxShadow: "3px 5px 10px rgba(0,0,0,0.28), 7px 10px 22px rgba(0,0,0,0.14)" }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "5px 12px 20px rgba(0,0,0,0.38), 10px 18px 36px rgba(0,0,0,0.22)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "3px 5px 10px rgba(0,0,0,0.28), 7px 10px 22px rgba(0,0,0,0.14)"; }}
                >
                  <img src={book.cover} className="object-cover w-full h-full" alt="" />
                  <div className="absolute inset-y-0 left-0 w-[10%] bg-gradient-to-r from-black/45 via-black/10 to-transparent pointer-events-none z-10" />
                  <div className="absolute inset-x-0 top-0 h-[5%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none z-10" />

                  {/* Read overlay */}
                  <div className="absolute inset-0 bg-black/0 md:group-hover:bg-black/45 transition-all duration-300 flex items-end justify-center pb-3 z-20">
                    <span className="text-white text-[10px] font-semibold tracking-wide bg-amber-600 px-3 py-1 rounded-full shadow opacity-0 md:group-hover:opacity-100 translate-y-2 md:group-hover:translate-y-0 transition-all duration-300">
                      Read Now
                    </span>
                  </div>

                  {/* Heart (top-right) */}
                  <button
                    onClick={(e) => toggleWishlist(book.id, e)}
                    className="absolute top-1.5 right-1.5 p-1.5 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full transition-all duration-200 z-30 opacity-70 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  >
                    <Heart size={12} className={wishlist.includes(book.id) ? "fill-red-400 text-red-400" : "text-white"} />
                  </button>

                  {/* Share (bottom-right) */}
                  <button
                    onClick={(e) => shareBook(book, e)}
                    className="absolute bottom-1.5 right-1.5 p-1.5 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full transition-all duration-200 z-30 opacity-70 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                    title={copiedId === book.id ? "Copied!" : "Share link"}
                  >
                    {copiedId === book.id
                      ? <span className="text-[9px] text-green-300 font-bold leading-none">✓</span>
                      : <Share2 size={11} className="text-white" />}
                  </button>
                </div>

                {/* Title row — click title for description */}
                <div className="mt-2 px-0.5">
                  <h3
                    onClick={(e) => openDesc(book, e)}
                    className="text-[11px] font-medium leading-snug line-clamp-2 text-gray-800 dark:text-gray-200 hover:text-amber-700 dark:hover:text-amber-400 transition-colors cursor-pointer sm:text-xs"
                  >
                    {book.title}
                  </h3>
                  <p className="mt-0.5 text-[9px] text-gray-400 dark:text-gray-500">
                    ~{readingMinutes(book)} min read
                  </p>
                </div>
              </MotionDiv>
            ))}
          </div>
        ) : (
          /* List view */
          <div className="space-y-2">
            {filtered.map((book) => (
              <MotionDiv
                key={book.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 transition-all bg-white rounded-xl border border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700/50 hover:shadow-md active:scale-[0.99]"
              >
                <div
                  onClick={() => openReader(book.id)}
                  className="flex-shrink-0 w-11 h-16 overflow-hidden rounded-r-md rounded-l-[2px] cursor-pointer"
                  style={{ boxShadow: "2px 3px 8px rgba(0,0,0,0.25)" }}
                >
                  <img src={book.cover} className="object-cover w-full h-full" alt="" />
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openReader(book.id)}>
                  <h3 className="text-sm font-semibold leading-snug text-gray-900 dark:text-white line-clamp-2">{book.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {book.category && (
                      <span className="text-[9px] font-medium text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full">
                        {book.category}
                      </span>
                    )}
                    <span className="text-[9px] text-gray-400 dark:text-gray-500">~{readingMinutes(book)} min</span>
                  </div>
                  <span className="mt-1.5 inline-block text-[10px] font-medium text-amber-600 dark:text-amber-500">Start Reading →</span>
                </div>
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <button onClick={(e) => toggleWishlist(book.id, e)} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Heart size={16} className={wishlist.includes(book.id) ? "fill-red-500 text-red-500" : "text-gray-400"} />
                  </button>
                  <button onClick={(e) => shareBook(book, e)} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={copiedId === book.id ? "Copied!" : "Share link"}>
                    {copiedId === book.id
                      ? <span className="text-[10px] text-green-500 font-bold">✓</span>
                      : <Share2 size={15} className="text-gray-400" />}
                  </button>
                  <button onClick={(e) => openDesc(book, e)} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Info size={15} className="text-gray-400" />
                  </button>
                </div>
              </MotionDiv>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="py-12 text-center sm:py-16">
            <p className="text-xs text-gray-400 dark:text-gray-500 sm:text-sm">
              {showFavoritesOnly ? "No favorite books found." : "No books found matching your search."}
            </p>
            <button
              onClick={() => { setSearch(""); setShowFavoritesOnly(false); setCategory("All"); }}
              className="mt-2 text-xs text-amber-600 hover:text-amber-700 sm:mt-3 sm:text-sm"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {/* ── DESCRIPTION MODAL ────────────────────────────────────────────── */}
      <AnimatePresence>
        {descBook && (
          <MotionDiv
            key="desc-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setDescBook(null)}
          >
            <MotionDiv
              key="desc-modal"
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Cover strip */}
              <div className="relative h-32 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                <img
                  src={descBook.cover}
                  className="h-28 w-auto object-cover rounded-md shadow-xl"
                  style={{ boxShadow: "4px 8px 20px rgba(0,0,0,0.35)" }}
                  alt=""
                />
                <button
                  onClick={() => setDescBook(null)}
                  className="absolute top-3 right-3 p-1.5 bg-black/20 hover:bg-black/30 rounded-full text-white"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">{descBook.title}</h2>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {descBook.category && (
                      <span className="text-[9px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {descBook.category}
                      </span>
                    )}
                    <span className="text-[9px] text-gray-400 dark:text-gray-500 whitespace-nowrap">~{readingMinutes(descBook)} min read</span>
                  </div>
                </div>

                {descBook.description && (
                  <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400 font-serif italic mb-4">
                    {descBook.description}
                  </p>
                )}

                {descBook.author && (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-4">by {descBook.author}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => openReader(descBook.id)}
                    className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition-colors"
                  >
                    Start Reading
                  </button>
                  <button
                    onClick={() => setDescBook(null)}
                    className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>

    </div>
  );
}

export default Home;
