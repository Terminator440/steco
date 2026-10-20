// Micșorează pozele înainte de încărcare: planul gratuit Supabase nu le redimensionează,
// iar o poză de telefon trimisă direct ar încărca pagina de câteva ori mai greu.
const MAX_SIDE = 2000;
const QUALITY = 0.82;
// Formatele acceptate de bucket-ul steco-images (vezi migrația); restul se convertesc în WEBP.
const STORABLE = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function compressImage(file) {
  // GIF-urile pot fi animate; le lăsăm cum sunt.
  if (file.type === "image/gif") return file;

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Poza nu poate fi citită. Folosește JPG, PNG sau WEBP (pozele HEIC de pe iPhone se deschid doar din Safari).");
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", QUALITY));
  // Unele browsere vechi nu știu WEBP; atunci păstrăm fișierul original.
  if (!blob || blob.type !== "image/webp") return file;
  if (blob.size >= file.size && scale === 1 && STORABLE.includes(file.type)) return file;

  const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
  return new File([blob], name, { type: "image/webp" });
}
