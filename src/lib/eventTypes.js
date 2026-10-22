// Tipurile de eveniment din formular, cu aceleași valori ca în constrângerea din baza de date.
// `match` recunoaște tipul după titlul unui serviciu sau al unei galerii („Organizare nuntă” → nunta).
export const EVENT_TYPES = [
  { value: "nunta", label: "Nuntă", match: /nunt/ },
  { value: "botez", label: "Botez", match: /botez/ },
  { value: "majorat", label: "Majorat", match: /majorat/ },
  { value: "aniversare", label: "Aniversare", match: /aniversar/ },
  { value: "gender_reveal", label: "Gender reveal", match: /gender/ },
  { value: "candy_bar", label: "Candy bar", match: /candy/ },
  { value: "altul", label: "Alt eveniment" }
];

function plain(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function eventTypeOf(title) {
  const text = plain(title);
  return EVENT_TYPES.find((type) => type.match?.test(text))?.value || "";
}

export function isEventType(value) {
  return EVENT_TYPES.some((type) => type.value === value);
}

// Ancora unui serviciu sau a unei galerii: tipul evenimentului, ca „Nuntă” din portofoliu și
// „Organizare nuntă” din servicii să ajungă la același #nunta. Altfel, titlul fără diacritice.
export function anchorFor(title) {
  return (
    eventTypeOf(title) ||
    plain(title)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}
