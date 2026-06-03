import { useState, useEffect, useRef } from "react";
import books from "../data/books.json";
import { Search, X, ChevronDown, Clock, BookOpen, Heart, Grid, List } from "lucide-react";
import { motion as framerMotion } from "framer-motion";

const MotionDiv = framerMotion.div;

const getRecentReading = () => {
  let saved = [];
  try {
    saved = JSON.parse(localStorage.getItem("reading-progress")) || [];
  } catch {
    saved = [];
  }
  if (!Array.isArray(saved)) return [];

  return saved
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map((p) => {
      const book = books.find((b) => b.id === p.bookId);
      if (!book) return null;

      const chapter = book.chapters?.[p.chapter];
      if (!chapter) return { ...p, book, totalPages: 0, currentPage: 0, progressPercent: 0 };

      // Prefer the real page count saved by the reader; fall back to an estimate.
      const contentLength = chapter.content?.length || 0;
      const estimatedCharsPerPage = 800;
      const totalPages = p.totalPages && p.totalPages > 0
        ? p.totalPages
        : Math.max(1, Math.ceil(contentLength / estimatedCharsPerPage));

      let currentPage = 1;
      let progressPercent = 0;

      if (p.pageIndex !== undefined) {
        currentPage = Math.min(p.pageIndex + 1, totalPages);
        if (currentPage >= totalPages) {
          currentPage = totalPages;
          progressPercent = 100;
        } else {
          progressPercent = (currentPage / totalPages) * 100;
        }
      }

      return { ...p, book, currentPage, totalPages, progressPercent };
    })
    .filter((p) => p && p.book);
};

// Open the standalone HTML reader page (full navigation, not the SPA router).
const openReader = (bookId, resume = false) => {
  const params = new URLSearchParams({ id: bookId });
  if (resume) params.set("resume", "true");
  window.location.href = `/reader.html?${params.toString()}`;
};

