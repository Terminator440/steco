import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Wordmark } from "./Brand";

export const navItems = [
  { to: "/servicii", label: "Servicii" },
  { to: "/portofoliu", label: "Portofoliu" },
  { to: "/misiunea-noastra", label: "Misiunea noastră" },
  { to: "/participanti", label: "Participanți" },
  { to: "/contact", label: "Contact" }
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const solid = scrolled || open || location.pathname.startsWith("/admin");

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-40 border-b transition-colors duration-300",
        solid ? "border-line bg-paper/90 backdrop-blur-md" : "border-transparent bg-paper/0"
      ].join(" ")}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8">
        <Link to="/" aria-label="Steco Events, pagina principală">
          <Wordmark />
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          <ul className="flex items-center gap-7 text-[0.9375rem]">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "border-b py-1 transition-colors",
                      isActive
                        ? "border-magenta text-ink"
                        : "border-transparent text-ink-soft hover:text-ink"
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <Link to="/contact" className="btn-primary px-5 py-2.5">
            Cere o ofertă
          </Link>
        </div>

        <button
          type="button"
          className="-mr-2 inline-flex h-11 w-11 items-center justify-center text-ink lg:hidden"
          aria-label={open ? "Închide meniul" : "Deschide meniul"}
          aria-expanded={open}
          aria-controls="meniu-mobil"
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="relative block h-3 w-6">
            <span
              className={[
                "absolute left-0 block h-px w-6 bg-current transition-transform duration-300",
                open ? "top-1.5 rotate-45" : "top-0"
              ].join(" ")}
            />
            <span
              className={[
                "absolute left-0 block h-px w-6 bg-current transition-transform duration-300",
                open ? "top-1.5 -rotate-45" : "top-3"
              ].join(" ")}
            />
          </span>
        </button>
      </nav>

      {open && (
        <div id="meniu-mobil" className="h-[calc(100svh-4rem)] overflow-y-auto border-t border-line bg-paper lg:hidden">
          <ul className="flex flex-col px-4 pt-6 sm:px-8">
            {navItems.map((item) => (
              <li key={item.to} className="border-b border-line">
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "block py-4 font-display text-[2rem] leading-tight",
                      isActive ? "text-magenta" : "text-ink"
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="px-4 py-8 sm:px-8">
            <Link to="/contact" className="btn-primary w-full">
              Cere o ofertă
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
