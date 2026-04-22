import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import Home from "./pages/Home";
import Reader from "./pages/Reader";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Navbar from "./components/Navbar";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.02, opacity: 0 }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="h-full"
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/reader/:id" element={<Reader />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </motion.div>
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