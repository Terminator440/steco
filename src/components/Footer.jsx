import { Link } from "react-router-dom";
import { navItems } from "./Navbar";
import { socialLinks, useSiteSettings } from "../lib/siteSettings";

export function Footer() {
  const settings = useSiteSettings();
  const links = socialLinks(settings);

  return (
    <footer data-header="dark" className="overflow-hidden bg-night px-4 pb-8 pt-24 text-cream sm:px-8">
      <div className="mx-auto grid max-w-[1600px] gap-12 text-[0.9375rem] md:grid-cols-3">
        <p className="max-w-[34ch] text-cream/75">
          Organizăm nunți, botezuri, majorate, aniversări și gender reveal, cu decor, candy bar și coordonare în ziua
          evenimentului.
        </p>

        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <Link to={item.to} className="text-cream/75 transition-colors hover:text-cream">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="space-y-2">
          {settings.email && (
            <a href={`mailto:${settings.email}`} className="block text-cream/75 hover:text-cream">
              {settings.email}
            </a>
          )}
          {settings.phone && (
            <a href={`tel:${settings.phone.replace(/\s+/g, "")}`} className="block text-cream/75 hover:text-cream">
              {settings.phone}
            </a>
          )}
          {links.map((link) => (
            <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="block text-cream/75 hover:text-cream">
              {link.label}
            </a>
          ))}
          <Link to="/contact" className="link-dots mt-4 text-cream">
            Cere o ofertă
          </Link>
        </div>
      </div>

      <p
        aria-hidden="true"
        className="display reveal mx-auto mt-20 max-w-[1600px] select-none text-center text-[21vw] leading-[0.8] tracking-[0.06em] text-cream/90 [margin-right:-0.06em]"
      >
        STECO
      </p>

      <div className="mx-auto mt-10 flex max-w-[1600px] flex-wrap justify-between gap-4 border-t border-cream/15 pt-6 text-[0.8125rem] text-cream/50">
        <p>© {new Date().getFullYear()} Steco Events</p>
        <Link to="/confidentialitate" className="hover:text-cream">
          Politica de confidențialitate
        </Link>
        <Link to="/admin" className="hover:text-cream">
          Administrare
        </Link>
      </div>
    </footer>
  );
}
