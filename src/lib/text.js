// Emoji-urile din textele din admin arată bine în paragrafe, dar nu în titlurile cu majuscule.
export function withoutEmoji(text) {
  return String(text || "")
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
