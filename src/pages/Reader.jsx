import { useParams } from "react-router-dom";
import books from "../data/books.json";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const getSavedProgress = (bookId) => {
  if (!bookId) return null;
  try {
    const saved = JSON.parse(localStorage.getItem("reading-progress")) || [];
    return saved.find((p) => p.bookId === bookId) || null;
  } catch { return null; }
};

function Reader() {
  const { id } = useParams();
  const parsedBookId = parseInt(id);
  const book = books.find((b) => b.id === parsedBookId);

  const [currentChapter, setCurrentChapter] = useState(() => {
    const progress = getSavedProgress(parsedBookId);
    return progress ? progress.chapter : 0;
  });

  const [currentPage, setCurrentPage] = useState(() => {
    const progress = getSavedProgress(parsedBookId);
    return progress ? progress.page : 0;
  });

  const [isOpen, setIsOpen] = useState(() => {
    const progress = getSavedProgress(parsedBookId);
    return !!progress;
  });

  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const [activeBookId, setActiveBookId] = useState(parsedBookId);
  if (parsedBookId !== activeBookId) {
    setActiveBookId(parsedBookId);
    const progress = getSavedProgress(parsedBookId);
    setCurrentChapter(progress ? progress.chapter : 0);
    setCurrentPage(progress ? progress.page : 0);
    setIsOpen(!!progress);
  }

  const touchStartX = useRef(0);

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

  useEffect(() => {
    if (!book || !isOpen) return;
    const progress = {
      bookId: book.id,
      chapter: currentChapter,
      page: currentPage,
      updatedAt: Date.now(),
    };
    let existing = JSON.parse(localStorage.getItem("reading-progress")) || [];
    existing = existing.filter((p) => p.bookId !== book.id);
    existing.unshift(progress);
    localStorage.setItem("reading-progress", JSON.stringify(existing.slice(0, 5)));
  }, [book, currentChapter, currentPage, isOpen]);

  if (!book) return <div>Book not found</div>;

  const chapter = book.chapters[currentChapter];
  const pages = [...chapter.pages];

  const next = () => {
    if (!isOpen) { setIsOpen(true); return; }
    if (isMobile) {
      if (currentPage < pages.length - 1) setCurrentPage((p) => p + 1);
      else goNextChapter();
    } else {
      if (currentPage < pages.length - 2) setCurrentPage((p) => p + 2);
      else goNextChapter();
    }
  };

  const prev = () => {
    if (!isOpen) { goPrevChapter(); return; }
    if (currentPage === 0) { setIsOpen(false); return; }
    if (isMobile) setCurrentPage((p) => p - 1);
    else setCurrentPage((p) => p - 2);
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
      if (prevPages === 0) setCurrentPage(0);
      else {
        setCurrentPage(isMobile ? prevPages - 1 : prevPages % 2 === 0 ? prevPages - 2 : prevPages - 1);
      }
      setIsOpen(true);
    }
  };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) next();
    if (diff < -50) prev();
  };

  const handleTap = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) prev();
    else next();
  };

  return (
    <div className="flex bg-[#f5f5f4]" style={{ height: "calc(100vh - 70px)", perspective: "2000px" }}>
      {/* SIDEBAR */}
      <div className="hidden lg:block w-64 bg-white border-r border-t border-gray-100 p-6 overflow-y-auto">
        <h2 className="font-semibold text-gray-400 uppercase tracking-widest text-[10px] mb-6">Table of Contents</h2>
        {book.chapters.map((ch, index) => (
          <div
            key={index}
            onClick={() => {
              setCurrentChapter(index);
              setIsOpen(false);
              setCurrentPage(0);
            }}
            className={`p-3 mb-1 rounded-lg cursor-pointer text-sm transition-all ${
              index === currentChapter
                ? "bg-gray-800 text-white shadow-md font-medium"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {ch.title}
          </div>
        ))}
      </div>

      {/* MOBILE DRAWER */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSidebar(false)} />
          <div className="relative w-72 bg-white p-6 overflow-y-auto shadow-2xl animate-slideIn">
            <h2 className="font-semibold text-gray-400 uppercase tracking-widest text-[10px] mb-6">Chapters</h2>
            {book.chapters.map((ch, index) => (
              <div
                key={index}
                onClick={() => {
                  setCurrentChapter(index);
                  setCurrentPage(0);
                  setIsOpen(false);
                  setShowSidebar(false);
                }}
                className={`p-3 mb-1 rounded-lg cursor-pointer text-sm ${
                  index === currentChapter ? "bg-gray-800 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {ch.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MAIN READER AREA */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 relative h-full overflow-hidden py-8">
        <button
          onClick={() => setShowSidebar(true)}
          className="lg:hidden absolute top-6 left-6 z-50 bg-white/90 backdrop-blur p-2 rounded-full shadow-lg border border-gray-200"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>

        <h2 className="text-sm uppercase tracking-[0.2em] font-medium mb-6 text-gray-400">{book.title}</h2>

        <div className="w-full max-w-5xl p-2 sm:p-4 md:p-6 rounded-2xl bg-white/50 border border-white shadow-2xl relative">
          <AnimatePresence mode="wait">
            {!isOpen && (
              <motion.div
                key="cover"
                initial={{ rotateY: -10, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: -90, opacity: 0 }}
                transition={{ duration: 0.6 }}
                onClick={handleTap}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className={`flex items-center justify-center cursor-pointer shadow-2xl select-none w-full ${isMobile ? "h-[65vh]" : "h-[600px]"} rounded-lg bg-white text-gray-800 border border-gray-100`}
                style={{ transformOrigin: "left" }}
              >
                <h1 className="text-3xl md:text-4xl font-serif px-12 text-center leading-tight">{chapter.title}</h1>
              </motion.div>
            )}

            {isOpen && (
              <motion.div
                key={`${currentChapter}-${currentPage}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                onClick={handleTap}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className={`flex rounded-lg overflow-hidden w-full cursor-pointer select-none ${isMobile ? "h-[65vh]" : "h-[600px]"} bg-white text-gray-800 shadow-2xl`}
              >
                <div className="flex-1 p-8 sm:p-12 relative border-r border-gray-50 bg-[#fafafa]">
                  <p className="leading-relaxed font-serif text-lg text-gray-700">{pages[currentPage]}</p>
                  <div className="absolute bottom-6 left-0 w-full text-center text-[10px] font-mono text-gray-400">PAGE {currentPage + 1}</div>
                </div>

                {!isMobile && (
                  <div className="flex-1 p-8 sm:p-12 relative bg-white">
                    <p className="leading-relaxed font-serif text-lg text-gray-700">{pages[currentPage + 1] || ""}</p>
                    <div className="absolute bottom-6 left-0 w-full text-center text-[10px] font-mono text-gray-400">PAGE {currentPage + 2}</div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default Reader;