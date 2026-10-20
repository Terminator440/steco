import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useSiteSettings } from "../lib/siteSettings";

export const navItems = [
  { to: "/servicii", label: "Servicii" },
  { to: "/portofoliu", label: "Portofoliu" },
  { to: "/misiunea-noastra", label: "Despre noi" },
  { to: "/participanti", label: "Participanți" },
  { to: "/contact", label: "Contact" }
];

// Antetul e transparent: își schimbă culoarea după secțiunea de sub el (data-header="dark" | "light").
function useHeaderTheme(pathname) {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    let frame = 0;

    const check = () => {
      frame = 0;
      const stack = document.elementsFromPoint(window.innerWidth / 2, 36);
      const section = stack.map((el) => el.closest("[data-header]")).find(Boolean);
      setTheme(section?.getAttribute("data-header") || "light");
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    // Conținutul vine din Supabase după navigare, așa că verificăm și când apar secțiunile.
    const main = document.querySelector("#root");
    const observer = new MutationObserver(schedule);
    if (main) observer.observe(main, { childList: true, subtree: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, [pathname]);

  return theme;
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const settings = useSiteSettings();
  const sectionTheme = useHeaderTheme(location.pathname);
  const theme = open ? "dark" : sectionTheme;

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = "hidden";
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header
        className={[
          "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
          theme === "dark" ? "text-cream" : "text-ink"
        ].join(" ")}
      >
        <nav className="mx-auto grid max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center px-4 py-5 sm:px-8">
          <ul className="hidden items-center gap-7 text-[0.9375rem] lg:flex">
            {navItems.slice(0, 3).map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    ["transition-opacity hover:opacity-100", isActive ? "opacity-100" : "opacity-75"].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <Link
            to="/"
            aria-label="Steco Events, pagina principală"
            className="col-start-2 font-display text-[1.375rem] tracking-[0.34em] [margin-right:-0.34em]"
          >
            STECO
          </Link>

          <div className="col-start-3 flex items-center justify-end gap-7 text-[0.9375rem]">
            <NavLink to="/contact" className="hidden opacity-75 transition-opacity hover:opacity-100 lg:block">
              Cere o ofertă
            </NavLink>
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              aria-expanded={open}
              aria-controls="meniu"
              className="-my-2 py-2 font-medium"
            >
              {open ? "Închide" : "Meniu"}
            </button>
          </div>
        </nav>
      </header>

      {open && (
        <div
          id="meniu"
          className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-night px-4 pb-10 pt-28 text-cream sm:px-8"
        >
          <ul className="mx-auto w-full max-w-[1600px] flex-1">
            {[{ to: "/", label: "Acasă" }, ...navItems].map((item, idx) => (
              <li key={item.to} className="page-in border-b border-cream/15" style={{ "--d": `${idx * 0.05}s` }}>
                <NavLink
                  to={item.to}
                  end
                  className={({ isActive }) =>
                    [
                      "display display-lg block py-4 transition-colors hover:text-magenta sm:py-5",
                      isActive ? "text-magenta" : ""
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mx-auto mt-10 flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-6 text-[0.9375rem] text-cream/75">
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              {settings.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}
              {settings.phone && <a href={`tel:${settings.phone.replace(/\s+/g, "")}`}>{settings.phone}</a>}
            </div>
            <Link to="/contact" className="link-dots text-cream">
              Planifică evenimentul
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
