import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Acasă" },
  { to: "/servicii", label: "Servicii" },
  { to: "/portofoliu", label: "Portofoliu" },
  { to: "/contact", label: "Contact" }
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="text-2xl font-bold text-yellow-500 tracking-[0.25em]">
            STECO
          </span>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-medium text-slate-200 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "transition-colors hover:text-steco-gold",
                  isActive ? "text-steco-gold" : "text-slate-300"
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/admin"
            className="rounded-full border border-steco-gold/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-steco-gold hover:bg-steco-gold/10"
          >
            Admin
          </NavLink>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-slate-700/80 p-2 text-slate-200 hover:bg-slate-800/70 md:hidden"
          aria-label="Deschide meniul"
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="sr-only">Meniu</span>
          <div className="flex flex-col gap-1.5">
            <span className="block h-0.5 w-5 rounded-full bg-slate-100" />
            <span className="block h-0.5 w-4 rounded-full bg-slate-100" />
            <span className="block h-0.5 w-6 rounded-full bg-slate-100" />
          </div>
        </button>
      </nav>

      {open && (
        <div className="border-t border-slate-800/80 bg-slate-950/95 py-3 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col space-y-1 px-4 sm:px-6 lg:px-8">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  [
                    "rounded-md px-3 py-2 text-sm font-medium",
                    isActive ? "bg-slate-800 text-steco-gold" : "text-slate-200 hover:bg-slate-900"
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink
              to="/admin"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                [
                  "rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em]",
                  isActive ? "bg-slate-800 text-steco-gold" : "text-steco-gold hover:bg-slate-900"
                ].join(" ")
              }
            >
              Admin
            </NavLink>
          </div>
        </div>
      )}
    </header>
  );
}

