import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { ContactRequestsPanel, SiteSettingsPanel } from "./AdminPanels";
import { PageEditor } from "./admin/PageEditor";
import { Notice, buttonClass, inputClass } from "./admin/ui";

const TABS = [
  { id: "pagini", label: "Pagini" },
  { id: "cereri", label: "Cereri de ofertă" },
  { id: "setari", label: "Date de contact" }
];

function Wordmark() {
  return <span className="font-display text-[1.25rem] tracking-[0.3em]">STECO</span>;
}

function LoginScreen({ session, onLogout }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSigningIn(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setSigningIn(false);
    if (signInError) {
      setError("Email sau parolă greșită. Verifică și încearcă din nou.");
      return;
    }
    setPassword("");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Wordmark />
          <h1 className="mt-4 text-[1.375rem] font-semibold">Administrare site</h1>
          <p className="mt-1 text-[0.9375rem] text-ink-soft">Intră cu emailul și parola contului de admin.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-line bg-white p-6">
          <div>
            <label htmlFor="admin-email" className="mb-1.5 block text-[0.875rem] font-medium">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="mb-1.5 block text-[0.875rem] font-medium">
              Parolă
            </label>
            <input
              id="admin-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </div>

          {error && <Notice type="error">{error}</Notice>}
          {session && <Notice type="error">Contul {session.user.email} nu are drept de administrare.</Notice>}

          <button type="submit" disabled={signingIn} className={`${buttonClass.primary} w-full`}>
            {signingIn ? "Se verifică..." : "Intră în cont"}
          </button>
          {session && (
            <button type="button" onClick={onLogout} className={buttonClass.quiet}>
              Ieși din contul {session.user.email}
            </button>
          )}
        </form>

        <p className="mt-6 text-center text-[0.875rem]">
          <Link to="/" className="text-ink-soft underline hover:text-ink">
            Înapoi la site
          </Link>
        </p>
      </div>
    </main>
  );
}

export function AdminPage() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState("pagini");
  const [newRequests, setNewRequests] = useState(0);

  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return undefined;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setChecking(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !session) {
      setIsAdmin(false);
      return undefined;
    }
    let active = true;
    setChecking(true);
    // RLS lasă fiecare utilizator să-și vadă doar propriul rând din steco_admins.
    supabase
      .from("steco_admins")
      .select("user_id")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setIsAdmin(Boolean(data));
        setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [session]);

  const refreshCount = useCallback(async () => {
    const { count } = await supabase
      .from("steco_contact_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "nou");
    setNewRequests(count || 0);
  }, []);

  useEffect(() => {
    if (isAdmin) refreshCount();
  }, [isAdmin, refreshCount, tab]);

  async function logout() {
    await supabase?.auth.signOut();
    setSession(null);
    setIsAdmin(false);
  }

  if (!supabase) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-4">
        <Notice type="error">Site-ul nu e legat la Supabase. Verifică variabilele VITE_SUPABASE_URL și VITE_SUPABASE_ANON_KEY.</Notice>
      </main>
    );
  }

  if (checking) {
    return <main className="flex min-h-screen items-center justify-center bg-paper text-ink-soft">Se verifică sesiunea...</main>;
  }

  if (!session || !isAdmin) {
    return <LoginScreen session={session} onLogout={logout} />;
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-baseline gap-3" title="Deschide site-ul">
            <Wordmark />
            <span className="text-[0.875rem] text-ink-soft">admin</span>
          </Link>

          <nav aria-label="Secțiuni administrare" className="no-scrollbar order-3 -mx-1 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? "page" : undefined}
                className={[
                  "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[0.9375rem] transition-colors",
                  tab === t.id ? "bg-plum text-cream" : "text-ink hover:bg-blush/60"
                ].join(" ")}
              >
                {t.label}
                {t.id === "cereri" && newRequests > 0 && (
                  <span className="rounded-full bg-magenta px-2 py-0.5 text-[0.75rem] font-semibold text-cream">{newRequests}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-[0.875rem] text-ink-soft md:inline">{session.user.email}</span>
            <button type="button" onClick={logout} className={buttonClass.quiet}>
              Ieși
            </button>
          </div>
        </div>
      </header>

      <main className="pt-8">
        {/* Editorul rămâne montat: modificările nepublicate nu se pierd când treci pe alt tab. */}
        <div hidden={tab !== "pagini"}>
          <PageEditor />
        </div>
        {tab === "cereri" && <ContactRequestsPanel onChange={refreshCount} />}
        {tab === "setari" && <SiteSettingsPanel />}
      </main>
    </div>
  );
}
