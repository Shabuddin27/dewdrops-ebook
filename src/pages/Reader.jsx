import { useParams, useNavigate, useLocation } from "react-router-dom";
import books from "../data/books.json";
import { useState, useEffect, useRef, useMemo, useLayoutEffect, useCallback } from "react";
import { motion as framerMotion, AnimatePresence } from "framer-motion";
import { Menu, X, BookOpen, Home, ChevronRight, Settings, Sun, Moon, Plus, Minus, Maximize2, Minimize2, RotateCcw, Type, AlignLeft, Palette, ArrowLeft } from "lucide-react";

const MotionDiv = framerMotion.div;
const EMPTY_PAGE = { text: "", start: 0, end: 0 };

const getSavedProgress = (bookId) => {
  if (!bookId) return null;
  try {
    const saved = JSON.parse(localStorage.getItem("reading-progress")) || [];
    if (!Array.isArray(saved)) return null;
    const progress = saved.find((p) => p.bookId === bookId);
    if (progress) {
      return {
        bookId: progress.bookId,
        chapter: progress.chapter || 0,
        position: progress.position || 0,
        pageIndex: progress.pageIndex !== undefined ? progress.pageIndex : (progress.page || 0),
        updatedAt: progress.updatedAt || Date.now()
      };
    }
    return null;
  } catch {
    return null;
  }
};

const saveProgress = (bookId, chapter, position, pageIndex) => {
  if (!bookId) return;
  try {
    const progress = {
      bookId,
      chapter,
      position,
      pageIndex,
      updatedAt: Date.now(),
    };
    let existing = JSON.parse(localStorage.getItem("reading-progress")) || [];
    if (!Array.isArray(existing)) existing = [];
    existing = existing.filter((p) => p.bookId !== bookId);
    existing.unshift(progress);
    localStorage.setItem("reading-progress", JSON.stringify(existing.slice(0, 10)));
  } catch (error) {
    console.error("Error saving progress:", error);
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

function ReaderContent({ id, shouldResume }) {
  const navigate = useNavigate();
  const parsedBookId = parseInt(id);
  const book = books.find((b) => b.id === parsedBookId);
  const savedProgress = useMemo(
    () => (shouldResume ? getSavedProgress(parsedBookId) : null),
    [parsedBookId, shouldResume]
  );

  const [showExtra, setShowExtra] = useState(() => (savedProgress ? null : "cover"));
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [currentChapter, setCurrentChapter] = useState(() => {
    const chapter = savedProgress ? savedProgress.chapter : 0;
    const maxChapter = (book?.chapters.length || 1) - 1;
    return Math.min(Math.max(chapter, 0), maxChapter);
  });

  const [currentPosition, setCurrentPosition] = useState(() => {
    const progressChapter = savedProgress ? Math.min(Math.max(savedProgress.chapter || 0, 0), (book?.chapters.length || 1) - 1) : 0;
    const contentLength = book?.chapters?.[progressChapter]?.content?.length || 0;
    
    if (savedProgress && savedProgress.position !== undefined) {
      return Math.min(Math.max(savedProgress.position, 0), contentLength);
    }
    
    return 0;
  });

  const [isOpen, setIsOpen] = useState(() => {
    return !!savedProgress && savedProgress.pageIndex !== undefined;
  });

  const [isMobile, setIsMobile] = useState(false);
  const [pages, setPages] = useState(() => splitIntoFallbackPages(book?.chapters?.[currentChapter]?.content || "", false));

  // Settings state
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem(`font-size-${parsedBookId}`);
    return saved ? parseInt(saved) : 16;
  });
  const [lineHeight, setLineHeight] = useState(() => {
    const saved = localStorage.getItem(`line-height-${parsedBookId}`);
    return saved ? parseFloat(saved) : 1.65;
  });
  const [fontFamily, setFontFamily] = useState(() => {
    const saved = localStorage.getItem(`font-family-${parsedBookId}`);
    return saved || "serif";
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("reader-dark-mode");
    return saved === "true";
  });

  const touchStartX = useRef(0);
  const measureRef = useRef(null);
  const pageBodyRef = useRef(null);
  const isPaginatingRef = useRef(false);
  const initialRestoreDone = useRef(false);

  // Apply dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("reader-dark-mode", isDarkMode);
  }, [isDarkMode]);

  // Save settings
  useEffect(() => {
    localStorage.setItem(`font-size-${parsedBookId}`, fontSize);
    localStorage.setItem(`line-height-${parsedBookId}`, lineHeight);
    localStorage.setItem(`font-family-${parsedBookId}`, fontFamily);
  }, [fontSize, lineHeight, fontFamily, parsedBookId]);

  // Get the current page index based on position
  const currentPageIndex = useMemo(() => {
    const foundIndex = pages.findIndex((page) => currentPosition >= page.start && currentPosition < page.end);
    if (foundIndex === -1 && pages.length > 0) {
      if (currentPosition >= (pages[pages.length - 1]?.end || 0)) {
        return pages.length - 1;
      }
      return 0;
    }
    return foundIndex === -1 ? 0 : foundIndex;
  }, [currentPosition, pages]);
  
  // Calculate which pages to show in two-page view
  const leftPageIndex = useMemo(() => {
    if (pages.length === 0) return 0;
    if (isMobile) return currentPageIndex;
    
    // For two-page view, we want to show spreads
    // A spread consists of: left page (even index) and right page (odd index)
    // Calculate the spread start index (always even)
    const spreadStart = Math.floor(currentPageIndex / 2) * 2;
    return Math.min(spreadStart, pages.length - 1);
  }, [currentPageIndex, pages, isMobile]);

  const rightPageIndex = useMemo(() => {
    if (isMobile) return -1;
    const rightIdx = leftPageIndex + 1;
    // Only show right page if it exists and the left page is not the last page
    if (rightIdx < pages.length && leftPageIndex !== pages.length - 1) {
      return rightIdx;
    }
    return -1;
  }, [leftPageIndex, pages, isMobile]);

  // Progress percentage - fixed to show 100% on last spread
  const progressPercent = useMemo(() => {
    if (pages.length === 0) return 0;
    
    if (isMobile) {
      // Mobile: single page view
      const percent = ((currentPageIndex + 1) / pages.length) * 100;
      return Math.min(percent, 100);
    } else {
      // Desktop: two-page view
      // If we're showing a right page, use that for progress (this is the page user is reading)
      if (rightPageIndex !== -1) {
        const percent = ((rightPageIndex + 1) / pages.length) * 100;
        return Math.min(percent, 100);
      } else {
        // We're on the last page (odd number of pages, only left page showing)
        // This means we're at the end - should be 100%
        if (leftPageIndex === pages.length - 1) {
          return 100;
        }
        const percent = ((leftPageIndex + 1) / pages.length) * 100;
        return Math.min(percent, 100);
      }
    }
  }, [currentPageIndex, pages.length, isMobile, rightPageIndex, leftPageIndex]);

  // Restore saved page position after pages are loaded
  useEffect(() => {
    if (!initialRestoreDone.current && pages.length > 0 && isOpen) {
      if (shouldResume && savedProgress && savedProgress.pageIndex !== undefined && savedProgress.pageIndex < pages.length) {
        const targetPage = pages[savedProgress.pageIndex];
        if (targetPage) {
          setCurrentPosition(targetPage.start);
        }
      }
      initialRestoreDone.current = true;
    }
  }, [pages, isOpen, shouldResume, savedProgress]);

