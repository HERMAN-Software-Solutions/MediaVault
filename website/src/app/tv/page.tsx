import type { Metadata } from "next";
import { Layout } from "@/components/layout/Layout";
import { LiveTVClient } from "./LiveTVClient";

export const metadata: Metadata = {
  title: "Live TV — Free Streaming Channels | MediaVault",
  description: "Watch free live TV channels from around the world. Sports, news, music, movies, and more. No registration required.",
  keywords: ["live tv", "free tv", "streaming", "live channels", "sports tv", "news live"],
  openGraph: {
    title: "MediaVault Live TV",
    description: "Watch free live TV channels from around the world.",
  },
};

export default function TVPage() {
  return (
    <Layout>
      <LiveTVClient />
    </Layout>
  );
}