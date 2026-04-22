import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import books from "../data/books.json";

function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("asc");
  const [recent, setRecent] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (searchOpen && inputRef.current) inputRef.current.focus();
  }, [searchOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target))
        setSearchOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  useEffect(() => {
    if (scrollRef.current && recent.length > 0) {
      scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  }, [recent]);

  const removeItem = (bookId) => {
    const saved = JSON.parse(localStorage.getItem("reading-progress")) || [];
    const updated = saved.filter((p) => p.bookId !== bookId);
    localStorage.setItem("reading-progress", JSON.stringify(updated));
    setRecent(updated.map((p) => ({ ...p, book: books.find((b) => b.id === p.bookId) })));
  };

  const categories = [...new Set(books.map((b) => b.category))];
  let filteredBooks = books.filter((b) => b.title.toLowerCase().includes(search.toLowerCase()));

  if (category) filteredBooks = filteredBooks.filter((b) => b.category === category);

  filteredBooks.sort((a, b) => sort === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title));

  const suggestions = search.length > 0 ? books.filter((b) => b.title.toLowerCase().includes(search.toLowerCase())).slice(0, 5) : [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* SEARCH */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div ref={searchRef} className="relative w-full md:w-auto">
          <div className="flex items-center bg-white rounded-2xl shadow-sm border p-1">
            <button onClick={() => setSearchOpen(true)} className="p-3 text-xl">🔍</button>
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
                  <img src={book.cover} className="w-10 h-14 rounded-lg" alt="" />
                  <div>
                    <p className="text-sm font-semibold">{book.title}</p>
                    <p className="text-xs text-gray-400">{book.category}</p>
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
            {categories.map((c) => <option key={c}>{c}</option>)}
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

      {/* CONTINUE READING */}
      {recent.length > 0 && (
        <section className="mb-16">
          <h2 className="text-xl font-serif font-bold mb-6">Continue Reading</h2>
          <div ref={scrollRef} className="flex gap-6 overflow-x-auto pb-6 pt-2 no-scrollbar">
            {recent.map((item, i) => item.book && (
              <div key={i} onClick={() => navigate(`/reader/${item.bookId}`)} className="relative min-w-[240px] group cursor-pointer">
                <div className="bg-white rounded-2xl p-3 shadow-sm hover:shadow-lg transition-all">
                  <div className="flex gap-3">
                    <img src={item.book.cover} className="w-14 h-20 object-cover rounded-md" alt="" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold">{item.book.title}</h3>
                      <p className="text-xs text-gray-400 mt-1">Ch. {item.chapter + 1} • Pg. {item.page + 1}</p>
                      <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${(item.page / item.book.chapters[item.chapter].pages.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeItem(item.bookId); }}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-xs hover:text-red-500"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* LIBRARY */}
      <section>
        <h2 className="text-xl font-serif font-bold mb-8">Library</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              onClick={(e) => {
                const card = e.currentTarget;
                card.style.transform = "scale(0.95)";
                card.style.transition = "transform 0.2s ease";
                setTimeout(() => { navigate(`/reader/${book.id}`); }, 150);
              }}
              className="group cursor-pointer"
            >
              <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-lg group-hover:-translate-y-3 transition">
                <img src={book.cover} className="w-full h-full object-cover group-hover:scale-110 transition" alt="" />
              </div>
              <h3 className="mt-4 text-sm font-bold">{book.title}</h3>
              <p className="text-xs text-gray-400">{book.category}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;