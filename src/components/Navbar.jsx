import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion as framerMotion } from "framer-motion";
import { Menu, X, Home, Info, Mail, Moon, Sun, BarChart2 } from "lucide-react";

const MotionDiv = framerMotion.div;

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("reader-dark-mode") === "true");
  const location = useLocation();
  const navRef = useRef(null);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem("reader-dark-mode");
    if (savedDarkMode === null) localStorage.setItem("reader-dark-mode", "false");
    document.documentElement.classList.toggle("dark", savedDarkMode === "true");

    const sync = () => {
      const dark = localStorage.getItem("reader-dark-mode") === "true";
      setIsDarkMode(dark);
      document.documentElement.classList.toggle("dark", dark);
    };
    window.addEventListener("pageshow", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("pageshow", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
      if (window.scrollY > 10) setIsMenuOpen(false);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isMenuOpen]);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem("reader-dark-mode", newDarkMode);
    newDarkMode 
      ? document.documentElement.classList.add("dark") 
      : document.documentElement.classList.remove("dark");
  };

  const navLinks = [
    { path: "/", label: "Home", icon: Home },
    { path: "/stats", label: "Stats", icon: BarChart2 },
    { path: "/about", label: "About", icon: Info },
    { path: "/contact", label: "Contact", icon: Mail },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "glass shadow-lg border-b border-gray-200 dark:border-gray-800"
          : "bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800"
      }`}
    >
      <div className="max-w-full px-4 mx-auto sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16 sm:h-20">
            <Link
              to="/"
              className="flex items-center gap-2.5 transition-opacity duration-200 hover:opacity-80 select-none"
            >
              <span
                className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex-shrink-0 shadow-md"
                style={{ background: "linear-gradient(135deg, #FBBF24 0%, #D97706 55%, #92400E 100%)" }}
              >
                {/* Book-spine D: pages fan from spine, silhouette forms the letter D */}
                <svg viewBox="0 0 18 22" className="w-[18px] h-[18px] sm:w-5 sm:h-5" fill="none">
                  {/* Spine — the straight stroke of the D */}
                  <line x1="2" y1="1" x2="2" y2="21" stroke="white" strokeOpacity="0.95" strokeWidth="2" strokeLinecap="round"/>
                  {/* Top cover */}
                  <line x1="2" y1="1"  x2="9"  y2="1"  stroke="white" strokeOpacity="0.9" strokeWidth="1.8" strokeLinecap="round"/>
                  {/* Bottom cover */}
                  <line x1="2" y1="21" x2="9"  y2="21" stroke="white" strokeOpacity="0.9" strokeWidth="1.8" strokeLinecap="round"/>
                  {/* Pages — longer in the middle, shorter near top/bottom → silhouette = D curve */}
                  <line x1="2" y1="4"  x2="8.5"  y2="4"  stroke="white" strokeOpacity="0.72" strokeWidth="1" strokeLinecap="round"/>
                  <line x1="2" y1="7"  x2="14"   y2="7"  stroke="white" strokeOpacity="0.62" strokeWidth="1" strokeLinecap="round"/>
                  <line x1="2" y1="10" x2="17"   y2="10" stroke="white" strokeOpacity="0.55" strokeWidth="1" strokeLinecap="round"/>
                  <line x1="2" y1="12" x2="17"   y2="12" stroke="white" strokeOpacity="0.55" strokeWidth="1" strokeLinecap="round"/>
                  <line x1="2" y1="15" x2="14"   y2="15" stroke="white" strokeOpacity="0.62" strokeWidth="1" strokeLinecap="round"/>
                  <line x1="2" y1="18" x2="8.5"  y2="18" stroke="white" strokeOpacity="0.72" strokeWidth="1" strokeLinecap="round"/>
                </svg>
              </span>
              <div className="flex flex-col leading-none gap-[3px]">
                <span className="text-[16px] sm:text-[17px] font-extrabold tracking-tight text-gray-900 dark:text-white">
                  DewDrop
                </span>
                <span className="text-[9px] sm:text-[10px] font-semibold tracking-[0.22em] uppercase text-amber-600 dark:text-amber-500">
                  Stories
                </span>
              </div>
            </Link>

          <div className="hidden md:flex md:items-center md:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-1 py-1 text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-gray-600 hover:text-amber-700 dark:text-gray-300 dark:hover:text-amber-400"
                }`}
              >
                {link.label}
                {isActive(link.path) && (
                  <MotionDiv
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-amber-700 rounded-full"
                  />
                )}
              </Link>
            ))}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-600 transition-colors bg-gray-100 rounded-lg dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button onClick={toggleDarkMode} className="p-2 bg-gray-100 rounded-lg dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 bg-gray-100 rounded-lg dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <MotionDiv initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="py-4 border-t border-gray-100 md:hidden dark:border-gray-800">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive(link.path) ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" : "text-gray-600 dark:text-gray-300"}`}
              >
                <link.icon size={18} />
                <span className="text-sm font-medium">{link.label}</span>
              </Link>
            ))}
          </MotionDiv>
        )}
      </div>
    </nav>
  );
}
