import { useState } from "react";
import { withSupabaseImageParams } from "../../lib/imageUtils";
import { DropZone, ImagePicker, SelectField, TextField, buttonClass } from "./ui";

export function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  // Coloana id din Supabase este uuid, așa că și varianta de rezervă generează un uuid v4.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const PAGES = [
  { slug: "home", label: "Prima pagină", path: "/" },
  { slug: "servicii", label: "Servicii", path: "/servicii" },
  { slug: "portofoliu", label: "Portofoliu", path: "/portofoliu" },
  { slug: "misiunea-noastra", label: "Despre noi", path: "/misiunea-noastra" },
  { slug: "participanti", label: "Participanți", path: "/participanti" },
  { slug: "contact", label: "Contact", path: "/contact" }
];

const LINK_OPTIONS = [
  ...PAGES.map((page) => ({ value: page.path, label: page.label })),
  { value: "__custom", label: "Alt link..." }
];

function excerpt(text, max = 70) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

function count(n, one, many) {
  return n === 1 ? `1 ${one}` : `${n} ${many}`;
}

function moveItem(list, from, to) {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export const SECTION_TYPES = {
  hero: {
    label: "Antet",
    description: "Titlul mare de sus al paginii, cu un text scurt și un buton.",
    empty: () => ({ title: "", subtitle: "", backgroundImageUrl: "", buttonLabel: "", buttonHref: "" }),
    summary: (data) => excerpt(data.title) || "Fără titlu"
  },
  text_photo: {
    label: "Text cu poză",
    description: "Un titlu și câteva paragrafe, cu o poză alături.",
    empty: () => ({ title: "", text: "", imageUrl: "", imageAlt: "", imagePosition: "right" }),
    summary: (data) => excerpt(data.title || data.text) || "Gol"
  },
  services_grid: {
    label: "Listă de servicii",
    description: "Serviciile voastre, fiecare cu nume și descriere.",
    empty: () => ({ heading: "", items: [] }),
    summary: (data) => `${data.heading || "Fără titlu"}, ${count((data.items || []).length, "serviciu", "servicii")}`
  },
  text_section: {
    label: "Text",
    description: "Un paragraf mare, centrat. Pus imediat după o galerie, apare lângă poze.",
    empty: () => ({ text: "" }),
    summary: (data) => excerpt(data.text) || "Gol"
  },
  gallery: {
    label: "Galerie foto",
    description: "Poze care se derulează orizontal, sub un titlu mare.",
    empty: () => ({ heading: "", images: [] }),
    summary: (data) => `${data.heading || "Fără titlu"}, ${count((data.images || []).length, "poză", "poze")}`
  },
  participants_grid: {
    label: "Participanți",
    description: "Fotografii rotunde cu numele oamenilor.",
    empty: () => ({ heading: "", participants: [] }),
    summary: (data) => `${data.heading || "Fără titlu"}, ${count((data.participants || []).length, "persoană", "persoane")}`
  }
};

function ListControls({ index, length, onMove, onRemove, removeLabel = "Scoate" }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" className={buttonClass.quiet} onClick={() => onMove(index, index - 1)} disabled={index === 0} aria-label="Mută mai sus">
        ↑
      </button>
      <button
        type="button"
        className={buttonClass.quiet}
        onClick={() => onMove(index, index + 1)}
        disabled={index === length - 1}
        aria-label="Mută mai jos"
      >
        ↓
      </button>
      <button type="button" className={buttonClass.danger} onClick={() => onRemove(index)}>
        {removeLabel}
      </button>
    </div>
  );
}

