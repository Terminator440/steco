import { useEffect } from "react";
import { Link } from "react-router-dom";

export function NotFound() {
  useEffect(() => {
    document.title = "Pagina nu există — Steco Events";
  }, []);

  return (
    <main>
      <section
        data-header="dark"
        className="flex min-h-[80svh] items-center justify-center bg-plum px-4 pb-20 pt-36 text-center text-cream sm:px-8"
      >
        <div className="max-w-3xl">
          <h1 className="display display-lg page-in">Pagina nu există</h1>
          <p className="page-in mx-auto mt-6 max-w-[44ch] text-lg text-cream/80" style={{ "--d": "0.15s" }}>
            Adresa e greșită sau pagina a fost mutată. Poți începe de pe prima pagină sau te uiți direct prin evenimentele
            noastre.
          </p>
          <div className="page-in mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-4" style={{ "--d": "0.25s" }}>
            <Link to="/" className="link-dots">
              Prima pagină
            </Link>
            <Link to="/portofoliu" className="link-dots">
              Portofoliu
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
