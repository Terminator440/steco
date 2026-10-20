// Trimite un email când cineva completează formularul de contact.
// O apelează triggerul steco_contact_requests_notify (vezi migrația contact_notifications).
//
// Secrete (Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY  obligatoriu; fără el funcția nu trimite nimic, cererea rămâne doar în admin
//   NOTIFY_EMAIL    opțional; implicit emailul din „Date de contact”
//   NOTIFY_FROM     opțional; implicit adresa de test Resend (merge doar spre emailul contului Resend)
//
// Nu cere autentificare: primește doar id-ul cererii, citește cererea din baza de date
// și trimite cel mult un email per cerere, numai pentru cereri din ultima oră.
import { createClient } from "jsr:@supabase/supabase-js@2";

const EVENT_LABELS: Record<string, string> = {
  nunta: "Nuntă",
  botez: "Botez",
  majorat: "Majorat",
  aniversare: "Aniversare",
  gender_reveal: "Gender reveal",
  candy_bar: "Candy bar",
  altul: "Alt eveniment"
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Doar POST" }, 405);

  const { id } = await req.json().catch(() => ({}));
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "id lipsă sau invalid" }, 400);

  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return json({ skipped: "RESEND_API_KEY nu este setat" });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Marcăm cererea ca notificată înainte de trimitere: două apeluri pentru același id nu trimit două emailuri.
  const { data: request, error } = await supabase
    .from("steco_contact_requests")
    .update({ notified_at: new Date().toISOString() })
    .eq("id", id)
    .is("notified_at", null)
    .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .select("*")
    .maybeSingle();

  if (error) return json({ error: error.message }, 500);
  if (!request) return json({ skipped: "cerere inexistentă, veche sau deja notificată" });

  let to = Deno.env.get("NOTIFY_EMAIL");
  if (!to) {
    const { data: settings } = await supabase.from("steco_site_settings").select("email").eq("id", 1).maybeSingle();
    to = settings?.email ?? undefined;
  }
  if (!to) {
    await supabase.from("steco_contact_requests").update({ notified_at: null }).eq("id", id);
    return json({ skipped: "nu există email de destinație" });
  }

  const eventLabel = EVENT_LABELS[request.event_type] ?? request.event_type;
  const rows: [string, string][] = [
    ["Eveniment", eventLabel],
    ["Data", formatDate(request.event_date)],
    ["Invitați", request.guests ? String(request.guests) : ""],
    ["Locație", request.location ?? ""],
    ["Email", request.email],
    ["Telefon", request.phone ?? ""]
  ].filter(([, value]) => value) as [string, string][];

  const html = `
    <div style="font-family:Arial,sans-serif;color:#2a1430;max-width:560px">
      <h2 style="margin:0 0 4px">Cerere nouă de la ${escapeHtml(request.name)}</h2>
      <p style="margin:0 0 16px;color:#6a5670">Trimisă din formularul de pe site. Răspunde direct la acest email ca să-i scrii.</p>
      <table style="border-collapse:collapse;width:100%">
        ${rows
          .map(
            ([label, value]) =>
              `<tr><td style="padding:6px 12px 6px 0;color:#6a5670;white-space:nowrap">${label}</td><td style="padding:6px 0">${escapeHtml(value)}</td></tr>`
          )
          .join("")}
      </table>
      ${request.message ? `<p style="margin:16px 0 0;padding:12px 14px;background:#f3ecee;border-radius:8px;white-space:pre-line">${escapeHtml(request.message)}</p>` : ""}
      <p style="margin:20px 0 0;color:#6a5670;font-size:13px">O găsești și în admin, la „Cereri de ofertă”.</p>
    </div>`;

  const text = [
    `Cerere nouă de la ${request.name}`,
    ...rows.map(([label, value]) => `${label}: ${value}`),
    request.message ? `\n${request.message}` : ""
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: Deno.env.get("NOTIFY_FROM") ?? "Steco site <onboarding@resend.dev>",
      to: [to],
      reply_to: request.email,
      subject: `Cerere nouă: ${eventLabel}, ${request.name}`,
      html,
      text
    })
  });

  if (!response.ok) {
    // Lăsăm cererea nenotificată, ca să se vadă în loguri că trimiterea a eșuat.
    await supabase.from("steco_contact_requests").update({ notified_at: null }).eq("id", id);
    return json({ error: `Resend a răspuns ${response.status}: ${await response.text()}` }, 502);
  }

  return json({ sent: true });
});
