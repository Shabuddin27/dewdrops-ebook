import { useState, useEffect, useRef } from "react";
import books from "../data/books.json";
import { Search, X, Filter, ChevronDown, Clock, BookOpen, Heart, Grid, List } from "lucide-react";
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
  const [category, setCategory] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [sort, setSort] = useState("recent");
  const [sortOpen, setSortOpen] = useState(false);
  const [recent, setRecent] = useState(getRecentReading);
  const [viewMode, setViewMode] = useState("grid");
  const [wishlist, setWishlist] = useState(getWishlist);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const categoryRef = useRef(null);
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
      if (categoryRef.current && !categoryRef.current.contains(e.target)) setCategoryOpen(false);
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

  const categories = ["All Genres", ...new Set(books.map(b => b.category))];
  const sortOptions = [
    { value: "recent", label: "Recently Added" },
    { value: "az", label: "A → Z" },
    { value: "za", label: "Z → A" },
  ];

  let filteredBooks = books.filter(b => b.title.toLowerCase().includes(search.toLowerCase()));
  if (category && category !== "All Genres") filteredBooks = filteredBooks.filter(b => b.category === category);
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
          <div className="flex items-center w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all sm:px-4 sm:py-2.5">
            <Search size={16} className="text-gray-400 sm:size-[18px]" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search books..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              className="flex-1 ml-2 text-sm bg-transparent outline-none placeholder:text-gray-400 dark:text-white sm:text-base"
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
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 sm:text-xs">{book.category}</p>
                  </div>
                </div>
              ))}
            </MotionDiv>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <div ref={categoryRef} className="relative">
            <button
              onClick={() => setCategoryOpen(!categoryOpen)}
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors sm:gap-1.5 sm:px-3 sm:py-2.5 sm:text-sm"
            >
              <Filter size={14} />
              <span className="max-w-[80px] truncate xs:max-w-[100px] dark:text-white">{category || "All Genres"}</span>
              <ChevronDown size={12} className={`transition-transform sm:size-[14px] ${categoryOpen ? "rotate-180" : ""}`} />
            </button>

            {categoryOpen && (
              <MotionDiv
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-0 z-50 mt-1 overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg rounded-xl min-w-[130px] sm:min-w-[140px]"
              >
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCategory(c === "All Genres" ? "" : c); setCategoryOpen(false); }}
                    className={`block w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 sm:px-4 sm:py-2 sm:text-sm
                      ${(!category && c === "All Genres") || category === c ? "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}
                  >
                    {c}
                  </button>
                ))}
              </MotionDiv>
            )}
          </div>

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
                      ${sort === opt.value ? "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}
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
              className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}
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
            <Clock size={18} className="text-blue-500" />
            <h2 className="text-base font-semibold tracking-tight dark:text-white sm:text-lg">
              Continue Reading
            </h2>
          </div>

          <div className="flex gap-2 py-1 overflow-x-auto scrollbar-hide sm:gap-3">
            {recent.slice(0, 5).map((item, i) => (
              <MotionDiv
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => openReader(item.bookId, true)}
                className="group relative min-w-[220px] max-w-[220px] snap-start transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="p-2.5 transition-all bg-white border border-gray-100 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 hover:shadow-md">

                  <button
                    onClick={(e) => removeFromRecent(item.bookId, e)}
                    className="absolute z-20 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-gray-500 bg-white border border-gray-200 rounded-full shadow-md -top-2 -right-2 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 opacity-90 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:!bg-red-500 hover:!text-white hover:!border-red-500 transition-all duration-200"
                    title="Remove from continue reading"
                  >
                    ✕
                  </button>

                  <div className="flex gap-2.5">
                    <img
                      src={item.book.cover}
                      className="object-cover w-10 h-14 rounded-md shadow-sm shrink-0"
                      alt=""
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[11px] font-medium leading-snug break-words dark:text-white">
                        {item.book.title}
                      </h3>
                      <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                        Ch {item.chapter + 1} • Page {item.currentPage} of {item.totalPages}
                      </p>
                      <div className="h-1.5 mt-1.5 overflow-hidden bg-gray-100 dark:bg-gray-700 rounded-full">
                        <MotionDiv
                          initial={{ width: 0 }}
                          animate={{ width: `${item.progressPercent}%` }}
                          transition={{ duration: 0.5 }}
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                        />
                      </div>
                      <p className="mt-1 text-[9px] font-medium text-blue-500 dark:text-blue-400">
                        {Math.round(item.progressPercent)}% complete
                      </p>
                    </div>
                  </div>
                </div>
              </MotionDiv>
            ))}
          </div>
        </section>
      )}

      {/* LIBRARY SECTION */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={18} className="text-blue-500" />
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
          <div className="grid grid-cols-2 gap-2 xs:grid-cols-3 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filteredBooks.map((book, index) => (
              <MotionDiv
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => openReader(book.id)}
                className="cursor-pointer group"
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-md md:group-hover:shadow-xl transition-all duration-300 md:group-hover:-translate-y-1">
                  <img src={book.cover} className="object-cover w-full h-full transition duration-500 md:group-hover:scale-105" alt="" />
                  <button
                    onClick={(e) => toggleWishlist(book.id, e)}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-full shadow transition-all duration-200 opacity-90 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  >
                    <Heart size={14} className={isWishlisted(book.id) ? "fill-red-500 text-red-500" : "text-gray-600 dark:text-gray-300"} />
                  </button>
                </div>
                <h3 className="mt-1 text-[11px] font-medium leading-tight line-clamp-2 dark:text-white sm:mt-1.5 sm:text-xs">
                  {book.title}
                </h3>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 truncate sm:text-[10px]">
                  {book.category}
                </p>
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
                className="flex gap-3 p-3 transition-all bg-white rounded-lg shadow-sm cursor-pointer dark:bg-gray-800 hover:shadow-md"
              >
                <div className="flex-shrink-0 w-12 h-16 overflow-hidden rounded-md">
                  <img src={book.cover} className="object-cover w-full h-full" alt="" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium dark:text-white">{book.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{book.category}</p>
                  <button className="mt-1 text-xs font-medium text-blue-500 hover:text-blue-600">
                    Start Reading →
                  </button>
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
              className="mt-2 text-xs text-blue-500 hover:text-blue-600 sm:mt-3 sm:text-sm"
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
