import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion as framerMotion } from "framer-motion";
import { Menu, X, Home, Info, Mail, Moon, Sun } from "lucide-react";

const MotionDiv = framerMotion.div;

export default function Navbar({ isReaderPage }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("reader-dark-mode") === "true");
  const location = useLocation();

  useEffect(() => {
    const savedDarkMode = localStorage.getItem("reader-dark-mode");
    const dark = savedDarkMode === "true";

    if (savedDarkMode === null) {
      localStorage.setItem("reader-dark-mode", "false");
    }

    document.documentElement.classList.toggle("dark", dark);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    { path: "/about", label: "About", icon: Info },
    { path: "/contact", label: "Contact", icon: Mail },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "glass shadow-lg border-b border-gray-200 dark:border-gray-800"
          : "bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800"
      }`}
    >
      <div className="max-w-full px-4 mx-auto sm:px-8 lg:px-12">
        <div className={`flex items-center justify-between ${isReaderPage ? "h-12 sm:h-14" : "h-16 sm:h-20"}`}>
            <Link
              to="/"
              className="flex items-center gap-2 transition-transform hover:scale-105"
            >
              <img
                src="./covers/logo.png"
                alt="DewDrop Stories Logo"
                className="w-16 h-16 object-contain"
              />

              <span className="text-lg font-bold tracking-tight text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text">
                DewDrop Stories<span className="text-blue-500">.</span>
              </span>
            </Link>

          <div className="hidden md:flex md:items-center md:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-1 py-1 text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                }`}
              >
                {link.label}
                {isActive(link.path) && (
                  <MotionDiv
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
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
            <button onClick={toggleDarkMode} className="p-2 bg-gray-100 rounded-lg dark:bg-gray-800">
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 bg-gray-100 rounded-lg dark:bg-gray-800">
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
                className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive(link.path) ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600" : "text-gray-600 dark:text-gray-300"}`}
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
