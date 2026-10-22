import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { EVENT_TYPES, isEventType } from "../lib/eventTypes";
import { supabase } from "../lib/supabaseClient";
import { socialLinks, useSiteSettings } from "../lib/siteSettings";

// Tipul evenimentului pornește gol, ca o cerere de botez să nu plece din greșeală ca „Nuntă”.
// De pe pagina Servicii vine deja ales (/contact?tip=botez).
const EMPTY = {
  name: "",
  email: "",
  phone: "",
  event_type: "",
  event_date: "",
  guests: "",
  location: "",
  message: "",
  consent: false,
  website: ""
};

const fieldClass =
  "w-full rounded-none border-0 border-b border-ink/25 bg-transparent px-0 py-3 text-ink placeholder:text-ink-soft/60 transition-colors focus:border-ink focus:outline-none";

function Field({ label, htmlFor, hint, children, className = "" }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-2 block text-[0.9375rem] font-medium text-ink">
        {label}
        {hint && <span className="ml-1 font-normal text-ink-soft">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

export function ContactForm() {
  const settings = useSiteSettings();
  const [searchParams] = useSearchParams();
  const [values, setValues] = useState(() => {
    const tip = searchParams.get("tip");
    return isEventType(tip) ? { ...EMPTY, event_type: tip } : EMPTY;
  });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const links = socialLinks(settings);

  function update(field) {
    return (event) => {
      const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
      setValues((prev) => ({ ...prev, [field]: value }));
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    // Câmp ascuns pentru roboți: oamenii nu îl văd, deci nu îl completează.
    if (values.website) {
      setStatus("sent");
      return;
    }

    if (!supabase) {
      setError("Formularul nu este disponibil acum. Scrie-ne direct pe email sau sună-ne.");
      return;
    }

    setStatus("sending");

    const { error: insertError } = await supabase.from("steco_contact_requests").insert({
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim() || null,
      event_type: values.event_type,
      event_date: values.event_date || null,
      guests: values.guests ? Number(values.guests) : null,
      location: values.location.trim() || null,
      message: values.message.trim() || null,
      consent: values.consent
    });

    if (insertError) {
      console.error("[Steco] Eroare la trimiterea cererii:", insertError.message);
      setStatus("idle");
      setError("Cererea nu a fost trimisă. Verifică datele completate și încearcă din nou.");
      return;
    }

    setValues(EMPTY);
    setStatus("sent");
  }

  return (
    <section id="formular" data-header="light" className="scroll-mt-4 bg-paper px-4 py-16 sm:px-8 sm:py-32">
      {/* Pe telefon formularul vine imediat după introducere; datele de contact coboară sub el. */}
      <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-[auto_1fr] lg:gap-x-24 lg:gap-y-0">
        <div>
          <h2 className="display display-md reveal max-w-[16ch]">Ce ne spui acum ne ajută să venim pregătiți.</h2>
          <p className="mt-6 max-w-[46ch] text-ink-soft">
            Data și numărul aproximativ de invitați sunt suficiente pentru o primă discuție. Restul îl stabilim
            împreună.
          </p>
        </div>

        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          {status === "sent" ? (
            <div className="border-t border-magenta pt-8" role="status">
              <p className="display display-sm">Am primit cererea ta.</p>
              <p className="mt-4 max-w-[44ch] text-ink-soft">
                Revenim pe email sau telefon cu o propunere pentru evenimentul tău.
              </p>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="mt-8 border-b border-ink/30 pb-0.5 text-[0.9375rem] font-medium hover:border-magenta hover:text-magenta"
              >
                Trimite o altă cerere
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
              <Field label="Nume" htmlFor="cf-name" className="sm:col-span-2">
                <input
                  id="cf-name"
                  required
                  minLength={2}
                  maxLength={120}
                  autoComplete="name"
                  value={values.name}
                  onChange={update("name")}
                  className={fieldClass}
                />
              </Field>
              <Field label="Email" htmlFor="cf-email">
                <input
                  id="cf-email"
                  type="email"
                  required
                  maxLength={200}
                  autoComplete="email"
                  value={values.email}
                  onChange={update("email")}
                  className={fieldClass}
                />
              </Field>
              <Field label="Telefon" hint="(opțional)" htmlFor="cf-phone">
                <input
                  id="cf-phone"
                  type="tel"
                  maxLength={40}
                  autoComplete="tel"
                  value={values.phone}
                  onChange={update("phone")}
                  className={fieldClass}
                />
              </Field>
              <Field label="Tipul evenimentului" htmlFor="cf-type">
                <select
                  id="cf-type"
                  required
                  value={values.event_type}
                  onChange={update("event_type")}
                  className={`${fieldClass} invalid:text-ink-soft [&>option]:text-ink`}
                >
                  <option value="" disabled>
                    Alege tipul
                  </option>
                  {EVENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Data" hint="(dacă o știi)" htmlFor="cf-date">
                <input
                  id="cf-date"
                  type="date"
                  min={today}
                  value={values.event_date}
                  onChange={update("event_date")}
                  className={fieldClass}
                />
              </Field>
              <Field label="Număr de invitați" hint="(aproximativ)" htmlFor="cf-guests">
                <input
                  id="cf-guests"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={5000}
                  value={values.guests}
                  onChange={update("guests")}
                  className={fieldClass}
                />
              </Field>
              <Field label="Oraș sau locație" htmlFor="cf-location">
                <input
                  id="cf-location"
                  maxLength={200}
                  value={values.location}
                  onChange={update("location")}
                  className={fieldClass}
                />
              </Field>
              <Field label="Cum îți imaginezi evenimentul?" htmlFor="cf-message" className="sm:col-span-2">
                <textarea
                  id="cf-message"
                  rows={5}
                  maxLength={4000}
                  value={values.message}
                  onChange={update("message")}
                  className={`${fieldClass} resize-y`}
                />
              </Field>

              <div className="hidden" aria-hidden="true">
                <label htmlFor="cf-website">Website</label>
                <input id="cf-website" tabIndex={-1} autoComplete="off" value={values.website} onChange={update("website")} />
              </div>

              <label className="flex items-start gap-3 text-[0.9375rem] text-ink-soft sm:col-span-2">
                <input
                  type="checkbox"
                  required
                  checked={values.consent}
                  onChange={update("consent")}
                  className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-magenta)]"
                />
                <span>
                  Sunt de acord ca Steco Events să folosească aceste date doar ca să mă contacteze despre eveniment.
                  Detalii în{" "}
                  <Link to="/confidentialitate" className="text-ink underline">
                    politica de confidențialitate
                  </Link>
                  .
                </span>
              </label>

              {error && (
                <p className="border-l-2 border-magenta pl-4 text-[0.9375rem] text-magenta-deep sm:col-span-2" role="alert">
                  {error}
                </p>
              )}

              <div className="sm:col-span-2">
                <button type="submit" className="btn-primary" disabled={status === "sending"}>
                  {status === "sending" ? "Se trimite cererea..." : "Trimite cererea"}
                </button>
              </div>
            </form>
          )}
        </div>

        {(settings.phone || settings.email || settings.address || links.length > 0) && (
          <div className="lg:col-start-1 lg:row-start-2">
            <dl className="space-y-6 border-t border-line pt-8 lg:mt-12">
              {settings.phone && (
                <div>
                  <dt className="text-[0.9375rem] text-ink-soft">Telefon</dt>
                  <dd className="mt-1 text-[1.25rem] font-medium">
                    <a href={`tel:${settings.phone.replace(/\s+/g, "")}`} className="hover:text-magenta">
                      {settings.phone}
                    </a>
                  </dd>
                </div>
              )}
              {settings.email && (
                <div>
                  <dt className="text-[0.9375rem] text-ink-soft">Email</dt>
                  <dd className="mt-1 text-[1.25rem] font-medium">
                    <a href={`mailto:${settings.email}`} className="break-all hover:text-magenta">
                      {settings.email}
                    </a>
                  </dd>
                </div>
              )}
              {settings.address && (
                <div>
                  <dt className="text-[0.9375rem] text-ink-soft">Adresă</dt>
                  <dd className="mt-1 whitespace-pre-line">{settings.address}</dd>
                </div>
              )}
              {links.length > 0 && (
                <div>
                  <dt className="text-[0.9375rem] text-ink-soft">Ne găsești și pe</dt>
                  <dd className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                    {links.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="border-b border-ink/30 pb-0.5 hover:border-magenta hover:text-magenta"
                      >
                        {link.label}
                      </a>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </section>
  );
}
