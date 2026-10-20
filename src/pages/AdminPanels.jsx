import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { clearSiteSettingsCache } from "../lib/siteSettings";

const EVENT_LABELS = {
  nunta: "Nuntă",
  botez: "Botez",
  majorat: "Majorat",
  corporate: "Corporate",
  altul: "Alt eveniment"
};

const STATUS_OPTIONS = [
  { value: "nou", label: "Nouă" },
  { value: "in_lucru", label: "În lucru" },
  { value: "finalizat", label: "Finalizată" }
];

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30";

function formatDate(value, withTime = false) {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleString("ro-RO", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" });
}

export function ContactRequestsPanel() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("deschise");

  useEffect(() => {
    let isMounted = true;

    supabase
      .from("steco_contact_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data, error: loadError }) => {
        if (!isMounted) return;
        if (loadError) {
          setError("Cererile nu s-au încărcat: " + loadError.message);
        } else {
          setRequests(data || []);
        }
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function changeStatus(id, status) {
    const previous = requests;
    setRequests((prev) => prev.map((req) => (req.id === id ? { ...req, status } : req)));

    const { error: updateError } = await supabase.from("steco_contact_requests").update({ status }).eq("id", id);
    if (updateError) {
      setRequests(previous);
      setError("Statusul nu s-a salvat: " + updateError.message);
    }
  }

  const visible = requests.filter((req) => (filter === "deschise" ? req.status !== "finalizat" : true));
  const newCount = requests.filter((req) => req.status === "nou").length;

  return (
    <section className="mx-auto max-w-6xl rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Cereri de ofertă</h2>
          <p className="text-sm text-slate-400">
            {newCount === 1 ? "O cerere nouă" : `${newCount} cereri noi`} din formularul de pe pagina Contact.
          </p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className={`${inputClass} w-auto`}>
          <option value="deschise">Doar cele nefinalizate</option>
          <option value="toate">Toate cererile</option>
        </select>
      </div>

      {error && <p className="mb-4 rounded-md border border-red-500/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-300">Se încarcă cererile...</p>
      ) : !visible.length ? (
        <p className="text-sm text-slate-300">
          Nu există cereri {filter === "deschise" ? "nefinalizate" : ""}. Cele noi apar aici imediat ce un vizitator
          trimite formularul.
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((req) => (
            <li key={req.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-50">
                    {req.name}
                    <span className="ml-2 text-sm font-normal text-slate-400">{EVENT_LABELS[req.event_type]}</span>
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    <a href={`mailto:${req.email}`} className="underline hover:text-rose-300">
                      {req.email}
                    </a>
                    {req.phone && (
                      <>
                        {", "}
                        <a href={`tel:${req.phone.replace(/\s+/g, "")}`} className="underline hover:text-rose-300">
                          {req.phone}
                        </a>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">Primită {formatDate(req.created_at, true)}</span>
                  <select
                    value={req.status}
                    onChange={(e) => changeStatus(req.id, e.target.value)}
                    aria-label={`Status pentru cererea lui ${req.name}`}
                    className={`${inputClass} w-auto py-1.5`}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm text-slate-300 sm:grid-cols-3">
                {req.event_date && (
                  <div>
                    <dt className="inline text-slate-500">Data: </dt>
                    <dd className="inline">{formatDate(req.event_date)}</dd>
                  </div>
                )}
                {req.guests && (
                  <div>
                    <dt className="inline text-slate-500">Invitați: </dt>
                    <dd className="inline">{req.guests}</dd>
                  </div>
                )}
                {req.location && (
                  <div>
                    <dt className="inline text-slate-500">Locație: </dt>
                    <dd className="inline">{req.location}</dd>
                  </div>
                )}
              </dl>

              {req.message && <p className="mt-3 whitespace-pre-line text-sm text-slate-200">{req.message}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const SETTINGS_FIELDS = [
  { key: "phone", label: "Telefon", type: "tel", placeholder: "07xx xxx xxx" },
  { key: "email", label: "Email", type: "email", placeholder: "contact@exemplu.ro" },
  { key: "address", label: "Adresă", type: "textarea", placeholder: "Oraș, stradă" },
  { key: "instagram_url", label: "Instagram", type: "url", placeholder: "https://instagram.com/..." },
  { key: "facebook_url", label: "Facebook", type: "url", placeholder: "https://facebook.com/..." },
  { key: "tiktok_url", label: "TikTok", type: "url", placeholder: "https://tiktok.com/@..." }
];

export function SiteSettingsPanel() {
  const [values, setValues] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    supabase
      .from("steco_site_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setMessage({ type: "error", text: "Setările nu s-au încărcat: " + error.message });
        setValues(data || {});
      });
  }, []);

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    const payload = Object.fromEntries(
      SETTINGS_FIELDS.map(({ key }) => [key, (values[key] || "").trim() || null])
    );

    const { error } = await supabase.from("steco_site_settings").update(payload).eq("id", 1);
    setSaving(false);

    if (error) {
      setMessage({
        type: "error",
        text: "Datele nu s-au salvat. Linkurile trebuie să înceapă cu https://. Detalii: " + error.message
      });
      return;
    }

    clearSiteSettingsCache();
    setMessage({ type: "success", text: "Datele de contact au fost salvate. Apar pe site la următoarea încărcare." });
  }

  if (!values) {
    return (
      <section className="mx-auto max-w-6xl rounded-2xl border border-slate-800 bg-slate-900/80 p-5 text-sm text-slate-300 sm:p-6">
        Se încarcă datele de contact...
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-50">Date de contact</h2>
      <p className="mb-5 text-sm text-slate-400">
        Apar în subsolul site-ului și lângă formularul de contact. Câmpurile goale nu se afișează.
      </p>

      <form onSubmit={handleSave} className="grid max-w-3xl gap-4 sm:grid-cols-2">
        {SETTINGS_FIELDS.map((field) => (
          <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
            <label htmlFor={`setting-${field.key}`} className="mb-1.5 block text-xs font-medium text-slate-300">
              {field.label}
            </label>
            {field.type === "textarea" ? (
              <textarea
                id={`setting-${field.key}`}
                rows={2}
                value={values[field.key] || ""}
                placeholder={field.placeholder}
                onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                className={inputClass}
              />
            ) : (
              <input
                id={`setting-${field.key}`}
                type={field.type}
                value={values[field.key] || ""}
                placeholder={field.placeholder}
                pattern={field.type === "url" ? "https://.*" : undefined}
                onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                className={inputClass}
              />
            )}
          </div>
        ))}

        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Se salvează..." : "Salvează datele de contact"}
          </button>
          {message.text && (
            <p className={message.type === "error" ? "text-sm text-red-300" : "text-sm text-emerald-300"}>{message.text}</p>
          )}
        </div>
      </form>
    </section>
  );
}
