const SUPABASE_PUBLIC_PATH_FRAGMENT = "/storage/v1/object/public/";

// Planul gratuit Supabase nu micșorează pozele, așa că pe site le micșorează Vercel
// (/_vercel/image, configurat în vercel.json la „images”). Lățimea și calitatea cerute
// trebuie să fie din listele de acolo, altfel Vercel răspunde cu eroare.
const VERCEL_IMAGES = import.meta.env.PROD;
const VERCEL_SIZES = [256, 384, 640, 828, 1080, 1200, 1920];
const VERCEL_QUALITIES = [75, 80, 85];

export function isSupabasePublicImage(url) {
  if (!url || typeof url !== "string") return false;
  if (!/^https?:\/\//.test(url)) return false;

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname.includes(SUPABASE_PUBLIC_PATH_FRAGMENT);
  } catch {
    return false;
  }
}

function closestAtLeast(list, value) {
  return list.find((item) => item >= value) || list[list.length - 1];
}

// Păstrează numele vechi: componentele cer o lățime, iar pe site primesc poza micșorată de Vercel.
// Local (vite dev) poza rămâne cea originală.
export function withSupabaseImageParams(url, options = {}) {
  if (!url || typeof url !== "string") return "";
  if (!VERCEL_IMAGES || !isSupabasePublicImage(url)) return url;

  const { width = 1080, quality = 80 } = options;
  const params = new URLSearchParams({
    url,
    w: String(closestAtLeast(VERCEL_SIZES, width)),
    q: String(closestAtLeast(VERCEL_QUALITIES, quality))
  });
  return `/_vercel/image?${params}`;
}

// Dacă Vercel nu poate micșora o poză (de exemplu limita lunară a planului gratuit e atinsă),
// imaginea cade pe originalul din Supabase în loc să rămână goală.
export function fallbackToOriginalImages() {
  document.addEventListener(
    "error",
    (event) => {
      const img = event.target;
      if (!(img instanceof HTMLImageElement) || !img.src.includes("/_vercel/image")) return;
      const original = new URL(img.src).searchParams.get("url");
      if (original) img.src = original;
    },
    true
  );
}
