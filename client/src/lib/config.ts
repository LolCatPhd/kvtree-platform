export const API_URL = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "";
  if (!raw) return "";
  // If the value already includes a scheme, return as-is
  if (/^https?:\/\//i.test(raw)) return raw;
  // Otherwise assume https and prepend it
  return `https://${raw}`;
})();

export function apiPath(path = "") {
  if (!API_URL) return path;
  // ensure single slash
  return `${API_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}
