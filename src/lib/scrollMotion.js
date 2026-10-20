// Pornește mișcarea legată de scroll (vezi comentariul din index.css).
// Unde browserul are animation-timeline, CSS-ul face totul și scriptul doar pune clasa .motion.
// Altfel, scriptul calculează aceleași efecte: citește scrollY o dată pe cadru, folosește poziții
// măsurate dinainte (fără citiri de layout în timpul scroll-ului) și scrie doar transform/opacity.

// În dezvoltare, ?motion-js forțează varianta din script, ca să poată fi testată și în Chrome.
const FORCE_JS = import.meta.env.DEV && new URLSearchParams(window.location.search).has("motion-js");
const CSS_TIMELINES = !FORCE_JS && typeof CSS !== "undefined" && CSS.supports?.("animation-timeline: view()");

const clamp01 = (value) => (value < 0 ? 0 : value > 1 ? 1 : value);

function docTop(el) {
  let top = 0;
  for (let node = el; node; node = node.offsetParent) top += node.offsetTop;
  return top;
}

function shiftPx(el, vh) {
  const raw = getComputedStyle(el).getPropertyValue("--shift").trim() || "-18vh";
  const value = parseFloat(raw);
  return raw.endsWith("vh") ? (value * vh) / 100 : value;
}

function startFallback() {
  const root = document.documentElement;
  root.classList.add("motion-js");

  let items = [];
  let frame = 0;
  let needsMeasure = true;

  const measure = () => {
    const vh = window.innerHeight;
    items = [];
    for (const el of document.querySelectorAll(".parallax, .drift, .reveal, .manifest")) {
      const kind = el.classList.contains("manifest")
        ? "manifest"
        : el.classList.contains("parallax")
          ? "parallax"
          : el.classList.contains("drift")
            ? "drift"
            : "reveal";
      const item = { el, kind, top: docTop(el), h: el.offsetHeight, shift: shiftPx(el, vh) };
      if (kind === "manifest") {
        item.night = el.querySelector(".manifest-night");
        item.photo = el.querySelector(".manifest-photo");
        item.text = el.querySelector(".manifest-text");
        item.photoH = item.photo?.offsetHeight || 0;
      }
      items.push(item);
    }
    needsMeasure = false;
  };

  const update = () => {
    frame = 0;
    if (needsMeasure) measure();

    const y = window.scrollY;
    const vh = window.innerHeight;

    for (const item of items) {
      const { el, kind, top, h } = item;
      // Elementele departe de ecran nu se ating.
      if (kind !== "parallax" && (top > y + vh * 1.5 || top + h < y - vh * 0.5)) continue;

      if (kind === "parallax") {
        const p = clamp01(y / (vh * 1.1));
        el.style.transform = `translate3d(0, ${(p * item.shift).toFixed(1)}px, 0)`;
      } else if (kind === "drift") {
        const p = clamp01((y + vh - top) / (vh + h));
        el.style.transform = `translate3d(0, ${(item.shift * (p - 0.5)).toFixed(1)}px, 0)`;
      } else if (kind === "reveal") {
        const p = clamp01((y + vh - top) / (Math.min(h, vh) * 0.7));
        el.style.opacity = p.toFixed(3);
        el.style.transform = p >= 1 ? "" : `translate3d(0, ${((1 - p) * 40).toFixed(1)}px, 0)`;
      } else {
        const p = clamp01((y - top) / Math.max(1, h - vh));
        if (item.night) item.night.style.opacity = clamp01(p / 0.3).toFixed(3);
        if (item.text) item.text.style.opacity = (1 - 0.65 * clamp01((p - 0.45) / 0.35)).toFixed(3);
        if (item.photo) {
          const q = clamp01((p - 0.15) / 0.5);
          const from = item.photoH * 1.05;
          const to = -0.12 * vh;
          item.photo.style.transform = `translate3d(0, ${(from + (to - from) * q).toFixed(1)}px, 0)`;
        }
      }
    }
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  const remeasure = () => {
    needsMeasure = true;
    schedule();
  };

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", remeasure);
  window.addEventListener("load", remeasure);

  // Conținutul și pozele vin după încărcarea paginii: măsurăm din nou când se schimbă ceva.
  const target = document.getElementById("root") || document.body;
  new MutationObserver(remeasure).observe(target, { childList: true, subtree: true });
  if (typeof ResizeObserver !== "undefined") new ResizeObserver(remeasure).observe(document.body);

  // Benzile orizontale de poze: bara de progres urmează scroll-ul benzii.
  document.addEventListener(
    "scroll",
    (event) => {
      const strip = event.target;
      if (!(strip instanceof Element) || !strip.hasAttribute("data-strip")) return;
      const bar = strip.closest("section")?.querySelector("[data-strip-bar]");
      if (!bar) return;
      const max = strip.scrollWidth - strip.clientWidth;
      const p = max > 0 ? strip.scrollLeft / max : 0;
      bar.style.transform = `scaleX(${(0.08 + 0.92 * p).toFixed(3)})`;
    },
    { capture: true, passive: true }
  );

  remeasure();
  if (FORCE_JS) window.__stecoMotion = { update, remeasure };
}

export function initScrollMotion() {
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  let fallbackStarted = false;

  const apply = () => {
    root.classList.toggle("motion", !reduce.matches);
    if (!reduce.matches && !CSS_TIMELINES && !fallbackStarted) {
      fallbackStarted = true;
      startFallback();
    }
  };

  apply();
  reduce.addEventListener?.("change", apply);
}
