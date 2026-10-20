import { Link, useLocation } from "react-router-dom";
import { Branch } from "./Brand";
import { navItems } from "./Navbar";
import { socialLinks, useSiteSettings } from "../lib/siteSettings";

export function Footer() {
  const { pathname } = useLocation();
  const showInvitation = pathname !== "/contact";
  const settings = useSiteSettings();
  const links = socialLinks(settings);

  return (
    <footer className="bg-ink text-paper">
      {showInvitation && (
        <div className="relative overflow-hidden border-b border-paper/15">
          <Branch
            animated={false}
            className="pointer-events-none absolute right-[10%] top-1/2 hidden h-[460px] -translate-y-1/2 rotate-6 text-paper/30 md:block"
          />
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-8 sm:py-28">
            <h2 className="font-display max-w-[16ch] text-[clamp(2.25rem,4.6vw,4rem)] leading-[1.05]">
              Spune-ne ce sărbătorești.
            </h2>
            <p className="mt-6 max-w-[48ch] text-lg text-paper/75">
              Ne spui data, locul și cum îți imaginezi ziua, iar noi revenim cu o propunere făcută pentru evenimentul tău.
            </p>
            <Link
              to="/contact"
              className="mt-10 inline-flex items-center justify-center rounded-[3px] bg-paper px-6 py-3 text-[0.9375rem] font-medium tracking-[0.02em] text-ink transition-colors hover:bg-blush"
            >
              Cere o ofertă
            </Link>
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 text-[0.9375rem] sm:px-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="font-display text-[1.35rem] tracking-[0.3em]">STECO</p>
          <p className="mt-1 text-paper/60">Event planning &amp; management</p>
          {(settings.phone || settings.email) && (
            <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-paper/85">
              {settings.phone && (
                <a href={`tel:${settings.phone.replace(/\s+/g, "")}`} className="hover:text-paper">
                  {settings.phone}
                </a>
              )}
              {settings.email && (
                <a href={`mailto:${settings.email}`} className="hover:text-paper">
                  {settings.email}
                </a>
              )}
            </p>
          )}
        </div>
        <ul className="flex flex-wrap gap-x-7 gap-y-3 text-paper/75">
          {navItems.map((item) => (
            <li key={item.to}>
              <Link to={item.to} className="hover:text-paper">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap justify-between gap-4 border-t border-paper/15 pt-6 text-[0.8125rem] text-paper/50 md:col-span-2">
          <p>© {new Date().getFullYear()} Steco Events</p>
          {links.length > 0 && (
            <ul className="flex gap-5">
              {links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} target="_blank" rel="noreferrer" className="hover:text-paper">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
          <Link to="/admin" className="hover:text-paper">
            Administrare
          </Link>
        </div>
      </div>
    </footer>
  );
}
