import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Tot conținutul site-ului are câteva zeci de rânduri, așa că îl încărcăm o singură dată
// și îl împărțim între pagini: navigarea între ele nu mai așteaptă rețeaua.
let cached = null;
let pending = null;

function mapRow(row) {
  return {
    id: row.id,
    page_slug: row.page_slug,
    block_type: row.block_type,
    order_index: row.order_index ?? 0,
    data: row.content_json || row.block_data || {}
  };
}

function loadAllBlocks() {
  if (cached) return Promise.resolve(cached);
  if (!supabase) return Promise.resolve([]);

  if (!pending) {
    pending = supabase
      .from("steco_page_blocks")
      .select("*")
      .order("order_index", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error("[Steco] Eroare la încărcarea blocurilor:", error.message);
          pending = null;
          return [];
        }
        cached = (data || []).map(mapRow);
        return cached;
      })
      .catch((err) => {
        console.error("[Steco] Eroare neașteptată la încărcarea blocurilor:", err);
        pending = null;
        return [];
      });
  }

  return pending;
}

export function clearBlocksCache() {
  cached = null;
  pending = null;
}

export function useAllBlocks() {
  const [state, setState] = useState(() => ({ loading: !cached, blocks: cached || [] }));

  useEffect(() => {
    let isMounted = true;
    loadAllBlocks().then((blocks) => {
      if (isMounted) setState({ loading: false, blocks });
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}

export function blocksFor(blocks, slug) {
  return blocks.filter((block) => block.page_slug === slug);
}

// Pozele unei pagini, în ordinea blocurilor, pentru colajele din antete.
export function imagesFrom(blocks) {
  const urls = [];
  for (const block of blocks) {
    const data = block.data || {};
    if (block.block_type === "hero" && data.backgroundImageUrl) urls.push({ url: data.backgroundImageUrl, alt: "" });
    if (block.block_type === "text_photo" && data.imageUrl) urls.push({ url: data.imageUrl, alt: data.imageAlt || "" });
    if (block.block_type === "gallery") {
      for (const img of data.images || []) {
        if (img?.url && !String(img.url).startsWith("data:")) urls.push({ url: img.url, alt: "" });
      }
    }
  }
  return urls;
}

// Câte o poză din fiecare galerie, apoi restul: colajul arată varietatea evenimentelor.
export function spreadImages(blocks, count) {
  const galleries = blocks.filter((block) => block.block_type === "gallery").map((block) => imagesFrom([block]));
  const picked = [];
  for (let round = 0; picked.length < count && galleries.some((g) => g[round]); round += 1) {
    for (const gallery of galleries) {
      if (gallery[round] && picked.length < count) picked.push(gallery[round]);
    }
  }
  return picked;
}
