import { useId, useRef, useState } from "react";
import { withSupabaseImageParams } from "../../lib/imageUtils";

export const inputClass =
  "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[0.9375rem] text-ink placeholder:text-ink-soft/50 transition-colors focus:border-plum focus:outline-none focus:ring-2 focus:ring-plum/15";

export const buttonClass = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-full bg-plum px-5 py-2.5 text-[0.9375rem] font-medium text-cream transition-colors hover:bg-night disabled:opacity-60",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-[0.875rem] font-medium text-ink transition-colors hover:border-ink/40 disabled:opacity-50",
  quiet:
    "inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[0.875rem] font-medium text-ink-soft transition-colors hover:bg-blush/60 hover:text-ink disabled:opacity-40",
  danger:
    "inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[0.875rem] font-medium text-magenta-deep transition-colors hover:bg-magenta/10 disabled:opacity-40"
};

export function TextField({ label, hint, value, onChange, multiline = false, rows = 4, placeholder }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[0.875rem] font-medium text-ink">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          rows={rows}
          value={value || ""}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass} resize-y leading-relaxed`}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value || ""}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
      )}
      {hint && <p className="mt-1.5 text-[0.8125rem] text-ink-soft">{hint}</p>}
    </div>
  );
}

export function SelectField({ label, hint, value, onChange, options }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[0.875rem] font-medium text-ink">
        {label}
      </label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && <p className="mt-1.5 text-[0.8125rem] text-ink-soft">{hint}</p>}
    </div>
  );
}

// Zonă în care tragi pozele sau dai clic ca să le alegi.
export function DropZone({ multiple = false, onFiles, busy, children, className = "" }) {
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !busy && inputRef.current?.click()}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && !busy) {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        const files = [...(event.dataTransfer?.files || [])];
        if (files.length && !busy) onFiles(multiple ? files : files.slice(0, 1));
      }}
      className={[
        "relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition-colors",
        over ? "border-plum bg-plum/5" : "border-line bg-white hover:border-ink/30",
        busy ? "cursor-wait opacity-70" : "",
        className
      ].join(" ")}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        multiple={multiple}
        className="hidden"
        onChange={(event) => {
          const files = [...(event.target.files || [])];
          event.target.value = "";
          if (files.length) onFiles(files);
        }}
      />
      {children}
    </div>
  );
}

export function ImagePicker({ label, hint, value, onChange, upload, round = false }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles([file]) {
    setError("");
    setBusy(true);
    try {
      onChange(await upload(file));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="mb-1.5 text-[0.875rem] font-medium text-ink">{label}</p>
      <div className="flex flex-wrap items-center gap-4">
        <DropZone
          onFiles={handleFiles}
          busy={busy}
          className={round ? "h-24 w-24 overflow-hidden rounded-full" : "h-28 w-40 overflow-hidden"}
        >
          {value ? (
            <img
              src={withSupabaseImageParams(value, { width: 320 })}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <span className="px-3 text-[0.8125rem] text-ink-soft">{busy ? "Se încarcă..." : "Alege sau trage o poză"}</span>
          )}
          {busy && value && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-[0.8125rem]">Se încarcă...</span>
          )}
        </DropZone>
        {value && !busy && (
          <button type="button" onClick={() => onChange("")} className={buttonClass.danger}>
            Scoate poza
          </button>
        )}
      </div>
      {hint && <p className="mt-1.5 text-[0.8125rem] text-ink-soft">{hint}</p>}
      {error && (
        <p className="mt-1.5 text-[0.8125rem] text-magenta-deep" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Notice({ type = "info", children, onClose }) {
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    error: "border-magenta/30 bg-magenta/5 text-magenta-deep",
    info: "border-line bg-white text-ink"
  };
  return (
    <div role={type === "error" ? "alert" : "status"} className={`flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-[0.9375rem] ${styles[type]}`}>
      <p>{children}</p>
      {onClose && (
        <button type="button" onClick={onClose} className="shrink-0 text-[0.8125rem] underline">
          Închide
        </button>
      )}
    </div>
  );
}