const getWishlist = () => {
  try {
    const saved = JSON.parse(localStorage.getItem("wishlist")) || [];
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

function Home() {
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sort, setSort] = useState("recent");
  const [sortOpen, setSortOpen] = useState(false);
  const [recent, setRecent] = useState(getRecentReading);
  const [viewMode, setViewMode] = useState("grid");
  const [wishlist, setWishlist] = useState(getWishlist);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const sortRef = useRef(null);

  useEffect(() => {
    const handleStorageChange = () => setRecent(getRecentReading());
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    if (searchOpen && inputRef.current) inputRef.current.focus();
  }, [searchOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const removeFromRecent = (bookId, e) => {
    e.stopPropagation();
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem("reading-progress")) || [];
    } catch {
      saved = [];
    }
    const updated = saved.filter((p) => p.bookId !== bookId);
    localStorage.setItem("reading-progress", JSON.stringify(updated));
    setRecent(getRecentReading());
  };

  const toggleWishlist = (bookId, e) => {
    e.stopPropagation();
    let newWishlist;
    if (wishlist.includes(bookId)) {
      newWishlist = wishlist.filter(id => id !== bookId);
    } else {
      newWishlist = [...wishlist, bookId];
    }
    setWishlist(newWishlist);
    localStorage.setItem("wishlist", JSON.stringify(newWishlist));
  };

  const sortOptions = [
    { value: "recent", label: "Recently Added" },
    { value: "az", label: "A → Z" },
    { value: "za", label: "Z → A" },
  ];

  let filteredBooks = books.filter(b => b.title.toLowerCase().includes(search.toLowerCase()));
  if (showFavoritesOnly) filteredBooks = filteredBooks.filter(b => wishlist.includes(b.id));

  switch (sort) {
    case "az": filteredBooks.sort((a, b) => a.title.localeCompare(b.title)); break;
    case "za": filteredBooks.sort((a, b) => b.title.localeCompare(a.title)); break;
    default: filteredBooks = [...filteredBooks];
  }

  const suggestions = search.length > 0
    ? books.filter(b => b.title.toLowerCase().includes(search.toLowerCase())).slice(0, 5)
    : [];

  const isWishlisted = (bookId) => wishlist.includes(bookId);

  return (
    <div className="w-full px-3 pt-2 pb-12 mx-auto sm:px-5 md:px-7 lg:px-10">

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col gap-3 mb-6 md:flex-row md:items-center md:justify-between md:gap-5">
        <div ref={searchRef} className="relative flex-1 max-w-md">
          <div className="flex items-center w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 transition-all sm:px-4 sm:py-2.5">
            <Search size={16} className="text-gray-400 sm:size-[18px]" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search books..."
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
                  </div>
                </div>
              ))}
            </MotionDiv>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <div ref={sortRef} className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors sm:gap-1.5 sm:px-3 sm:py-2.5 sm:text-sm"
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

      {/* CONTINUE READING SECTION */}
      {recent.length > 0 && (
        <section className="relative mb-4 sm:mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-amber-600 dark:text-amber-500" />
            <h2 className="text-base font-semibold tracking-tight dark:text-white sm:text-lg">
              Continue Reading
            </h2>
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
                  {/* Cover */}
                  <img
                    src={item.book.cover}
                    className="w-8 h-11 object-cover rounded flex-shrink-0"
                    style={{ boxShadow: "1px 2px 5px rgba(0,0,0,0.22)" }}
                    alt=""
                  />
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[10px] font-semibold truncate text-gray-900 dark:text-white leading-tight">
                      {item.book.title}
                    </h3>
                    <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">
                      Ch {item.chapter + 1} · {Math.round(item.progressPercent)}%
                    </p>
                    {/* Progress */}
                    <div className="mt-1.5 h-[3px] bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <MotionDiv
                        initial={{ width: 0 }}
                        animate={{ width: `${item.progressPercent}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-amber-500 rounded-full"
                      />
                    </div>
                  </div>
                  {/* Remove */}
                  <button
                    onClick={(e) => removeFromRecent(item.bookId, e)}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-[10px] leading-none"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              </MotionDiv>
            ))}
          </div>
        </section>
      )}

      {/* LIBRARY SECTION */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={18} className="text-amber-600 dark:text-amber-500" />
          <h2 className="text-base font-semibold tracking-tight dark:text-white sm:text-lg">
            Library
            {filteredBooks.length > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500 sm:text-sm">
                ({filteredBooks.length} books)
              </span>
            )}
          </h2>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 xs:grid-cols-3 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filteredBooks.map((book, index) => (
              <MotionDiv
                key={book.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => openReader(book.id)}
                className="cursor-pointer group"
              >
                {/* Book cover */}
                <div
                  className="relative aspect-[2/3] rounded-r-md rounded-l-[3px] overflow-hidden transition-all duration-300 md:group-hover:-translate-y-2"
                  style={{
                    boxShadow: "3px 5px 10px rgba(0,0,0,0.28), 7px 10px 22px rgba(0,0,0,0.14)",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "5px 12px 20px rgba(0,0,0,0.38), 10px 18px 36px rgba(0,0,0,0.22)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "3px 5px 10px rgba(0,0,0,0.28), 7px 10px 22px rgba(0,0,0,0.14)"; }}
                >
                  <img src={book.cover} className="object-cover w-full h-full" alt="" />

                  {/* Spine shadow */}
                  <div className="absolute inset-y-0 left-0 w-[10%] bg-gradient-to-r from-black/45 via-black/10 to-transparent pointer-events-none z-10" />
                  {/* Top light */}
                  <div className="absolute inset-x-0 top-0 h-[5%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none z-10" />

                  {/* Hover overlay — desktop only */}
                  <div className="absolute inset-0 bg-black/0 md:group-hover:bg-black/45 transition-all duration-300 flex items-end justify-center pb-3 z-20">
                    <span className="text-white text-[10px] font-semibold tracking-wide bg-amber-600 px-3 py-1 rounded-full shadow opacity-0 md:group-hover:opacity-100 translate-y-2 md:group-hover:translate-y-0 transition-all duration-300">
                      Read Now
                    </span>
                  </div>

                  {/* Heart */}
                  <button
                    onClick={(e) => toggleWishlist(book.id, e)}
                    className="absolute top-1.5 right-1.5 p-1.5 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full transition-all duration-200 z-30 opacity-70 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  >
                    <Heart size={12} className={isWishlisted(book.id) ? "fill-red-400 text-red-400" : "text-white"} />
                  </button>
                </div>

                {/* Title */}
                <h3 className="mt-2 text-[11px] font-medium leading-snug line-clamp-2 text-gray-800 dark:text-gray-200 px-0.5 sm:text-xs">
                  {book.title}
                </h3>
              </MotionDiv>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredBooks.map((book) => (
              <MotionDiv
                key={book.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => openReader(book.id)}
                className="flex items-center gap-3 p-3 transition-all bg-white rounded-xl border border-gray-100 shadow-sm cursor-pointer dark:bg-gray-800 dark:border-gray-700/50 hover:shadow-md active:scale-[0.99]"
              >
                <div
                  className="flex-shrink-0 w-11 h-16 overflow-hidden rounded-r-md rounded-l-[2px]"
                  style={{ boxShadow: "2px 3px 8px rgba(0,0,0,0.25)" }}
                >
                  <img src={book.cover} className="object-cover w-full h-full" alt="" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold leading-snug text-gray-900 dark:text-white line-clamp-2">{book.title}</h3>
                  <span className="mt-1.5 inline-block text-[10px] font-medium text-amber-600 dark:text-amber-500">
                    Start Reading →
                  </span>
                </div>
                <button
                  onClick={(e) => toggleWishlist(book.id, e)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 self-center"
                >
                  <Heart size={16} className={isWishlisted(book.id) ? "fill-red-500 text-red-500" : "text-gray-400"} />
                </button>
              </MotionDiv>
            ))}
          </div>
        )}

        {filteredBooks.length === 0 && (
          <div className="py-12 text-center sm:py-16">
            <p className="text-xs text-gray-400 dark:text-gray-500 sm:text-sm">
              {showFavoritesOnly
                ? "No favorite books found. Add some books to your favorites!"
                : "No books found matching your search."}
            </p>
            <button
              onClick={() => { setSearch(""); setCategory(""); setShowFavoritesOnly(false); }}
              className="mt-2 text-xs text-amber-600 hover:text-amber-700 sm:mt-3 sm:text-sm"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;
