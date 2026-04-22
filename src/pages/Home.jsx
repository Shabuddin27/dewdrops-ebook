import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import books from "../data/books.json";

function Home() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("asc");
  const [recent, setRecent] = useState([]);

  const [dark, setDark] = useState(
    localStorage.getItem("theme") === "dark"
  );

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // ================= THEME =================
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  // ================= SCROLL =================
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ================= AUTO FOCUS =================
  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  // ================= OUTSIDE CLICK =================
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ================= LOAD CONTINUE =================
  useEffect(() => {
    const loadProgress = () => {
      const saved =
        JSON.parse(localStorage.getItem("reading-progress")) || [];

      const mapped = saved.map((p) => ({
        ...p,
        book: books.find((b) => b.id === p.bookId),
      }));

      setRecent(mapped);
    };

    loadProgress();
    window.addEventListener("focus", loadProgress);
    return () => window.removeEventListener("focus", loadProgress);
  }, []);

  // ================= FILTER =================
  const categories = [...new Set(books.map((b) => b.category))];

  let filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(search.toLowerCase())
  );

  if (category) {
    filteredBooks = filteredBooks.filter(
      (book) => book.category === category
    );
  }

  filteredBooks.sort((a, b) =>
    sort === "asc"
      ? a.title.localeCompare(b.title)
      : b.title.localeCompare(a.title)
  );

  // 🔥 LIVE SEARCH RESULTS (LIMIT 5)
  const suggestions =
    search.length > 0
      ? books
          .filter((b) =>
            b.title.toLowerCase().includes(search.toLowerCase())
          )
          .slice(0, 5)
      : [];

  return (
    <div className="min-h-screen bg-[#f9fafb] dark:bg-[#111827] transition px-4 sm:px-6 py-10">

      {/* ================= HEADER ================= */}
      <div
        className={`sticky top-0 z-50 backdrop-blur-md transition-all duration-300
        bg-[#f9fafb]/80 dark:bg-[#111827]/80
        ${scrolled ? "shadow-md py-2" : "py-4"}
      `}
      >
        <div className="max-w-6xl mx-auto flex justify-between items-center">

          {/* TITLE */}
          <h1
            className={`font-serif font-bold text-gray-600 dark:text-white transition-all duration-300
            ${scrolled ? "text-xl" : "text-3xl md:text-4xl"}
          `}
          >
            DewDrops
          </h1>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-2">

            {/* 🔍 SEARCH WITH DROPDOWN */}
            <div ref={searchRef} className="relative flex items-center">

              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700"
              >
                🔍
              </button>

              <input
                ref={inputRef}
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`ml-2 transition-all duration-300 ease-in-out
                  ${searchOpen ? "w-40 md:w-64 opacity-100 px-3 py-2" : "w-0 opacity-0 p-0"}
                  rounded-lg border bg-white dark:bg-gray-800 dark:text-white shadow-sm overflow-hidden`}
              />

              {/* 🔥 DROPDOWN */}
              {searchOpen && suggestions.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                  {suggestions.map((book) => (
                    <div
                      key={book.id}
                      onClick={() => {
                        navigate(`/reader/${book.id}`);
                        setSearch("");
                        setSearchOpen(false);
                      }}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <img
                        src={book.cover}
                        className="w-8 h-12 object-cover rounded"
                      />

                      <div>
                        <p className="text-sm text-gray-800 dark:text-white">
                          {book.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {book.category}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 🌙 TOGGLE */}
            <button
              onClick={() => setDark(!dark)}
              className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-sm"
            >
              {dark ? "☀️" : "🌙"}
            </button>
          </div>

        </div>
      </div>

      {/* ================= CONTINUE READING ================= */}
      {recent.length > 0 && (
        <div className="max-w-6xl mx-auto mt-10 mb-12">
          <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">
            Continue Reading
          </h2>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {recent.map((item, index) => {
              if (!item.book) return null;

              const totalPages =
                item.book.chapters[item.chapter].pages.length;

              const progress = (item.page / totalPages) * 100;

              return (
                <div
                  key={index}
                  onClick={() => navigate(`/reader/${item.bookId}`)}
                  className="flex flex-col gap-2 min-w-[240px] bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm hover:shadow-md cursor-pointer transition"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.book.cover}
                      className="w-12 h-16 object-cover rounded"
                    />

                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {item.book.title}
                      </p>

                      <p className="text-xs text-gray-500">
                        Chapter {item.chapter + 1} • Page {item.page + 1}
                      </p>
                    </div>
                  </div>

                  <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded">
                    <div
                      className="h-full bg-blue-500 rounded"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= CONTROLS ================= */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 mb-12">

        <select
          className="p-3 rounded-xl border bg-white dark:bg-gray-800 dark:text-white shadow-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat, i) => (
            <option key={i}>{cat}</option>
          ))}
        </select>

        <select
          className="p-3 rounded-xl border bg-white dark:bg-gray-800 dark:text-white shadow-sm"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="asc">A → Z</option>
          <option value="desc">Z → A</option>
        </select>
      </div>

      {/* ================= GRID ================= */}
      <div className="max-w-6xl mx-auto grid gap-8 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">

        {filteredBooks.map((book) => (
          <div
            key={book.id}
            onClick={() => navigate(`/reader/${book.id}`)}
            className="group cursor-pointer transform transition duration-300 hover:-translate-y-2"
          >
            <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-md group-hover:shadow-xl">
              <img
                src={book.cover}
                className="w-full h-full object-cover group-hover:scale-105 transition"
              />
            </div>

            <h2 className="text-sm mt-3 font-medium text-gray-800 dark:text-white line-clamp-2">
              {book.title}
            </h2>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              {book.category}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;