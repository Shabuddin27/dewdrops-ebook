import { useParams } from "react-router-dom";
import books from "../data/books.json";
import { useState, useEffect, useRef, useMemo, useLayoutEffect } from "react";
import { motion as framerMotion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const MotionDiv = framerMotion.div;
const EMPTY_PAGE = { text: "", start: 0, end: 0 };
const NAV_HEIGHT = 80;

const getSavedProgress = (bookId) => {
  if (!bookId) return null;
  try {
    const saved = JSON.parse(localStorage.getItem("reading-progress")) || [];
    if (!Array.isArray(saved)) return null;
    return saved.find((p) => p.bookId === bookId) || null;
  } catch {
    return null;
  }
};

const findWordBoundary = (text, start, target) => {
  if (target >= text.length) return text.length;
  let boundary = Math.min(target, text.length);
  while (boundary > start && !/\s/.test(text[boundary]) && !/\s/.test(text[boundary - 1])) boundary -= 1;
  return boundary > start ? boundary : Math.min(target, text.length);
};

const fitsMeasure = (measureEl, text) => {
  measureEl.innerText = text || " ";
  const scrollH = measureEl.scrollHeight;
  const clientH = measureEl.clientHeight;
  return scrollH <= clientH + 2;
};

const skipLeadingWhitespace = (text, index) => {
  let next = index;
  while (next < text.length && /\s/.test(text[next])) next += 1;
  return next;
};

const syncMeasureStyles = (measureEl, sourceEl) => {
  const styles = window.getComputedStyle(sourceEl);
  measureEl.style.display = "block";
  measureEl.style.boxSizing = styles.boxSizing;
  measureEl.style.fontFamily = styles.fontFamily;
  measureEl.style.fontSize = styles.fontSize;
  measureEl.style.fontStyle = styles.fontStyle;
  measureEl.style.fontWeight = styles.fontWeight;
  measureEl.style.letterSpacing = styles.letterSpacing;
  measureEl.style.lineHeight = styles.lineHeight;
  measureEl.style.wordSpacing = styles.wordSpacing;
  measureEl.style.padding = styles.padding;
  measureEl.style.whiteSpace = styles.whiteSpace;
  measureEl.style.wordBreak = styles.wordBreak;
  measureEl.style.textTransform = styles.textTransform;
};

const splitByCharacterCapacity = (text, charsPerPage) => {
  if (!text) return [EMPTY_PAGE];
  const pages = [];
  let start = 0;
  const safeCharsPerPage = Math.max(Math.floor(charsPerPage), 1);

  while (start < text.length) {
    start = skipLeadingWhitespace(text, start);
    if (start >= text.length) break;
    let end = findWordBoundary(text, start, start + safeCharsPerPage);
    if (end <= start) end = Math.min(start + safeCharsPerPage, text.length);
    pages.push({ text: text.slice(start, end), start, end });
    start = end;
  }

  return pages;
};

const splitIntoFallbackPages = (text, mobile) => {
  return splitByCharacterCapacity(text, mobile ? 280 : 900);
};

const paginateByMeasure = (text, measureEl) => {
  if (!text || !measureEl?.clientWidth || !measureEl?.clientHeight) return [EMPTY_PAGE];

  const pages = [];
  let start = 0;

  while (start < text.length) {
    start = skipLeadingWhitespace(text, start);
    if (start >= text.length) break;

    let low = start + 1;
    let high = text.length;
    let best = start;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      let end = findWordBoundary(text, start, mid);
      if (end <= start) {
        end = Math.min(mid, text.length);
      }
      const slice = text.slice(start, end);

      if (fitsMeasure(measureEl, slice)) {
        best = end;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const end = best > start ? best : Math.min(start + 1, text.length);
    pages.push({ text: text.slice(start, end), start, end });
    start = end;
  }

  return pages.length ? pages : [EMPTY_PAGE];
};

function ReaderContent({ id }) {
  const parsedBookId = parseInt(id);
  const book = books.find((b) => b.id === parsedBookId);

  const [showExtra, setShowExtra] = useState("cover");

  const [currentChapter, setCurrentChapter] = useState(() => {
    const progress = getSavedProgress(parsedBookId);
    const chapter = progress ? progress.chapter : 0;
    const maxChapter = (book?.chapters.length || 1) - 1;
    return Math.min(Math.max(chapter, 0), maxChapter);
  });

  const [currentPosition, setCurrentPosition] = useState(() => {
    const progress = getSavedProgress(parsedBookId);
    const progressChapter = progress ? Math.min(Math.max(progress.chapter || 0, 0), (book?.chapters.length || 1) - 1) : 0;
    const contentLength = book?.chapters?.[progressChapter]?.content?.length || 0;
    return progress ? Math.min(Math.max(progress.position || 0, 0), contentLength) : 0;
  });

  const [isOpen, setIsOpen] = useState(() => {
    const progress = getSavedProgress(parsedBookId);
    return !!progress;
  });

  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [readerFrame, setReaderFrame] = useState({
    top: NAV_HEIGHT,
    height: typeof window === "undefined" ? 640 : Math.max(window.innerHeight - NAV_HEIGHT, 240),
    width: typeof window === "undefined" ? 390 : window.innerWidth,
  });
  const [pages, setPages] = useState(() => splitIntoFallbackPages(book?.chapters?.[currentChapter]?.content || "", false));

  const touchStartX = useRef(0);
  const measureRef = useRef(null);
  const pageBodyRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      const viewport = window.visualViewport;
      const viewportHeight = viewport?.height || window.innerHeight;
      const viewportWidth = viewport?.width || window.innerWidth;
      const viewportTop = viewport?.offsetTop || 0;
      setReaderFrame({
        top: viewportTop + NAV_HEIGHT,
        height: Math.max(viewportHeight - NAV_HEIGHT, 240),
        width: viewportWidth,
      });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  const chapter = book?.chapters[currentChapter] || book?.chapters[0] || { title: "", content: "" };
  const displayPage = useMemo(() => {
    const foundIndex = pages.findIndex((page) => currentPosition >= page.start && currentPosition < page.end);
    let nextPage = foundIndex === -1 ? Math.max(pages.length - 1, 0) : foundIndex;
    if (!isMobile && nextPage % 2 !== 0) nextPage -= 1;
    return Math.max(nextPage, 0);
  }, [currentPosition, pages, isMobile]);

  useEffect(() => {
    if (!book || !isOpen) return;
    const progress = {
      bookId: book.id,
      chapter: currentChapter,
      page: displayPage,
      position: currentPosition,
      updatedAt: Date.now(),
    };
    let existing = [];
    try {
      existing = JSON.parse(localStorage.getItem("reading-progress")) || [];
    } catch {
      existing = [];
    }
    if (!Array.isArray(existing)) existing = [];
    existing = existing.filter((p) => p.bookId !== book.id);
    existing.unshift(progress);
    localStorage.setItem("reading-progress", JSON.stringify(existing.slice(0, 5)));
  }, [book, currentChapter, currentPosition, displayPage, isOpen]);

  useLayoutEffect(() => {
    if (!isOpen || !pageBodyRef.current) return;
    const pageBodyEl = pageBodyRef.current;
    const measureEl = measureRef.current;
    if (!measureEl) return;
    let frameId = 0;

    const updatePages = () => {
      frameId = window.requestAnimationFrame(() => {
        const pageWidth = pageBodyEl.clientWidth;
        const pageHeight = pageBodyEl.clientHeight;

        if (pageWidth <= 0 || pageHeight <= 0) {
          setPages(splitIntoFallbackPages(chapter.content || "", isMobile));
          return;
        }

        syncMeasureStyles(measureEl, pageBodyEl);
        measureEl.style.width = `${pageWidth}px`;
        measureEl.style.height = `${pageHeight}px`;
        measureEl.style.overflow = "hidden";

        const content = chapter.content || "";
        const measuredPages = paginateByMeasure(content, measureEl);
        setPages(measuredPages.length > 0 ? measuredPages : splitIntoFallbackPages(content, isMobile));
      });
    };

    updatePages();

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        window.requestAnimationFrame(updatePages);
      });
    }

    const observer = new ResizeObserver(() => {
      if (frameId) window.cancelAnimationFrame(frameId);
      updatePages();
    });
    observer.observe(pageBodyEl);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [chapter.content, isOpen, isMobile]);

  if (!book) return <div>Book not found</div>;

  // FIX: Reset progress when going back to cover
  const handleGoToCover = () => {
    setShowExtra("cover");
    setIsOpen(false);
    setCurrentChapter(0);
    setCurrentPosition(0);
    setShowSidebar(false);
  };

  const next = () => {
    if (showExtra === "cover") { setShowExtra(null); setIsOpen(false); return; }
    if (!isOpen) { setIsOpen(true); return; }
    if (isMobile) {
      if (displayPage < pages.length - 1) setCurrentPosition(pages[displayPage + 1].start);
      else goNextChapter();
    } else {
      if (displayPage < pages.length - 2) setCurrentPosition(pages[displayPage + 2].start);
      else goNextChapter();
    }
  };

  const prev = () => {
    if (!showExtra && !isOpen && currentChapter === 0) { handleGoToCover(); return; }
    if (!isOpen) { goPrevChapter(); return; }
    if (displayPage === 0 && currentChapter === 0) {
      handleGoToCover();
      return;
    }
    if (displayPage === 0) { goPrevChapter(); return; }
    if (isMobile) setCurrentPosition(pages[displayPage - 1].start);
    else setCurrentPosition(pages[displayPage - 2].start);
  };

  const goNextChapter = () => {
    if (currentChapter < book.chapters.length - 1) {
      setCurrentChapter((c) => c + 1);
      setCurrentPosition(0);
      setPages([EMPTY_PAGE]);
      setIsOpen(false);
    }
  };

  const goPrevChapter = () => {
    if (currentChapter > 0) {
      const prevChapter = currentChapter - 1;
      const prevContent = book.chapters[prevChapter]?.content || "";
      const fallbackPages = splitIntoFallbackPages(prevContent, isMobile);
      const lastPageStart = fallbackPages[fallbackPages.length - 1]?.start || 0;
      setCurrentChapter(prevChapter);
      setCurrentPosition(lastPageStart);
      setPages(fallbackPages);
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
    <div
      className="fixed left-0 right-0 flex bg-[#f5f5f4] overflow-hidden min-h-0"
      style={{
        top: readerFrame.top,
        height: `${readerFrame.height}px`,
        perspective: "2000px",
        WebkitTextSizeAdjust: "100%",
        textSizeAdjust: "100%",
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* TABLE OF CONTENTS DRAWER */}
      {showSidebar && (
        <div className="fixed inset-0 z-[1000] flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSidebar(false)} />
          <MotionDiv initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} className="relative w-[min(18rem,85vw)] bg-white p-6 h-full overflow-y-auto shadow-2xl">
            <button
              type="button"
              onClick={() => setShowSidebar(false)}
              className="absolute right-4 top-4 rounded-full border border-gray-200 bg-white p-2 text-gray-600 shadow-sm transition hover:bg-gray-100"
              aria-label="Close table of contents"
            >
              <X size={18} />
            </button>
            <h2 className="font-semibold text-gray-400 uppercase tracking-widest text-[10px] mb-6 pr-10">Table of Contents</h2>
            <div onClick={handleGoToCover} className={`p-3 mb-1 rounded-lg cursor-pointer text-sm transition-all ${showExtra === "cover" ? "bg-gray-800 text-white shadow-md font-medium" : "text-gray-600 hover:bg-gray-100"}`}>Cover</div>
            <div className="border-t border-gray-100 my-4"></div>
            {book.chapters.map((ch, index) => (
              <div
                key={index}
                onClick={() => {
                  setShowExtra(null);
                  setCurrentChapter(index);
                  setCurrentPosition(0);
                  setPages(splitIntoFallbackPages(ch.content || "", isMobile));
                  setIsOpen(false);
                  setShowSidebar(false);
                }}
                className={`p-3 mb-1 rounded-lg cursor-pointer text-sm transition-all ${!showExtra && index === currentChapter ? "bg-gray-800 text-white shadow-md font-medium" : "text-gray-600 hover:bg-gray-100"}`}
              >
                {ch.title}
              </div>
            ))}
          </MotionDiv>
        </div>
      )}

      {/* MAIN READER AREA */}
      <div className="flex-1 flex flex-col items-center justify-center gap-1 sm:gap-2 px-2 sm:px-6 relative h-full min-h-0 overflow-hidden py-1.5 sm:py-4">
        <button
          type="button"
          onClick={() => setShowSidebar(true)}
          className="absolute top-0 left-3 z-50 bg-white/90 backdrop-blur p-2 rounded-full shadow-lg border border-gray-200 text-gray-700 transition hover:bg-white"
          aria-label="Open table of contents"
        >
          <Menu size={20} />
        </button>

        <h2 className="text-[9px] sm:text-xs uppercase tracking-[0.14em] sm:tracking-[0.2em] font-medium text-gray-400 max-w-[72%] text-center leading-4 shrink-0">{book.title}</h2>

        <div
          className="w-full max-w-6xl relative flex justify-center flex-1 min-h-0 overflow-hidden"
        >
          <AnimatePresence mode="wait">
            
            {showExtra === "cover" && (
              <MotionDiv 
                key="cover-scr" 
                initial={{ rotateY: 0 }} 
                animate={{ rotateY: 0 }} 
                exit={{ rotateY: -95, opacity: 0 }} 
                transition={{ duration: 0.8, ease: "easeInOut" }}
                onClick={next} 
                className={`cursor-pointer shadow-2xl rounded-lg overflow-hidden bg-white z-50 transform-gpu h-full ${isMobile ? "w-full" : "w-1/2"}`}
                style={{ transformOrigin: "left center" }}
              >
                <img src={book.cover} className="w-full h-full object-cover" alt="Cover" />
              </MotionDiv>
            )}

            {!showExtra && !isOpen && (
              <MotionDiv
                key="chapter-intro"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                onClick={handleTap}
                className={`cursor-pointer shadow-2xl relative overflow-hidden rounded-lg transform-gpu h-full ${isMobile ? "w-full" : "w-1/2"}`}
              >
                {chapter.introImage && (
                  <img src={chapter.introImage} alt="Art" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent p-8 flex flex-col items-center">
                  <h1 className="text-white text-2xl md:text-3xl font-serif text-center uppercase tracking-widest drop-shadow-lg">{chapter.title}</h1>
                </div>
              </MotionDiv>
            )}

            {!showExtra && isOpen && (
              <div className="min-h-0 p-1 sm:p-2.5 md:p-3 rounded-lg bg-white/50 border border-white shadow-2xl w-full h-full">
                <div
                  ref={measureRef}
                  aria-hidden="true"
                  className="fixed -left-[9999px] top-0 overflow-hidden pointer-events-none"
                />
                <MotionDiv
                  key={`${currentChapter}-${displayPage}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  onClick={handleTap}
                  className="flex rounded-lg overflow-hidden w-full h-full min-h-0 cursor-pointer bg-white text-gray-800 shadow-xl"
                >
                  <div className="flex-1 px-3 pt-2 pb-4 sm:px-6 sm:pt-4 sm:pb-6 md:px-8 md:pt-5 md:pb-8 relative border-r border-gray-50 bg-[#fafafa] overflow-hidden flex flex-col min-h-0">
                    <p ref={pageBodyRef} className="leading-5 sm:leading-6 md:leading-7 font-serif text-[12px] sm:text-sm md:text-base text-gray-700 whitespace-pre-wrap text-justify break-words flex-1 min-h-0 overflow-hidden">{pages[displayPage]?.text || ""}</p>
                    <div className="text-center text-[9px] sm:text-[10px] font-mono text-gray-400 pt-2 sm:pt-3 shrink-0">PAGE {displayPage + 1}</div>
                  </div>
                  {!isMobile && (
                    <div className="flex-1 px-3 pt-2 pb-4 sm:px-6 sm:pt-4 sm:pb-6 md:px-8 md:pt-5 md:pb-8 relative bg-white overflow-hidden flex flex-col min-h-0">
                      <p className="leading-5 sm:leading-6 md:leading-7 font-serif text-[12px] sm:text-sm md:text-base text-gray-700 whitespace-pre-wrap text-justify break-words flex-1 min-h-0 overflow-hidden">{pages[displayPage + 1]?.text || ""}</p>
                      <div className="text-center text-[9px] sm:text-[10px] font-mono text-gray-400 pt-2 sm:pt-3 shrink-0">PAGE {displayPage + 2}</div>
                    </div>
                  )}
                </MotionDiv>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Reader() {
  const { id } = useParams();
  return <ReaderContent key={id} id={id} />;
}

export default Reader;
