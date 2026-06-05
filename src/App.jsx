import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence, motion as framerMotion } from "framer-motion";
import { useEffect } from "react";

import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Stats from "./pages/Stats";
import Navbar from "./components/Navbar";
import FloatingInstagram from "./components/FloatingInstagram";

const MotionDiv = framerMotion.div;

function AnimatedRoutes() {
  const location = useLocation();

  const routes = (
    <Routes location={location}>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/stats" element={<Stats />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  return (
    <AnimatePresence mode="wait">
      <MotionDiv
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="h-full"
      >
        {routes}
      </MotionDiv>
    </AnimatePresence>
  );
}

function App() {
  // Dark mode setup — also re-syncs on bfcache restore (back from reader) and cross-tab changes
  useEffect(() => {
    const apply = () => {
      const dark = localStorage.getItem("reader-dark-mode");
      if (dark === "true") document.documentElement.classList.add("dark");
      else if (dark === "false") document.documentElement.classList.remove("dark");
      else if (window.matchMedia("(prefers-color-scheme: dark)").matches) document.documentElement.classList.add("dark");
    };
    apply();
    window.addEventListener("pageshow", apply);
    window.addEventListener("storage", apply);
    return () => {
      window.removeEventListener("pageshow", apply);
      window.removeEventListener("storage", apply);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfaf4] to-[#ede7da] dark:from-[#17150f] dark:to-[#0e0c08] text-gray-900 dark:text-gray-100 transition-colors duration-500 select-none flex flex-col">
      <Navbar />
      <div className="pt-16 md:pt-20 lg:pt-24 flex-1">
        <AnimatedRoutes />
      </div>
      <FloatingInstagram />
    </div>
  );
}

export default App;
