import { useEffect } from "react";

const SITE_URL = "https://hiddenpropertyintel.com";
const SITE_NAME = "Hidden Property Intel";
const DEFAULT_IMAGE =
  "https://base44.app/api/apps/6a8ba268665196e93b7d57f7/files/mp/public/6a8ba268665196e93b7d57f7/42dfc033a_og-image.png";

function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/**
 * Reusable SEO component — injects dynamic meta tags + JSON-LD structured data.
 * Cleans up its own JSON-LD on unmount so page-specific schemas never leak
 * across routes. Static schemas in index.html (Organization, WebSite, etc.)
 * are untouched.
 */
export default function Seo({ title, description, keywords, path = "", jsonLd = [], image }) {
  useEffect(() => {
    const fullUrl = `${SITE_URL}${path}`;
    const fullTitle = title
      ? `${title} | ${SITE_NAME}`
      : `${SITE_NAME} — Find What Others Miss | Distressed Property & Off-Market Real Estate Intelligence`;
    const img = image || DEFAULT_IMAGE;

    document.title = fullTitle;
    upsertMeta("name", "description", description);
    if (keywords) upsertMeta("name", "keywords", keywords);
    upsertLink("canonical", fullUrl);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", fullUrl);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:image", img);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", img);

    const schemas = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
    schemas.forEach((schema, i) => setJsonLd(`seo-jsonld-${i}`, schema));

    // Remove leftover JSON-LD slots from a previous render
    const existing = document.querySelectorAll('[id^="seo-jsonld-"]');
    for (let i = schemas.length; i < existing.length; i++) {
      existing[i].remove();
    }

    return () => {
      document.querySelectorAll('[id^="seo-jsonld-"]').forEach((el) => el.remove());
    };
  }, [title, description, keywords, path, image, JSON.stringify(jsonLd)]);

  return null;
}

export { SITE_URL };