function HeroEditor({ data, set, upload }) {
  const href = data.buttonHref || "";
  const isCustom = href && !PAGES.some((page) => page.path === href);
  const [custom, setCustom] = useState(isCustom);

  return (
    <div className="grid gap-5">
      <TextField label="Titlu" value={data.title} onChange={(v) => set({ title: v })} />
      <TextField label="Text sub titlu" multiline rows={3} value={data.subtitle} onChange={(v) => set({ subtitle: v })} />
      <ImagePicker
        label="Poză"
        hint="Apare printre pozele care plutesc în jurul titlului."
        value={data.backgroundImageUrl}
        onChange={(v) => set({ backgroundImageUrl: v })}
        upload={upload}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Text buton"
          hint="Gol: pe prima pagină apare „Planifică evenimentul”, pe celelalte nu apare buton."
          value={data.buttonLabel}
          onChange={(v) => set({ buttonLabel: v })}
        />
        <div className="grid gap-3">
          <SelectField
            label="Butonul duce la"
            value={custom ? "__custom" : href || "/contact"}
            options={LINK_OPTIONS}
            onChange={(v) => {
              if (v === "__custom") {
                setCustom(true);
              } else {
                setCustom(false);
                set({ buttonHref: v });
              }
            }}
          />
          {custom && (
            <TextField label="Link" placeholder="https://..." value={href} onChange={(v) => set({ buttonHref: v })} />
          )}
        </div>
      </div>
    </div>
  );
}

function TextPhotoEditor({ data, set, upload }) {
  return (
    <div className="grid gap-5">
      <TextField label="Titlu" value={data.title} onChange={(v) => set({ title: v })} />
      <TextField
        label="Text"
        hint="Lasă un rând liber între paragrafe."
        multiline
        rows={6}
        value={data.text}
        onChange={(v) => set({ text: v })}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <ImagePicker label="Poză" value={data.imageUrl} onChange={(v) => set({ imageUrl: v })} upload={upload} />
        <SelectField
          label="Unde stă poza"
          value={data.imagePosition || "right"}
          onChange={(v) => set({ imagePosition: v })}
          options={[
            { value: "right", label: "În dreapta textului" },
            { value: "left", label: "În stânga textului" }
          ]}
        />
      </div>
    </div>
  );
}

function TextEditor({ data, set }) {
  return (
    <TextField
      label="Text"
      hint="Primul paragraf apare mare. Lasă un rând liber între paragrafe."
      multiline
      rows={6}
      value={data.text}
      onChange={(v) => set({ text: v })}
    />
  );
}

function ServicesEditor({ data, set }) {
  const items = data.items || [];
  const setItems = (next) => set({ items: next });

  return (
    <div className="grid gap-5">
      <TextField label="Titlul listei" placeholder="Ce organizăm" value={data.heading} onChange={(v) => set({ heading: v })} />
      <ol className="grid gap-3">
        {items.map((item, idx) => (
          <li key={item.id || idx} className="rounded-xl border border-line bg-paper/60 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[0.8125rem] font-medium text-ink-soft">Serviciul {idx + 1}</p>
              <ListControls
                index={idx}
                length={items.length}
                onMove={(from, to) => setItems(moveItem(items, from, to))}
                onRemove={(at) => setItems(items.filter((_, i) => i !== at))}
              />
            </div>
            <div className="grid gap-4">
              <TextField
                label="Nume"
                value={item.title}
                onChange={(v) => setItems(items.map((it, i) => (i === idx ? { ...it, title: v } : it)))}
              />
              <TextField
                label="Descriere"
                multiline
                rows={3}
                value={item.description}
                onChange={(v) => setItems(items.map((it, i) => (i === idx ? { ...it, description: v } : it)))}
              />
            </div>
          </li>
        ))}
      </ol>
      <div>
        <button type="button" className={buttonClass.secondary} onClick={() => setItems([...items, { id: newId(), title: "", description: "" }])}>
          + Adaugă un serviciu
        </button>
      </div>
    </div>
  );
}

