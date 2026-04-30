import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import books from "../data/books.json";
import { ChevronLeft, ChevronRight, ChevronDown, Search, X } from "lucide-react";

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
    .map((p) => ({
      ...p,
      book: books.find((b) => b.id === p.bookId),
    }))
    .filter((p) => p.book);
};

const getChapterPageCount = (book, chapterIndex) => {
  const chapter = book?.chapters?.[chapterIndex];
  if (!chapter) return 1;
  if (Array.isArray(chapter.pages)) return Math.max(chapter.pages.length, 1);
  return Math.max(Math.ceil((chapter.content || "").length / 1400), 1);
};

const getProgressPercent = (item) => {
  const pageCount = getChapterPageCount(item.book, item.chapter);
  const currentPage = Math.min(Math.max(item.page || 0, 0), pageCount - 1);
  return Math.min(((currentPage + 1) / pageCount) * 100, 100);
};

function Home() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("asc");
  const [recent, setRecent] = useState(getRecentReading);
  const [searchOpen, setSearchOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  // carousel state
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // refs
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const categoryRef = useRef(null);
  const sortRef = useRef(null);

  // drag refs
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);

  // focus search
  useEffect(() => {
    if (searchOpen && inputRef.current) inputRef.current.focus();
  }, [searchOpen]);

  // close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setCategoryOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // update arrow visibility
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const updateScroll = () => {
      setCanScrollLeft(el.scrollLeft > 10);
      setCanScrollRight(
        el.scrollLeft + el.clientWidth < el.scrollWidth - 10
      );
    };

    updateScroll();
    el.addEventListener("scroll", updateScroll);
    return () => el.removeEventListener("scroll", updateScroll);
  }, [recent]);

  // drag handlers (desktop swipe)
  const handleMouseDown = (e) => {
    isDown.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftStart.current = scrollRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDown.current = false;
  };

  const handleMouseUp = () => {
    isDown.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isDown.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.2;
    scrollRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  const [hoveredIndex, setHoveredIndex] = useState(null);

  // remove from continue reading
  const removeItem = (bookId) => {
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem("reading-progress")) || [];
    } catch {
      saved = [];
    }
    if (!Array.isArray(saved)) saved = [];
    const updated = saved.filter((p) => p.bookId !== bookId);
    localStorage.setItem("reading-progress", JSON.stringify(updated));
    setRecent(
      updated
        .map((p) => ({
          ...p,
          book: books.find((b) => b.id === p.bookId),
        }))
        .filter((p) => p.book)
    );
  };

  // filters
  const categories = ["All Genres", ...new Set(books.map((b) => b.category))];
  
  const sortOptions = [
    { value: "asc", label: "A → Z" },
    { value: "desc", label: "Z → A" },
  ];

  let filteredBooks = books.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase())
  );

  if (category && category !== "All Genres") {
    filteredBooks = filteredBooks.filter((b) => b.category === category);
  }

  filteredBooks.sort((a, b) =>
    sort === "asc"
      ? a.title.localeCompare(b.title)
      : b.title.localeCompare(a.title)
  );

  const suggestions =
    search.length > 0
      ? books
          .filter((b) =>
            b.title.toLowerCase().includes(search.toLowerCase())
          )
          .slice(0, 5)
      : [];

  const getCategoryLabel = () => {
    if (!category) return "All Genres";
    return category;
  };

  const getSortLabel = () => {
    return sortOptions.find(opt => opt.value === sort)?.label || "A → Z";
  };

  return (
    <div className="w-full px-3 pt-2 pb-12 mx-auto sm:px-5 md:px-7 lg:px-10">
      {/* SEARCH & FILTERS - Full Width Row */}
      <div className="flex flex-col gap-3 mb-6 md:flex-row md:items-center md:justify-between md:gap-5">
        {/* Search Bar - Flexible */}
        <div ref={searchRef} className="relative flex-1 max-w-md">
          <div className="flex items-center w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all sm:px-4 sm:py-2.5">
            <Search size={16} className="text-gray-400 sm:size-[18px]" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search books..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              className="flex-1 ml-2 text-sm bg-transparent outline-none placeholder:text-gray-400 sm:text-base"
            />
            {search && (
              <button 
                onClick={() => setSearch("")}
                className="p-0.5 rounded-full hover:bg-gray-100"
              >
                <X size={12} className="text-gray-400 sm:size-[14px]" />
              </button>
            )}
          </div>

          {/* Search Suggestions */}
          {searchOpen && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden bg-white border border-gray-100 shadow-lg rounded-xl top-full">
              {suggestions.map((book) => (
                <div
                  key={book.id}
                  onClick={() => {
                    navigate(`/reader/${book.id}`);
                    setSearchOpen(false);
                    setSearch("");
                  }}
                  className="flex items-center gap-3 p-2 transition-colors cursor-pointer hover:bg-gray-50 sm:p-3"
                >
                  <img
                    src={book.cover}
                    className="object-cover h-10 rounded-md w-7 sm:w-8 sm:h-11"
                    alt=""
                  />
                  <div>
                    <p className="text-xs font-medium sm:text-sm">{book.title}</p>
                    <p className="text-[10px] text-gray-400 sm:text-xs">{book.category}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filter Row - Compact */}
        <div className="flex gap-2">
          {/* Category Dropdown */}
          <div ref={categoryRef} className="relative">
            <button
              onClick={() => {
                setCategoryOpen(!categoryOpen);
                setSortOpen(false);
              }}
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors sm:gap-1.5 sm:px-3 sm:py-2.5 sm:text-sm"
            >
              <span className="hidden xs:inline">Genre</span>
              <span className="max-w-[80px] truncate xs:max-w-[100px]">{getCategoryLabel()}</span>
              <ChevronDown size={12} className={`transition-transform sm:size-[14px] ${categoryOpen ? "rotate-180" : ""}`} />
            </button>

            {categoryOpen && (
              <div className="absolute right-0 z-50 mt-1 overflow-hidden bg-white border border-gray-100 shadow-lg rounded-xl min-w-[130px] sm:min-w-[140px]">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCategory(c === "All Genres" ? "" : c);
                      setCategoryOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-gray-50 sm:px-4 sm:py-2 sm:text-sm
                      ${(!category && c === "All Genres") || category === c ? "text-blue-600 bg-blue-50" : "text-gray-700"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div ref={sortRef} className="relative">
            <button
              onClick={() => {
                setSortOpen(!sortOpen);
                setCategoryOpen(false);
              }}
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors sm:gap-1.5 sm:px-3 sm:py-2.5 sm:text-sm"
            >
              <span className="hidden xs:inline">Sort</span>
              <span>{getSortLabel()}</span>
              <ChevronDown size={12} className={`transition-transform sm:size-[14px] ${sortOpen ? "rotate-180" : ""}`} />
            </button>

            {sortOpen && (
              <div className="absolute right-0 z-50 mt-1 overflow-hidden bg-white border border-gray-100 shadow-lg rounded-xl min-w-[90px] sm:min-w-[100px]">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSort(opt.value);
                      setSortOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-gray-50 sm:px-4 sm:py-2 sm:text-sm
                      ${sort === opt.value ? "text-blue-600 bg-blue-50" : "text-gray-700"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONTINUE READING — NETFLIX STYLE */}
      {recent.length > 0 && (
        <section className="relative mb-6 group sm:mb-8">
          <h2 className="mb-3 text-base font-semibold tracking-tight sm:text-lg md:mb-4">
            Continue Reading
          </h2>

          {/* LEFT ARROW */}
          {canScrollLeft && (
            <button
              onClick={() =>
                scrollRef.current.scrollBy({ left: -260, behavior: "smooth" })
              }
              className="absolute z-20 flex items-center justify-center w-6 h-6 transition-all duration-300 -translate-y-1/2 border border-gray-200 rounded-full shadow-lg opacity-0 -left-2 top-1/2 bg-white/90 backdrop-blur-sm group-hover:opacity-100 hover:scale-110 hover:bg-white sm:w-8 sm:h-8 md:w-10 md:h-10 lg:-left-3"
            >
              <ChevronLeft size={14} className="text-gray-600 sm:size-[16px] md:size-[18px]" />
            </button>
          )}

          {/* RIGHT ARROW */}
          {canScrollRight && (
            <button
              onClick={() =>
                scrollRef.current.scrollBy({ left: 260, behavior: "smooth" })
              }
              className="absolute z-20 flex items-center justify-center w-6 h-6 transition-all duration-300 -translate-y-1/2 border border-gray-200 rounded-full shadow-lg opacity-0 -right-2 top-1/2 bg-white/90 backdrop-blur-sm group-hover:opacity-100 hover:scale-110 hover:bg-white sm:w-8 sm:h-8 md:w-10 md:h-10 lg:-right-3"
            >
              <ChevronRight size={14} className="text-gray-600 sm:size-[16px] md:size-[18px]" />
            </button>
          )}

          {/* SCROLL AREA */}
          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className="flex gap-2 pb-3 overflow-hidden no-scrollbar snap-x snap-mandatory scroll-smooth cursor-grab active:cursor-grabbing sm:gap-3"
          >
            {recent.slice(0, 5).map(
              (item, i) =>
                item.book && (
                  <div
                    key={i}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => navigate(`/reader/${item.bookId}`)}
                    className="relative min-w-[160px] snap-start group cursor-pointer transition-all duration-300 hover:-translate-y-1 sm:min-w-[180px] md:min-w-[200px] lg:min-w-[220px]"
                  >
                    <div className="p-1.5 transition-all bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md sm:p-2">
                      
                      <div className="flex gap-2">
                        <img
                          src={item.book.cover}
                          className="object-cover h-12 rounded-md shadow-sm w-9 sm:w-10 sm:h-14"
                          alt=""
                        />

                        <div className="flex-1 min-w-0">
                          <h3 className="text-[11px] font-medium leading-tight line-clamp-2 sm:text-xs">
                            {item.book.title}
                          </h3>

                          <p className="mt-0.5 text-[9px] text-gray-400 sm:mt-1 sm:text-[10px]">
                            Ch {item.chapter + 1} • Pg {item.page + 1}
                          </p>

                          <div className="h-1 mt-1 overflow-hidden bg-gray-100 rounded-full sm:mt-1.5">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                              style={{ width: `${getProgressPercent(item)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(item.bookId);
                      }}
                      className={`absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white shadow-md flex items-center justify-center text-[10px] 
                              transition hover:bg-red-500 hover:text-white sm:w-5 sm:h-5 sm:text-xs
                              ${hoveredIndex === i ? "opacity-100" : "opacity-0"}`}
                    >
                      ✕
                    </button>
                  </div>
                )
            )}
          </div>
        </section>
      )}

      {/* LIBRARY */}
      <section>
        <h2 className="mb-3 text-base font-semibold tracking-tight sm:text-lg md:mb-4">
          Library
          {filteredBooks.length > 0 && (
            <span className="ml-2 text-xs font-normal text-gray-400 sm:text-sm">
              ({filteredBooks.length} books)
            </span>
          )}
        </h2>

        <div className="grid grid-cols-2 gap-2 xs:grid-cols-3 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              onClick={() => navigate(`/reader/${book.id}`)}
              className="cursor-pointer group"
            >
              <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                <img
                  src={book.cover}
                  className="object-cover w-full h-full transition duration-500 group-hover:scale-105"
                  alt=""
                />
              </div>

              <h3 className="mt-1 text-[11px] font-medium leading-tight line-clamp-2 sm:mt-1.5 sm:text-xs">
                {book.title}
              </h3>

              <p className="text-[9px] text-gray-400 truncate sm:text-[10px]">
                {book.category}
              </p>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filteredBooks.length === 0 && (
          <div className="py-12 text-center sm:py-16">
            <p className="text-xs text-gray-400 sm:text-sm">No books found matching your search.</p>
            <button
              onClick={() => {
                setSearch("");
                setCategory("");
              }}
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
