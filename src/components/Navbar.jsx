import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [show, setShow] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <>
      <nav
        className={`
          fixed top-0 left-0 w-full z-[100]
          transition-all duration-500 ease-in-out
          ${show ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}
          ${scrolled 
            ? "py-3 bg-white/95 backdrop-blur-lg shadow-md border-b border-gray-100" 
            : "py-4 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100/50"
          }
        `}
      >
        <div className="relative flex items-center justify-between w-full px-4 mx-auto sm:px-6 md:px-8 lg:px-12">
          {/* Logo */}
          <Link to="/" className="group shrink-0">
            <h1 className="font-serif text-xl font-bold tracking-tight text-gray-900 sm:text-2xl md:text-3xl">
              DewDrop Stories<span className="text-blue-500">.</span>
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="items-center hidden gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-medium relative transition-colors duration-300
                  ${location.pathname === link.path 
                    ? "text-blue-600" 
                    : "text-gray-700 hover:text-gray-900"
                  }`}
              >
                {link.name}
                {location.pathname === link.path && (
                  <span className="absolute left-0 w-full h-0.5 bg-blue-500 rounded-full -bottom-1" />
                )}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 transition-colors rounded-lg md:hidden hover:bg-gray-100 active:bg-gray-200"
            aria-label="Toggle menu"
          >
            <div className="flex flex-col justify-between w-5 h-4">
              <span className={`w-full h-0.5 bg-gray-800 transition-all duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
              <span className={`w-full h-0.5 bg-gray-800 transition-all duration-300 ${mobileMenuOpen ? "opacity-0" : ""}`} />
              <span className={`w-full h-0.5 bg-gray-800 transition-all duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      <div
        className={`
          fixed top-[57px] left-0 right-0 z-[99] bg-white shadow-xl border-b border-gray-100
          transition-all duration-300 ease-in-out md:hidden
          ${mobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"}
        `}
      >
        <div className="flex flex-col py-2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`
                px-6 py-3.5 text-base font-medium transition-colors
                ${location.pathname === link.path 
                  ? "text-blue-600 bg-blue-50/80 border-l-4 border-blue-500" 
                  : "text-gray-700 hover:bg-gray-50 hover:pl-7 transition-all duration-200"}
              `}
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Subtle shadow at bottom for depth */}
      <div className="fixed bottom-0 left-0 w-full h-12 pointer-events-none bg-gradient-to-t from-gray-50/50 to-transparent z-[99]" />
    </>
  );
};

export default Navbar;
