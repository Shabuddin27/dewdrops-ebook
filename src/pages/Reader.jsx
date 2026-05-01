import { useParams } from "react-router-dom";
import books from "../data/books.json";
import { useState, useEffect, useRef, useMemo, useLayoutEffect } from "react";
import { motion as framerMotion, AnimatePresence } from "framer-motion";
import { Menu, X, BookOpen, Home, ChevronRight } from "lucide-react";

const MotionDiv = framerMotion.div;
const EMPTY_PAGE = { text: "", start: 0, end: 0 };
const NAV_HEIGHT = 72;

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
  return splitByCharacterCapacity(text, mobile ? 240 : 800);
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
  const [showSidebar, setShowSidebar] = useState(true);

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
  const [readerFrame, setReaderFrame] = useState({
    top: NAV_HEIGHT,
    height: typeof window === "undefined" ? 640 : Math.max(window.innerHeight - NAV_HEIGHT, 240),
    width: typeof window === "undefined" ? 390 : window.innerWidth,
  });
  const [pages, setPages] = useState(() => splitIntoFallbackPages(book?.chapters?.[currentChapter]?.content || "", false));

  const touchStartX = useRef(0);
  const measureRef = useRef(null);
  const pageBodyRef = useRef(null);
  const leftPageRef = useRef(null);
  const rightPageRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      setReaderFrame({
        top: NAV_HEIGHT,
        height: viewportHeight - NAV_HEIGHT,
        width: viewportWidth,
      });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
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

  if (!book) return <div className="pt-24 text-center">Book not found</div>;

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
    if (!isOpen) { 
      if (currentChapter > 0) goPrevChapter();
      else handleGoToCover();
      return; 
    }
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

  // IMPROVED RESPONSIVE FONT SIZE - Scales smoothly across all screen sizes
  const getResponsiveFontSize = () => {
    if (typeof window === "undefined") return "16px";
    const width = window.innerWidth;
    
    // Linear interpolation between breakpoints for smooth scaling
    if (width < 480) {
      // 320px -> 12px, 480px -> 14px
      return `${12 + (width - 320) * (2 / 160)}px`;
    }
    if (width < 768) {
      // 480px -> 14px, 768px -> 16px
      return `${14 + (width - 480) * (2 / 288)}px`;
    }
    if (width < 1024) {
      // 768px -> 16px, 1024px -> 18px
      return `${16 + (width - 768) * (2 / 256)}px`;
    }
    if (width < 1280) {
      // 1024px -> 18px, 1280px -> 20px
      return `${18 + (width - 1024) * (2 / 256)}px`;
    }
    if (width < 1536) {
      // 1280px -> 20px, 1536px -> 22px
      return `${20 + (width - 1280) * (2 / 256)}px`;
    }
    if (width < 1920) {
      // 1536px -> 22px, 1920px -> 24px
      return `${22 + (width - 1536) * (2 / 384)}px`;
    }
    // 1920px+ -> 24px to 28px for very large screens
    return `${24 + Math.min(4, (width - 1920) / 480)}px`;
  };

  // IMPROVED RESPONSIVE LINE HEIGHT - Scales with font size
  const getResponsiveLineHeight = () => {
    if (typeof window === "undefined") return "1.65";
    const width = window.innerWidth;
    
    // Line height increases slightly on larger screens for better readability
    if (width < 480) return "1.5";
    if (width < 768) return "1.55";
    if (width < 1024) return "1.6";
    if (width < 1280) return "1.65";
    if (width < 1536) return "1.7";
    return "1.75";
  };

  const [fontSize, setFontSize] = useState(getResponsiveFontSize());
  const [lineHeight, setLineHeight] = useState(getResponsiveLineHeight());

  useEffect(() => {
    const handleResize = () => {
      setFontSize(getResponsiveFontSize());
      setLineHeight(getResponsiveLineHeight());
    };
    
    // Use debounce for better performance
    let timeoutId;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };
    
    window.addEventListener("resize", debouncedResize);
    handleResize(); // Call immediately
    
    return () => {
      window.removeEventListener("resize", debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div
      className="fixed left-0 right-0 flex bg-[#f8f9fa] overflow-hidden select-none"
      style={{
        top: readerFrame.top,
        height: `${readerFrame.height}px`,
        width: `${readerFrame.width}px`,
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* IMPROVED TABLE OF CONTENTS DRAWER - NO BLUE EFFECT */}
      <AnimatePresence>
        {showSidebar && (
          <div className="fixed inset-0 z-[1000] flex">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowSidebar(false)} />
            <MotionDiv 
              initial={{ x: "-100%" }} 
              animate={{ x: 0 }} 
              exit={{ x: "-100%" }} 
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-[260px] sm:w-[280px] bg-white h-full overflow-y-auto shadow-2xl"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
                <div className="flex items-center justify-between p-3 sm:p-4">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <BookOpen size={16} className="text-gray-600 sm:size-[18px]" />
                    <h2 className="text-xs font-semibold text-gray-700 sm:text-sm">Contents</h2>
                  </div>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="p-1 text-gray-500 transition rounded-lg hover:bg-gray-100 sm:p-1.5"
                  >
                    <X size={16} className="sm:size-[18px]" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-1.5 sm:p-2">
                {/* Cover Option */}
                <div
                  onClick={handleGoToCover}
                  className={`flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 mb-1 rounded-lg cursor-pointer transition-all ${
                    showExtra === "cover" 
                      ? "bg-gray-100 text-gray-900" 
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Home size={14} className="sm:size-[16px]" />
                  <span className="text-xs font-medium sm:text-sm">Cover</span>
                  {showExtra === "cover" && <ChevronRight size={12} className="ml-auto sm:size-[14px]" />}
                </div>

                {/* Divider */}
                <div className="my-1.5 border-t border-gray-100 sm:my-2" />

                {/* Chapters */}
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
                    className={`flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 mb-1 rounded-lg cursor-pointer transition-all ${
                      !showExtra && index === currentChapter 
                        ? "bg-gray-100 text-gray-900" 
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="w-4 text-[10px] font-medium text-gray-400 sm:w-5 sm:text-xs">{index + 1}</span>
                    <span className="flex-1 text-[11px] truncate sm:text-sm">{ch.title}</span>
                    {!showExtra && index === currentChapter && <ChevronRight size={12} className="text-gray-400 sm:size-[14px]" />}
                  </div>
                ))}
              </div>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>

      {/* MAIN READER AREA */}
      <div className="relative flex flex-col items-center justify-center flex-1 h-full min-h-0 gap-1.5 px-1.5 py-1.5 overflow-hidden sm:gap-2 sm:px-2 sm:py-2 md:px-3 md:py-3">
        {/* Menu Button */}
        <button
          onClick={() => setShowSidebar(true)}
          className="absolute z-50 p-1.5 text-gray-600 transition bg-white border border-gray-200 rounded-lg shadow-md top-2 left-2 hover:bg-gray-50 active:scale-95 sm:p-2 sm:top-3 sm:left-3"
        >
          <Menu size={14} className="sm:size-[16px] md:size-[18px]" />
        </button>

        {/* Title */}
        <h2 className="text-[9px] sm:text-[10px] md:text-xs uppercase tracking-wide font-medium text-gray-400 text-center px-6 pt-4 sm:px-8 sm:pt-5 md:pt-6">
          {showExtra === "cover" ? book.title : chapter.title}
        </h2>

        {/* Main Content - IMAGES FIT PROPERLY */}
        <div className="relative flex justify-center flex-1 w-full min-h-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {showExtra === "cover" && (
              <MotionDiv 
                key="cover" 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }} 
                transition={{ duration: 0.4 }}
                onClick={next} 
                className="flex items-center justify-center h-full overflow-hidden bg-white rounded-lg shadow-2xl cursor-pointer"
                style={{ maxWidth: isMobile ? "85%" : "50%", maxHeight: "100%" }}
              >
                <img 
                  src={book.cover} 
                  className="object-contain w-auto h-full max-w-full" 
                  alt="Cover" 
                />
              </MotionDiv>
            )}

            {!showExtra && !isOpen && (
              <MotionDiv
                key="chapter-intro"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4 }}
                onClick={handleTap}
                className="relative flex items-center justify-center h-full overflow-hidden rounded-lg shadow-2xl cursor-pointer"
                style={{ maxWidth: isMobile ? "90%" : "55%", maxHeight: "100%" }}
              >
                {chapter.introImage ? (
                  <img 
                    src={chapter.introImage} 
                    alt="Art" 
                    className="object-cover w-full h-full" 
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full p-4 sm:p-6 bg-gradient-to-br from-gray-700 to-gray-900">
                    <h1 className="font-serif text-base tracking-wider text-center text-white sm:text-lg md:text-xl lg:text-2xl">
                      {chapter.title}
                    </h1>
                  </div>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-end p-3 pointer-events-none bg-gradient-to-t from-black/50 via-transparent to-transparent sm:p-4">
                  <p className="text-[8px] text-white/80 sm:text-[10px] md:text-xs">Tap to begin →</p>
                </div>
              </MotionDiv>
            )}

            {!showExtra && isOpen && (
              <div className="min-h-0 p-1 rounded-lg bg-white/80 shadow-2xl w-full h-full sm:p-1.5 md:p-2">
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
                  transition={{ duration: 0.3 }}
                  onClick={handleTap}
                  className="flex w-full h-full min-h-0 overflow-hidden text-gray-800 bg-white rounded-lg shadow-xl cursor-pointer"
                >
                  {/* Left Page */}
                  <div className="flex-1 relative border-r border-gray-100 bg-[#fafaf8] overflow-hidden flex flex-col min-h-0">
                    <div className="flex-1 min-h-0 px-2 pt-2 pb-1 overflow-y-auto sm:px-3 sm:pt-3 sm:pb-2 md:px-4 md:pt-4 md:pb-3 lg:px-5">
                      <p 
                        ref={pageBodyRef}
                        className="font-serif text-justify text-gray-700 break-words whitespace-pre-wrap"
                        style={{ 
                          fontSize: fontSize,
                          lineHeight: lineHeight,
                          userSelect: "none", 
                          WebkitUserSelect: "none" 
                        }}
                      >
                        {pages[displayPage]?.text || ""}
                      </p>
                    </div>
                    <div className="text-center font-mono text-gray-400 py-1 shrink-0 text-[8px] sm:text-[9px] md:text-[10px]">
                      {displayPage + 1} / {pages.length}
                    </div>
                  </div>
                  
                  {/* Right Page */}
                  {!isMobile && (
                    <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden bg-white">
                      <div className="flex-1 min-h-0 px-2 pt-2 pb-1 overflow-y-auto sm:px-3 sm:pt-3 sm:pb-2 md:px-4 md:pt-4 md:pb-3 lg:px-5">
                        <p 
                          className="font-serif text-justify text-gray-700 break-words whitespace-pre-wrap"
                          style={{ 
                            fontSize: fontSize,
                            lineHeight: lineHeight,
                            userSelect: "none", 
                            WebkitUserSelect: "none" 
                          }}
                        >
                          {pages[displayPage + 1]?.text || ""}
                        </p>
                      </div>
                      <div className="text-center font-mono text-gray-400 py-1 shrink-0 text-[8px] sm:text-[9px] md:text-[10px]">
                        {displayPage + 2} / {pages.length}
                      </div>
                    </div>
                  )}
                </MotionDiv>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Hint */}
        <div className="flex gap-3 text-[8px] text-gray-400 shrink-0 pb-0.5 sm:gap-4 sm:text-[9px] md:text-[10px]">
          <span>← Tap left</span>
          <span>Tap right →</span>
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
