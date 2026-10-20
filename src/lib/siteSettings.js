import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

let cached = null;
let pending = null;

function loadSettings() {
  if (cached) return Promise.resolve(cached);
  if (!supabase) return Promise.resolve({});

  if (!pending) {
    pending = supabase
      .from("steco_site_settings")
      .select("phone, email, address, instagram_url, facebook_url, tiktok_url")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error("[Steco] Eroare la încărcarea setărilor:", error.message);
          pending = null;
          return {};
        }
        cached = data || {};
        return cached;
      })
      .catch((err) => {
        console.error("[Steco] Eroare neașteptată la încărcarea setărilor:", err);
        pending = null;
        return {};
      });
  }

  return pending;
}

export function clearSiteSettingsCache() {
  cached = null;
  pending = null;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState(cached || {});

  useEffect(() => {
    let isMounted = true;
    loadSettings().then((data) => {
      if (isMounted) setSettings(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return settings;
}

export function socialLinks(settings) {
  return [
    { label: "Instagram", href: settings.instagram_url },
    { label: "Facebook", href: settings.facebook_url },
    { label: "TikTok", href: settings.tiktok_url }
  ].filter((link) => link.href);
}
