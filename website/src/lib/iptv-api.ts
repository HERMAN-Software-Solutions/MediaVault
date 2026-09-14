const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://mediavault-o52i.onrender.com";

export interface IPTVChannel {
  id: string;
  name: string;
  country: string;
  categories: string[];
  logo: string;
  website?: string;
}

export async function getIPTVChannels(country = "", category = "") {
  const params = new URLSearchParams();
  if (country) params.set("country", country);
  if (category) params.set("category", category);

  const res = await fetch(`${API_BASE}/api/iptv/channels?${params}`);
  return res.json();
}

export async function getIPTVStreams() {
  const res = await fetch(`${API_BASE}/api/iptv/streams`);
  return res.json();
}

export async function getIPTVCategories() {
  const res = await fetch(`${API_BASE}/api/iptv/categories`);
  return res.json();
}