useEffect(() => {
  if (book && isOpen && pages.length > 0 && initialRestoreDone.current) {
    // Save the actual page being viewed - in two-page view, save the right page index
    let pageToSave = currentPageIndex;
    
    if (!isMobile && rightPageIndex !== -1) {
      // In two-page view, save the right page index (the one user is actively reading)
      pageToSave = rightPageIndex;
    }
    
    saveProgress(parsedBookId, currentChapter, currentPosition, pageToSave);
  }
}, [book, currentChapter, currentPosition, isOpen, parsedBookId, pages, currentPageIndex, rightPageIndex, isMobile]);
  // Fullscreen handling
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
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

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  const chapter = book?.chapters[currentChapter] || book?.chapters[0] || { title: "", content: "" };
  
  useLayoutEffect(() => {
    if (!isOpen || !pageBodyRef.current) return;
    const pageBodyEl = pageBodyRef.current;
    const measureEl = measureRef.current;
    if (!measureEl) return;
    let frameId = 0;
    let timeoutId = null;

    const updatePages = () => {
      if (isPaginatingRef.current) return;
      isPaginatingRef.current = true;
      
      frameId = window.requestAnimationFrame(() => {
        const pageWidth = pageBodyEl.clientWidth;
        const pageHeight = pageBodyEl.clientHeight;

        if (pageWidth <= 0 || pageHeight <= 0) {
          setPages(splitIntoFallbackPages(chapter.content || "", isMobile));
          isPaginatingRef.current = false;
          return;
        }

        syncMeasureStyles(measureEl, pageBodyEl);
        measureEl.style.width = `${pageWidth}px`;
        measureEl.style.height = `${pageHeight}px`;
        measureEl.style.overflow = "hidden";

        const content = chapter.content || "";
        const measuredPages = paginateByMeasure(content, measureEl);
        const newPages = measuredPages.length > 0 ? measuredPages : splitIntoFallbackPages(content, isMobile);
        
        setPages(newPages);
        
        timeoutId = setTimeout(() => {
          isPaginatingRef.current = false;
        }, 100);
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
      if (timeoutId) clearTimeout(timeoutId);
      updatePages();
    });
    observer.observe(pageBodyEl);

    return () => {
      window.cancelAnimationFrame(frameId);
      if (timeoutId) clearTimeout(timeoutId);
      observer.disconnect();
      isPaginatingRef.current = false;
    };
  }, [chapter.content, isOpen, isMobile, fontSize, lineHeight, fontFamily]);

  if (!book) return <div className="pt-24 text-center dark:text-white">Book not found</div>;

  const handleGoBack = () => {
    navigate("/");
  };

  const handleGoToCover = () => {
    setShowExtra("cover");
    setIsOpen(false);
    setCurrentChapter(0);
    setCurrentPosition(0);
    setShowSidebar(false);
    initialRestoreDone.current = false;
  };

  const goToChapterIntro = () => {
    setShowExtra(null);
    setIsOpen(false);
    setCurrentPosition(0);
    initialRestoreDone.current = false;
  };

  const goNextChapter = () => {
    if (currentChapter < book.chapters.length - 1) {
      setCurrentChapter((c) => c + 1);
      setCurrentPosition(0);
      setPages([]);
      setIsOpen(false);
      initialRestoreDone.current = false;
    }
  };

  const goPrevChapter = () => {
    if (currentChapter > 0) {
      const prevChapterContent = book.chapters[currentChapter - 1]?.content || "";
      const fallbackPages = splitIntoFallbackPages(prevChapterContent, isMobile);
      const lastPageStart = fallbackPages.length > 0 
        ? fallbackPages[fallbackPages.length - 1]?.start || 0 
        : 0;
      
      setCurrentChapter(currentChapter - 1);
      setCurrentPosition(lastPageStart);
      setPages(fallbackPages);
      setIsOpen(true);
      initialRestoreDone.current = false;
    }
  };

  // Fixed navigation logic for two-page view
  const next = () => {
    if (showExtra === "cover") {
      setShowExtra(null);
      setIsOpen(false);
      return;
    }
    
    if (!isOpen) {
      setIsOpen(true);
      return;
    }
    
    if (isMobile) {
      // Mobile: single page view
      if (currentPageIndex < pages.length - 1) {
        setCurrentPosition(pages[currentPageIndex + 1].start);
      } else {
        // Last page, go to next chapter
        if (currentChapter < book.chapters.length - 1) {
          goNextChapter();
        }
      }
    } else {
      // Desktop: two-page view
      // Check if we're on the last spread or at the end
      const isOnLastSpread = rightPageIndex === pages.length - 1;
      const isOnLastPageOnly = leftPageIndex === pages.length - 1 && rightPageIndex === -1;
      
      if (isOnLastSpread || isOnLastPageOnly) {
        // At the end of chapter, go to next chapter
        if (currentChapter < book.chapters.length - 1) {
          goNextChapter();
        }
      } else {
        // Calculate next spread
        let nextSpreadStart = leftPageIndex + 2;
        
        // Ensure we don't go beyond available pages
        if (nextSpreadStart >= pages.length) {
          // If next spread would exceed, go to last page (for odd page counts)
          if (pages.length % 2 === 1 && nextSpreadStart === pages.length) {
            setCurrentPosition(pages[pages.length - 1].start);
          }
        } else {
          // Go to next spread
          setCurrentPosition(pages[nextSpreadStart].start);
        }
      }
    }
  };

  const prev = () => {
    if (!showExtra && !isOpen && currentChapter === 0) {
      handleGoToCover();
      return;
    }
    
    if (!isOpen) {
      if (currentChapter > 0) {
        goPrevChapter();
      } else {
        handleGoToCover();
      }
      return;
    }
    
    if (isMobile) {
      // Mobile: single page view
      if (currentPageIndex === 0) {
        goToChapterIntro();
      } else {
        setCurrentPosition(pages[currentPageIndex - 1].start);
      }
    } else {
      // Desktop: two-page view
      // Calculate previous spread
      const prevSpreadStart = leftPageIndex - 2;
      
      if (prevSpreadStart >= 0) {
        // Go to previous spread
        setCurrentPosition(pages[prevSpreadStart].start);
      } else {
        // Go back to this chapter's intro before leaving the chapter.
        goToChapterIntro();
      }
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
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) prev();
    else next();
  };

  const resetSettings = () => {
    setFontSize(16);
    setLineHeight(1.65);
    setFontFamily("serif");
    setIsDarkMode(false);
    setShowSettings(false);
  };

  const getFontClass = () => {
    switch (fontFamily) {
      case "serif":
        return "font-serif";
      case "sans":
        return "font-sans";
      case "mono":
        return "font-mono";
      default:
        return "font-serif";
    }
  };

  return (
    <div
      className={`fixed inset-0 flex overflow-hidden select-none ${isDarkMode ? 'dark' : ''}`}
      style={{
        backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* SETTINGS PANEL */}
      <AnimatePresence>
        {showSettings && (
          <>
            <div className="fixed inset-0 z-[1100] bg-black/30" onClick={() => setShowSettings(false)} />
            <MotionDiv
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[1100] bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl max-h-[60vh] overflow-y-auto"
            >
              <div className="sticky top-0 z-10 px-4 py-3 bg-white border-b border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings size={18} className="text-blue-500" />
                    <h3 className="text-base font-semibold dark:text-white">Settings</h3>
                  </div>
                  <button 
                    onClick={() => setShowSettings(false)} 
                    className="p-1 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X size={16} className="dark:text-white" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Type size={14} className="text-blue-500" />
                      <label className="text-xs font-medium dark:text-white">Font Size</label>
                    </div>
                    <span className="px-1.5 py-0.5 text-[10px] font-medium text-blue-600 bg-blue-100 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                      {fontSize}px
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFontSize(Math.max(12, fontSize - 1))}
                      className="p-1.5 transition-colors bg-gray-100 rounded-lg dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <Minus size={12} className="dark:text-white" />
                    </button>
                    <input
                      type="range"
                      min="12"
                      max="28"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="flex-1 h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700"
                    />
                    <button
                      onClick={() => setFontSize(Math.min(28, fontSize + 1))}
                      className="p-1.5 transition-colors bg-gray-100 rounded-lg dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <Plus size={12} className="dark:text-white" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <AlignLeft size={14} className="text-blue-500" />
                      <label className="text-xs font-medium dark:text-white">Line Height</label>
                    </div>
                    <span className="px-1.5 py-0.5 text-[10px] font-medium text-blue-600 bg-blue-100 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                      {lineHeight}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLineHeight(Math.max(1.2, lineHeight - 0.1))}
                      className="p-1.5 transition-colors bg-gray-100 rounded-lg dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <Minus size={12} className="dark:text-white" />
                    </button>
                    <input
                      type="range"
                      min="1.2"
                      max="2.0"
                      step="0.05"
                      value={lineHeight}
                      onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                      className="flex-1 h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700"
                    />
                    <button
                      onClick={() => setLineHeight(Math.min(2.0, lineHeight + 0.1))}
                      className="p-1.5 transition-colors bg-gray-100 rounded-lg dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <Plus size={12} className="dark:text-white" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Palette size={14} className="text-blue-500" />
                    <label className="text-xs font-medium dark:text-white">Font</label>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { value: "serif", label: "Serif", class: "font-serif" },
                      { value: "sans", label: "Sans", class: "font-sans" },
                      { value: "mono", label: "Mono", class: "font-mono" },
                    ].map((font) => (
                      <button
                        key={font.value}
                        onClick={() => setFontFamily(font.value)}
                        className={`py-1.5 px-2 rounded-lg transition-all text-xs ${
                          fontFamily === font.value
                            ? "bg-blue-500 text-white shadow-md"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        <span className={font.class}>{font.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sun size={14} className="text-blue-500" />
                    <Moon size={14} className="text-blue-500" />
                    <label className="text-xs font-medium dark:text-white">Theme</label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setIsDarkMode(false)}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all text-xs ${
                        !isDarkMode 
                          ? "bg-blue-500 text-white shadow-md" 
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      <Sun size={12} />
                      <span>Light</span>
                    </button>
                    <button
                      onClick={() => setIsDarkMode(true)}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all text-xs ${
                        isDarkMode 
                          ? "bg-blue-500 text-white shadow-md" 
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      <Moon size={12} />
                      <span>Dark</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={toggleFullscreen}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs transition-colors bg-gray-100 rounded-lg dark:bg-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                    <span>{isFullscreen ? "Exit Full" : "Fullscreen"}</span>
                  </button>
                  <button
                    onClick={resetSettings}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs transition-colors bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"
                  >
                    <RotateCcw size={12} />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            </MotionDiv>
          </>
        )}
      </AnimatePresence>

      {/* TABLE OF CONTENTS DRAWER */}
      <AnimatePresence>
        {showSidebar && (
          <div className="fixed inset-0 z-[1000] flex">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowSidebar(false)} />
            <MotionDiv 
              initial={{ x: "-100%" }} 
              animate={{ x: 0 }} 
              exit={{ x: "-100%" }} 
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-[260px] sm:w-[280px] bg-white dark:bg-gray-800 h-full overflow-y-auto shadow-2xl"
            >
              <div className="sticky top-0 z-10 bg-white border-b border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center justify-between p-3 sm:p-4">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <BookOpen size={16} className="text-gray-600 dark:text-gray-400" />
                    <h2 className="text-xs font-semibold text-gray-700 dark:text-gray-300 sm:text-sm">Contents</h2>
                  </div>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="p-1 text-gray-500 transition rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="p-1.5 sm:p-2">
                <div
                  onClick={handleGoToCover}
                  className={`flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 mb-1 rounded-lg cursor-pointer transition-all ${
                    showExtra === "cover" 
                      ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white" 
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <Home size={14} />
                  <span className="text-xs font-medium sm:text-sm">Cover</span>
                  {showExtra === "cover" && <ChevronRight size={12} className="ml-auto" />}
                </div>

                <div className="my-1.5 border-t border-gray-100 dark:border-gray-700 sm:my-2" />

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
                      initialRestoreDone.current = false;
                    }}
                    className={`flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 mb-1 rounded-lg cursor-pointer transition-all ${
                      !showExtra && index === currentChapter 
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white" 
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span className="w-4 text-[10px] font-medium text-gray-400 dark:text-gray-500 sm:w-5 sm:text-xs">{index + 1}</span>
                    <span className="flex-1 text-[11px] truncate sm:text-sm">{ch.title}</span>
                    {!showExtra && index === currentChapter && <ChevronRight size={12} className="text-gray-400" />}
                  </div>
                ))}
              </div>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>

      {/* MAIN READER AREA */}
      <div className="relative flex flex-col items-center justify-center flex-1 h-full min-h-0 gap-1.5 px-1.5 py-1.5 overflow-hidden sm:gap-2 sm:px-2 sm:py-2 md:px-3 md:py-3">
        {/* Top Buttons */}
        <div className="absolute z-50 flex gap-2 top-2 left-2">
          <button
            onClick={handleGoBack}
            className="p-1.5 text-gray-600 dark:text-gray-300 transition bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 sm:p-2"
            title="Go Back"
          >
            <ArrowLeft size={14} className="sm:size-[16px] md:size-[18px]" />
          </button>
          <button
            onClick={() => setShowSidebar(true)}
            className="p-1.5 text-gray-600 dark:text-gray-300 transition bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 sm:p-2"
          >
            <Menu size={14} className="sm:size-[16px] md:size-[18px]" />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 text-gray-600 dark:text-gray-300 transition bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 sm:p-2"
          >
            <Settings size={14} className="sm:size-[16px] md:size-[18px]" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 z-40 h-0.5 bg-gray-200 dark:bg-gray-700">
          <div 
            className="h-full transition-all duration-300 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Title */}
        <h2 className="text-[9px] sm:text-[10px] md:text-xs uppercase tracking-wide font-medium text-gray-400 dark:text-gray-500 text-center px-20 pt-4 sm:px-24 sm:pt-5 md:pt-6">
          {showExtra === "cover" ? book.title : chapter.title}
        </h2>

        {/* Main Content */}
        <div className="relative flex justify-center flex-1 w-full min-h-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {showExtra === "cover" && (
              <MotionDiv 
                key="cover" 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }} 
                transition={{ duration: 0.4 }}
                onClick={handleTap} 
                className="flex items-center justify-center h-full overflow-hidden bg-white rounded-lg shadow-2xl cursor-pointer dark:bg-gray-800"
                style={{ maxWidth: isMobile ? "85%" : "50%", maxHeight: "100%" }}
              >
                <img src={book.cover} className="object-contain w-auto h-full max-w-full" alt="Cover" />
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
                style={{ maxWidth: isMobile ? "85%" : "50%", maxHeight: "100%" }}
              >
                {chapter.introImage ? (
                  <img src={chapter.introImage} alt="Art" className="object-contain w-auto h-full max-w-full" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full p-4 sm:p-6 bg-gradient-to-br from-gray-700 to-gray-900">
                    <h1 className="font-serif text-base tracking-wider text-center text-white sm:text-lg md:text-xl lg:text-2xl">
                      {chapter.title}
                    </h1>
                  </div>
                )}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none sm:bottom-4">
                  <p className="rounded-full bg-black/45 px-3 py-1 text-[8px] text-white/90 backdrop-blur-sm sm:text-[10px] md:text-xs">
                    Tap to begin →
                  </p>
                </div>
              </MotionDiv>
            )}

            {!showExtra && isOpen && pages.length > 0 && (
              <div className="min-h-0 p-1 rounded-lg bg-white/80 dark:bg-gray-800/80 shadow-2xl w-full h-full sm:p-1.5 md:p-2">
                <div
                  ref={measureRef}
                  aria-hidden="true"
                  className="fixed -left-[9999px] top-0 overflow-hidden pointer-events-none"
                />
                <MotionDiv
                  key={`${currentChapter}-${leftPageIndex}-${pages.length}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onClick={handleTap}
                  className="flex w-full h-full min-h-0 overflow-hidden text-gray-800 bg-white rounded-lg shadow-xl cursor-pointer dark:text-gray-200 dark:bg-gray-800"
                >
                  {/* Left Page */}
                  <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden bg-white border-r border-gray-200 dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex-1 min-h-0 px-2 pt-2 pb-1 overflow-y-auto sm:px-3 sm:pt-3 sm:pb-2 md:px-4 md:pt-4 md:pb-3 lg:px-5">
                      <p 
                        ref={pageBodyRef}
                        className={`text-justify text-gray-700 break-words whitespace-pre-wrap dark:text-gray-300 ${getFontClass()}`}
                        style={{ 
                          fontSize: `${fontSize}px`,
                          lineHeight: lineHeight,
                          userSelect: "none", 
                          WebkitUserSelect: "none" 
                        }}
                      >
                        {pages[leftPageIndex]?.text || ""}
                      </p>
                    </div>
                    <div className="text-center font-mono text-gray-400 dark:text-gray-500 py-1 shrink-0 text-[8px] sm:text-[9px] md:text-[10px]">
                      {leftPageIndex + 1} / {pages.length}
                    </div>
                  </div>
                  
                  {/* Right Page */}
                  {rightPageIndex !== -1 && (
                    <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden bg-white dark:bg-gray-800">
                      <div className="flex-1 min-h-0 px-2 pt-2 pb-1 overflow-y-auto sm:px-3 sm:pt-3 sm:pb-2 md:px-4 md:pt-4 md:pb-3 lg:px-5">
                        <p 
                          className={`text-justify text-gray-700 break-words whitespace-pre-wrap dark:text-gray-300 ${getFontClass()}`}
                          style={{ 
                            fontSize: `${fontSize}px`,
                            lineHeight: lineHeight,
                            userSelect: "none", 
                            WebkitUserSelect: "none" 
                          }}
                        >
                          {pages[rightPageIndex]?.text || ""}
                        </p>
                      </div>
                      <div className="text-center font-mono text-gray-400 dark:text-gray-500 py-1 shrink-0 text-[8px] sm:text-[9px] md:text-[10px]">
                        {rightPageIndex + 1} / {pages.length}
                      </div>
                    </div>
                  )}
                </MotionDiv>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Hint */}
        <div className="flex gap-3 text-[8px] text-gray-400 dark:text-gray-500 shrink-0 pb-0.5 sm:gap-4 sm:text-[9px] md:text-[10px]">
          <span>← Tap left</span>
          <span>Tap right →</span>
        </div>
      </div>
    </div>
  );
}

function Reader() {
  const { id } = useParams();
  const location = useLocation();
  const shouldResume = location.state?.resume === true;

  return <ReaderContent key={`${id}-${shouldResume ? "resume" : "start"}-${location.key}`} id={id} shouldResume={shouldResume} />;
}

export default Reader;
