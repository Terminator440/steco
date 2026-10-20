import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "../lib/siteSettings";

const UPDATED = "20 octombrie 2026";

function Section({ title, children }) {
  return (
    <section className="border-t border-line pt-8">
      <h2 className="display display-sm">{title}</h2>
      <div className="mt-4 space-y-4 text-ink-soft">{children}</div>
    </section>
  );
}

export function PrivacyPage() {
  const settings = useSiteSettings();
  const email = settings.email;

  useEffect(() => {
    document.title = "Politica de confidențialitate — Steco Events";
  }, []);

  const contact = email ? (
    <a href={`mailto:${email}`} className="text-ink underline">
      {email}
    </a>
  ) : (
    "adresa de email din pagina Contact"
  );

  return (
    <main>
      <section data-header="dark" className="bg-plum px-4 pb-20 pt-36 text-center text-cream sm:px-8">
        <h1 className="display display-lg page-in mx-auto max-w-[16ch]">Politica de confidențialitate</h1>
        <p className="page-in mx-auto mt-6 max-w-[48ch] text-cream/80" style={{ "--d": "0.15s" }}>
          Ce facem cu datele pe care ni le trimiți prin formularul de cerere. Ultima actualizare: {UPDATED}.
        </p>
      </section>

      <article data-header="light" className="bg-paper px-4 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-[68ch] gap-10 text-[1.0625rem] leading-[1.7]">
          <Section title="Cine răspunde de date">
            <p>
              Datele sunt prelucrate de Steco Events. Pentru orice întrebare despre ele ne scrii la {contact}.
            </p>
          </Section>

          <Section title="Ce date colectăm">
            <p>
              Doar ce completezi în formularul de pe pagina <Link to="/contact" className="text-ink underline">Contact</Link>:
              numele, adresa de email, telefonul (opțional), tipul evenimentului, data, numărul aproximativ de invitați,
              orașul sau locația și mesajul tău.
            </p>
            <p>
              Site-ul nu folosește cookie-uri de urmărire, publicitate sau statistici. Fonturile sunt găzduite pe site, deci
              nu se fac cereri către Google când îl vizitezi.
            </p>
          </Section>

          <Section title="De ce le folosim">
            <p>
              Ca să-ți răspundem la cerere și să-ți pregătim o ofertă pentru eveniment. Nu le folosim pentru reclame și nu le
              vindem nimănui.
            </p>
            <p>
              Le prelucrăm pe baza acordului pe care îl dai când bifezi căsuța din formular și pentru pașii pe care îi facem
              la cererea ta înainte de un eventual contract (art. 6 alin. 1 lit. a și b din Regulamentul (UE) 2016/679, GDPR).
            </p>
          </Section>

          <Section title="Unde sunt păstrate și cine le mai vede">
            <p>
              Cererile sunt salvate într-o bază de date Supabase, pe servere din Uniunea Europeană (Irlanda). Le pot vedea
              doar persoanele din echipa Steco care au cont de administrare.
            </p>
            <p>
              Când primim o cerere nouă, detaliile ei ne sunt trimise și pe email, prin serviciul Resend. Site-ul este găzduit
              de Vercel. Acești furnizori pot prelucra date și în afara Uniunii Europene, pe baza clauzelor contractuale
              standard aprobate de Comisia Europeană.
            </p>
          </Section>

          <Section title="Cât timp le păstrăm">
            <p>
              Cât timp discutăm despre eveniment și îl organizăm, apoi cel mult doi ani, după care le ștergem. Le ștergem mai
              devreme dacă ne ceri asta.
            </p>
          </Section>

          <Section title="Drepturile tale">
            <p>
              Ne poți cere oricând să vezi datele pe care le avem despre tine, să le corectăm, să le ștergem, să le
              restricționăm sau să ți le trimitem într-un format ușor de folosit. Îți poți retrage acordul în orice moment,
              fără să fie afectat ce am făcut până atunci. Ne scrii la {contact} și îți răspundem în cel mult o lună.
            </p>
            <p>
              Dacă ți se pare că nu am respectat aceste drepturi, poți depune o plângere la Autoritatea Națională de
              Supraveghere a Prelucrării Datelor cu Caracter Personal (
              <a href="https://www.dataprotection.ro" target="_blank" rel="noreferrer" className="text-ink underline">
                dataprotection.ro
              </a>
              ).
            </p>
          </Section>
        </div>
      </article>
    </main>
  );
}
