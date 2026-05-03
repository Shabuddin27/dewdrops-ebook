import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence, motion as framerMotion } from "framer-motion";
import { useEffect, useState } from "react";

import Home from "./pages/Home";
import Reader from "./pages/Reader";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Navbar from "./components/Navbar";

const MotionDiv = framerMotion.div;

function AnimatedRoutes({ isReaderRoute }) {
  const location = useLocation();

  const routes = (
    <Routes location={location}>
      <Route path="/" element={<Home />} />
      <Route path="/reader" element={<Navigate to="/" replace />} />
      <Route path="/reader/:id" element={<Reader />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  if (isReaderRoute) return routes;

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
  const location = useLocation();
  const isReaderRoute = location.pathname.startsWith("/reader/");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] dark:from-[#1a1a1a] dark:to-[#0d0d0d] transition-colors duration-500">
      
      {/* Only show navbar when NOT on reader route AND not in fullscreen */}
      {!isReaderRoute && !isFullscreen && <Navbar />}

      <div className={!isReaderRoute && !isFullscreen ? "pt-16 md:pt-20 lg:pt-24" : ""}>
        <AnimatedRoutes isReaderRoute={isReaderRoute} />
      </div>
    </div>
  );
}

export default App;
