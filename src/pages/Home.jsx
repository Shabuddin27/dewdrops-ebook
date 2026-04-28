import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import books from "../data/books.json";
import { ChevronLeft, ChevronRight } from "lucide-react";

function Home() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("asc");
  const [recent, setRecent] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);

  // carousel state
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // refs
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  // drag refs
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);

  // focus search
  useEffect(() => {
    if (searchOpen && inputRef.current) inputRef.current.focus();
  }, [searchOpen]);

  // close search on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // load recent reading
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("reading-progress")) || [];
    const mapped = saved
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((p) => ({
        ...p,
        book: books.find((b) => b.id === p.bookId),
      }))
      .filter((p) => p.book);
    setRecent(mapped);
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
    const saved = JSON.parse(localStorage.getItem("reading-progress")) || [];
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
  const categories = [...new Set(books.map((b) => b.category))];

  let filteredBooks = books.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase())
  );

  if (category) {
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

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* SEARCH */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div ref={searchRef} className="relative w-full md:w-auto">
          <div className="flex items-center bg-white rounded-2xl shadow-sm border p-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-3 text-xl"
            >
              🔍
            </button>
            <input
              ref={inputRef}
              type="text"
              placeholder="Find your next story..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              className="bg-transparent outline-none px-2 w-full md:w-64"
            />
          </div>

          {searchOpen && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl overflow-hidden z-50">
              {suggestions.map((book) => (
                <div
                  key={book.id}
                  onClick={() => navigate(`/reader/${book.id}`)}
                  className="flex items-center gap-4 p-3 hover:bg-gray-50 cursor-pointer"
                >
                  <img
                    src={book.cover}
                    className="w-10 h-14 rounded-lg"
                    alt=""
                  />
                  <div>
                    <p className="text-sm font-semibold">{book.title}</p>
                    <p className="text-xs text-gray-400">
                      {book.category}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="flex-1 md:w-48 p-3 rounded-2xl bg-white"
          >
            <option value="">All Genres</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="p-3 rounded-2xl bg-white"
          >
            <option value="asc">A-Z</option>
            <option value="desc">Z-A</option>
          </select>
        </div>
      </div>

      {/* CONTINUE READING — NETFLIX STYLE */}
      {recent.length > 0 && (
        <section className="mb-16 relative group">
          <h2 className="text-xl font-serif font-bold mb-6">
            Continue Reading
          </h2>

          {/* LEFT ARROW */}
                  {canScrollLeft && (
            <button
              onClick={() =>
                scrollRef.current.scrollBy({ left: -260, behavior: "smooth" })
              }
              className="absolute left-1 top-1/2 -translate-y-1/2 z-20
              w-12 h-12 flex items-center justify-center
              rounded-full bg-white/80 backdrop-blur-md
              shadow-xl border border-gray-200
              opacity-0 group-hover:opacity-100
              hover:scale-110 hover:bg-white
              transition-all duration-300"
            >
              <ChevronLeft size={22} className="text-gray-700" />
            </button>
          )}

          {/* RIGHT ARROW */}
                {canScrollRight && (
          <button
            onClick={() =>
              scrollRef.current.scrollBy({ left: 260, behavior: "smooth" })
            }
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20
            w-12 h-12 flex items-center justify-center
            rounded-full bg-white/80 backdrop-blur-md
            shadow-xl border border-gray-200
            opacity-0 group-hover:opacity-100
            hover:scale-110 hover:bg-white
            transition-all duration-300"
          >
            <ChevronRight size={22} className="text-gray-700" />
          </button>
        )}

          {/* SCROLL AREA */}
          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className="flex gap-6 overflow-hidden pb-6 pt-2 
            no-scrollbar snap-x snap-mandatory scroll-smooth px-12
            cursor-grab active:cursor-grabbing"
          >
            {recent.slice(0, 5).map(
              (item, i) =>
                item.book && (
                  <div
                    key={i}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => navigate(`/reader/${item.bookId}`)}
                    className="relative min-w-[240px] snap-start group cursor-pointer 
                    transition-transform duration-300 hover:-translate-y-2 hover:scale-[1.03]"
                  >
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3 
                    shadow-[0_8px_25px_rgba(0,0,0,0.08)] 
                    hover:shadow-[0_15px_40px_rgba(0,0,0,0.15)] 
                    transition-all duration-300">
                      
                      <div className="flex gap-3">
                        <img
                          src={item.book.cover}
                          className="w-14 h-20 object-cover rounded-md shadow-sm 
                          group-hover:scale-105 transition duration-300"
                          alt=""
                        />

                        <div className="flex-1">
                          <h3 className="text-sm font-semibold leading-tight line-clamp-2 max-w-[200px]">
                            {item.book.title}
                          </h3>

                          <p className="text-xs text-gray-400 mt-1">
                            Ch. {item.chapter + 1} • Pg. {item.page + 1}
                          </p>

                          <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                              style={{
                                width: `${
                                  (item.page /
                                    item.book.chapters[item.chapter].pages.length) *
                                  100
                                }%`,
                              }}
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
                      className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs 
                              bg-white/80 transition hover:bg-red-500 hover:text-white
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
        <h2 className="text-xl font-serif font-bold mb-8">
          Library
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              onClick={() => navigate(`/reader/${book.id}`)}
              className="group cursor-pointer"
            >
              <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-lg group-hover:-translate-y-3 transition">
                <img
                  src={book.cover}
                  className="w-full h-full object-cover group-hover:scale-110 transition"
                  alt=""
                />
              </div>

              <h3 className="mt-4 text-sm font-bold line-clamp-2">
                {book.title}
              </h3>

              <p className="text-xs text-gray-400">
                {book.category}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;