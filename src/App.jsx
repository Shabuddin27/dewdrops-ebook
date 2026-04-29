import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence, motion as framerMotion } from "framer-motion";

import Home from "./pages/Home";
import Reader from "./pages/Reader";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Navbar from "./components/Navbar";

const MotionDiv = framerMotion.div;

function AnimatedRoutes() {
  const location = useLocation();
  const isReaderRoute = location.pathname.startsWith("/reader/");

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
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.02, opacity: 0 }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="h-full"
      >
        {routes}
      </MotionDiv>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#f9fafb] transition-colors duration-500">
        <Navbar />
        <div className="pt-20">
          <AnimatedRoutes />
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
