import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence, motion as framerMotion } from "framer-motion";
import { useEffect } from "react";

import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Navbar from "./components/Navbar";

const MotionDiv = framerMotion.div;

function AnimatedRoutes() {
  const location = useLocation();

  const routes = (
    <Routes location={location}>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
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
  // Dark mode setup
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("reader-dark-mode");

    if (savedDarkMode === "true") {
      document.documentElement.classList.add("dark");
    } else if (savedDarkMode === "false") {
      document.documentElement.classList.remove("dark");
    } else {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfaf4] to-[#ede7da] dark:from-[#17150f] dark:to-[#0e0c08] transition-colors duration-500 select-none">
      <Navbar />
      <div className="pt-16 md:pt-20 lg:pt-24">
        <AnimatedRoutes />
      </div>
    </div>
  );
}

export default App;
