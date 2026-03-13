const SUPABASE_PUBLIC_PATH_FRAGMENT = "/storage/v1/object/public/";

export function withSupabaseImageParams(url, options = {}) {
  if (!url || typeof url !== "string") return "";
  if (!/^https?:\/\//.test(url)) return url;

  const { width, height, quality = 80 } = options;

  try {
    const parsedUrl = new URL(url);
    if (!parsedUrl.pathname.includes(SUPABASE_PUBLIC_PATH_FRAGMENT)) {
      return url;
    }

    if (width) parsedUrl.searchParams.set("width", String(width));
    if (height) parsedUrl.searchParams.set("height", String(height));
    if (quality) parsedUrl.searchParams.set("quality", String(quality));

    return parsedUrl.toString();
  } catch {
    return url;
  }
}
