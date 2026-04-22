import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [show, setShow] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let lastScroll = 0;
    const handleScroll = () => {
      const current = window.scrollY;
      if (current > lastScroll && current > 80) {
        setShow(false);
      } else {
        setShow(true);
      }
      lastScroll = current;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <nav
      className={`
        fixed top-0 left-0 w-full z-[100]
        transition-all duration-500 ease-in-out
        ${show ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}
        ${scrolled ? "py-3 backdrop-blur-xl bg-white/60" : "py-5 bg-transparent"}
      `}
    >
      <div className="absolute bottom-0 left-0 w-full h-8 pointer-events-none bg-gradient-to-b from-transparent to-white/70" />

      <div className="relative max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="group">
          <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-gray-800">
            DewDrop Stories<span className="text-blue-500">.</span>
          </h1>
        </Link>

        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-medium relative transition-colors duration-300
                  ${location.pathname === link.path ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}`}
              >
                {link.name}
                {location.pathname === link.path && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-full" />
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;