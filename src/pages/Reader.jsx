import { useParams } from "react-router-dom";
import books from "../data/books.json";
import { useState, useEffect, useRef } from "react";

function Reader() {
  const { id } = useParams();
  const book = books.find((b) => b.id === parseInt(id));

  const [currentChapter, setCurrentChapter] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const [theme, setTheme] = useState(
    localStorage.getItem("reader-theme") || "light"
  );

  const touchStartX = useRef(0);

  if (!book) return <div>Book not found</div>;

  // ================= RESPONSIVE =================
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      setCurrentPage((prev) => {
        if (!mobile) return prev % 2 === 0 ? prev : prev - 1;
        return prev;
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ================= SAVE THEME =================
  useEffect(() => {
    localStorage.setItem("reader-theme", theme);
  }, [theme]);

  // ================= LOAD PROGRESS =================
  useEffect(() => {
    if (!book) return;

    const saved =
      JSON.parse(localStorage.getItem("reading-progress")) || [];

    const progress = saved.find((p) => p.bookId === book.id);

    if (progress) {
      setCurrentChapter(progress.chapter);
      setCurrentPage(progress.page);
      setIsOpen(true);
    }
  }, [book]);

  // ================= SAVE PROGRESS =================
  useEffect(() => {
    if (!book || !isOpen) return;

    const progress = {
      bookId: book.id,
      chapter: currentChapter,
      page: currentPage,
      updatedAt: Date.now(),
    };

    let existing =
      JSON.parse(localStorage.getItem("reading-progress")) || [];

    existing = existing.filter((p) => p.bookId !== book.id);
    existing.unshift(progress);

    localStorage.setItem(
      "reading-progress",
      JSON.stringify(existing.slice(0, 5))
    );
  }, [currentChapter, currentPage, isOpen]);

  const chapter = book.chapters[currentChapter];
  const pages = [...chapter.pages];

  // ================= THEME =================
  const themes = {
    light: {
      bg: "bg-[#f5f5f4]",
      page: "bg-white text-gray-800",
      text: "text-gray-800",
      chapter: "bg-white text-gray-800",
    },
    sepia: {
      bg: "bg-[#f4ecd8]",
      page: "bg-[#f4ecd8] text-[#5b4636]",
      text: "text-[#5b4636]",
      chapter: "bg-[#f4ecd8] text-[#5b4636]",
    },
    dark: {
      bg: "bg-[#121212]",
      page: "bg-[#1e1e1e] text-gray-300",
      text: "text-gray-300",
      chapter: "bg-[#1e1e1e] text-gray-300",
    },
  };

  const currentTheme = themes[theme];

  // ================= PAGE BACKGROUND =================
  const getPageBackground = () => {
    if (theme === "dark") {
      return {
        left: "linear-gradient(to right, #1e1e1e 92%, #2a2a2a 100%)",
        right: "linear-gradient(to left, #1e1e1e 92%, #2a2a2a 100%)",
      };
    }

    if (theme === "sepia") {
      return {
        left: "linear-gradient(to right, #f4ecd8 92%, #e6dcc2 100%)",
        right: "linear-gradient(to left, #f4ecd8 92%, #e6dcc2 100%)",
      };
    }

    return {
      left: "linear-gradient(to right, #ffffff 92%, #f0f0f0 100%)",
      right: "linear-gradient(to left, #ffffff 92%, #f0f0f0 100%)",
    };
  };

  const pageBg = getPageBackground();

  // 🔥 ADDED: Theme-based page shadow
  const getPageShadow = (side) => {
    if (theme === "sepia") {
      return side === "left"
        ? `inset -18px 0 25px -10px rgba(120,90,40,0.35),
           inset -2px 0 3px rgba(120,90,40,0.2)`
        : `inset 18px 0 25px -10px rgba(120,90,40,0.35),
           inset 2px 0 3px rgba(120,90,40,0.2)`;
    }

    if (theme === "dark") {
      return side === "left"
        ? `inset -18px 0 25px -10px rgba(255,255,255,0.08),
           inset -2px 0 3px rgba(255,255,255,0.05)`
        : `inset 18px 0 25px -10px rgba(255,255,255,0.08),
           inset 2px 0 3px rgba(255,255,255,0.05)`;
    }

    return side === "left"
      ? `inset -18px 0 25px -10px rgba(0,0,0,0.35),
         inset -2px 0 3px rgba(0,0,0,0.15)`
      : `inset 18px 0 25px -10px rgba(0,0,0,0.35),
         inset 2px 0 3px rgba(0,0,0,0.15)`;
  };

  // ================= NAV =================
  const next = () => {
    if (isMobile) {
      if (currentPage < pages.length - 1) setCurrentPage((p) => p + 1);
      else goNextChapter();
    } else {
      if (currentPage < pages.length - 2) setCurrentPage((p) => p + 2);
      else goNextChapter();
    }
  };

  const prev = () => {
    if (isMobile) {
      if (currentPage > 0) setCurrentPage((p) => p - 1);
      else goPrevChapter();
    } else {
      if (currentPage > 0) setCurrentPage((p) => p - 2);
      else goPrevChapter();
    }
  };

  const goNextChapter = () => {
    if (currentChapter < book.chapters.length - 1) {
      setCurrentChapter((c) => c + 1);
      setCurrentPage(0);
      setIsOpen(false);
    }
  };

  const goPrevChapter = () => {
    if (currentChapter > 0) {
      const prevChapter = currentChapter - 1;
      const prevPages = book.chapters[prevChapter].pages.length;

      setCurrentChapter(prevChapter);
      setCurrentPage(
        isMobile
          ? prevPages - 1
          : prevPages % 2 === 0
          ? prevPages - 2
          : prevPages - 1
      );
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) next();
    if (diff < -50) prev();
  };

  const handleTap = (e) => {
    const x = e.clientX;
    const width = window.innerWidth;
    if (x < width / 2) prev();
    else next();
  };

  const progress =
    ((currentPage + (isMobile ? 1 : 2)) / pages.length) * 100;

  return (
    <div className={`flex h-screen ${currentTheme.bg} overflow-hidden`}>

      {/* THEME SWITCH */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        {["light", "sepia", "dark"].map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`px-3 py-1 text-xs rounded border ${
              theme === t
                ? "bg-gray-800 text-white"
                : "bg-white text-gray-600"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* SIDEBAR */}
      <div className="hidden lg:block w-64 bg-white border-r p-4 overflow-y-auto">
        <h2 className="font-semibold text-gray-700 mb-4">Chapters</h2>

        {book.chapters.map((ch, index) => (
          <div
            key={index}
            onClick={() => {
              setCurrentChapter(index);
              setIsOpen(false);
              setCurrentPage(0);
            }}
            className={`p-2 mb-2 rounded cursor-pointer text-sm ${
              index === currentChapter
                ? "bg-gray-200 font-medium"
                : "hover:bg-gray-100"
            }`}
          >
            {ch.title}
          </div>
        ))}
      </div>

      {/* READER */}
      <div className="flex-1 flex flex-col items-center justify-center px-2 sm:px-4 md:px-6 relative">

        {isOpen && (
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gray-300">
            <div
              className="h-full bg-gray-800 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <h2 className={`text-base sm:text-lg md:text-2xl font-serif mb-4 text-center ${currentTheme.text}`}>
          {book.title}
        </h2>

        <div className={`w-full max-w-6xl p-3 sm:p-5 md:p-6 rounded-2xl 
          ${theme === "dark"
            ? "bg-[#1a1a1a] border-gray-700"
            : theme === "sepia"
            ? "bg-[#f4ecd8] border-[#d6c7a3]"
            : "bg-gradient-to-br from-white via-gray-100 to-gray-200 border-gray-300"} 
          shadow-[0_20px_50px_rgba(0,0,0,0.25)] border`}>

          {!isOpen && (
            <div
              onClick={() => setIsOpen(true)}
              className={`flex items-center justify-center cursor-pointer shadow-xl
                        w-full h-[650px] rounded-lg ${currentTheme.chapter}`}
            >
              {chapter.title}
            </div>
          )}

          {isOpen && (
            <div
              onClick={handleTap}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className={`flex rounded-lg overflow-hidden w-full cursor-pointer
                ${isMobile ? "h-[70vh]" : "h-[650px]"} ${currentTheme.page}
                shadow-[0_20px_40px_rgba(0,0,0,0.25)]
              `}
            >
              {/* LEFT */}
              <div
                className="flex-1 p-6 relative"
                style={{
                  background: pageBg.left,
                  boxShadow: getPageShadow("left"), // 🔧 UPDATED
                }}
              >
                <p className="leading-relaxed font-serif">
                  {pages[currentPage]}
                </p>
              </div>

              {/* GUTTER */}
              {!isMobile && (
                <div
                  className="w-[6px]"
                  style={{
                    background:
                      theme === "sepia"
                        ? "linear-gradient(to right, rgba(120,90,40,0.15), rgba(120,90,40,0.35), rgba(120,90,40,0.15))"
                        : theme === "dark"
                        ? "linear-gradient(to right, rgba(255,255,255,0.1), rgba(255,255,255,0.2), rgba(255,255,255,0.1))"
                        : "linear-gradient(to right, rgba(0,0,0,0.1), rgba(0,0,0,0.3), rgba(0,0,0,0.1))",
                  }}
                />
              )}

              {/* RIGHT */}
              {!isMobile && (
                <div
                  className="flex-1 p-6 relative"
                  style={{
                    background: pageBg.right,
                    boxShadow: getPageShadow("right"), // 🔧 UPDATED
                  }}
                >
                  <p className="leading-relaxed font-serif">
                    {pages[currentPage + 1] || ""}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reader;