function GalleryEditor({ data, set, upload }) {
  const images = data.images || [];
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");

  async function addFiles(files) {
    setError("");
    const added = [];
    const failed = [];
    for (let i = 0; i < files.length; i += 1) {
      setProgress({ done: i, total: files.length });
      try {
        added.push({ id: newId(), url: await upload(files[i]), alt: "" });
      } catch (err) {
        failed.push(`${files[i].name}: ${err.message}`);
      }
    }
    setProgress(null);
    // Funcțional: între timp s-ar fi putut schimba titlul sau ordinea pozelor.
    if (added.length) set((current) => ({ images: [...(current.images || []), ...added] }));
    if (failed.length) setError(failed.join(" "));
  }

  return (
    <div className="grid gap-5">
      <TextField label="Titlul galeriei" placeholder="Nuntă" value={data.heading} onChange={(v) => set({ heading: v })} />

      <div>
        <p className="mb-2 text-[0.875rem] font-medium text-ink">Poze</p>
        {images.length > 0 && (
          <ol className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((img, idx) => (
              <li key={img.id || img.url || idx} className="overflow-hidden rounded-xl border border-line bg-white">
                <div className="aspect-[4/3] bg-blush">
                  {img.url && (
                    <img src={withSupabaseImageParams(img.url, { width: 360 })} alt="" loading="lazy" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex items-center justify-between px-1.5 py-1">
                  <span className="pl-1.5 text-[0.8125rem] text-ink-soft">{idx + 1}</span>
                  <ListControls
                    index={idx}
                    length={images.length}
                    onMove={(from, to) => set({ images: moveItem(images, from, to) })}
                    onRemove={(at) => set({ images: images.filter((_, i) => i !== at) })}
                  />
                </div>
              </li>
            ))}
          </ol>
        )}
        <DropZone multiple onFiles={addFiles} busy={Boolean(progress)} className="px-4 py-7">
          <span className="text-[0.9375rem] font-medium text-ink">
            {progress ? `Se încarcă poza ${progress.done + 1} din ${progress.total}...` : "Adaugă poze"}
          </span>
          {!progress && (
            <span className="mt-1 text-[0.8125rem] text-ink-soft">Trage aici una sau mai multe poze, sau dă clic ca să le alegi.</span>
          )}
        </DropZone>
        {error && (
          <p className="mt-2 text-[0.8125rem] text-magenta-deep" role="alert">
            Unele poze nu s-au încărcat. {error}
          </p>
        )}
        <p className="mt-2 text-[0.8125rem] text-ink-soft">Prima poză apare și lângă titlul galeriei.</p>
      </div>
    </div>
  );
}

function ParticipantsEditor({ data, set, upload }) {
  const people = data.participants || [];
  const setPeople = (next) => set({ participants: next });

  return (
    <div className="grid gap-5">
      <TextField label="Titlul secțiunii" placeholder="Alături de noi" value={data.heading} onChange={(v) => set({ heading: v })} />
      <ol className="grid gap-3">
        {people.map((person, idx) => (
          <li key={person.id || idx} className="grid gap-4 rounded-xl border border-line bg-paper/60 p-4 sm:grid-cols-[auto_1fr] sm:items-start">
            <ImagePicker
              label="Fotografie"
              round
              value={person.photoUrl}
              upload={upload}
              onChange={(v) => setPeople(people.map((p, i) => (i === idx ? { ...p, photoUrl: v } : p)))}
            />
            <div className="grid gap-3">
              <TextField
                label="Nume"
                value={person.name}
                onChange={(v) => setPeople(people.map((p, i) => (i === idx ? { ...p, name: v } : p)))}
              />
              <ListControls
                index={idx}
                length={people.length}
                onMove={(from, to) => setPeople(moveItem(people, from, to))}
                onRemove={(at) => setPeople(people.filter((_, i) => i !== at))}
              />
            </div>
          </li>
        ))}
      </ol>
      <div>
        <button type="button" className={buttonClass.secondary} onClick={() => setPeople([...people, { id: newId(), name: "", photoUrl: "" }])}>
          + Adaugă o persoană
        </button>
      </div>
    </div>
  );
}

const EDITORS = {
  hero: HeroEditor,
  text_photo: TextPhotoEditor,
  text_section: TextEditor,
  services_grid: ServicesEditor,
  gallery: GalleryEditor,
  participants_grid: ParticipantsEditor
};

export function SectionEditor({ block, onChange, upload }) {
  const Editor = EDITORS[block.block_type];
  if (!Editor) return <p className="text-[0.9375rem] text-ink-soft">Tipul acesta de secțiune nu se poate edita aici.</p>;
  const set = (patch) =>
    onChange((current = {}) => ({ ...current, ...(typeof patch === "function" ? patch(current) : patch) }));
  return <Editor data={block.data || {}} set={set} upload={upload} />;
}
