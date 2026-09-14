"use client";

import { useState, useEffect, useRef } from "react";
import { getIPTVChannels, getIPTVStreams, type IPTVChannel } from "@/lib/iptv-api";

const CATEGORIES = [
  { id: "all", label: "All Channels" },
  { id: "sports", label: "Sports" },
  { id: "news", label: "News" },
  { id: "music", label: "Music" },
  { id: "movies", label: "Movies" },
  { id: "entertainment", label: "Entertainment" },
  { id: "documentary", label: "Documentary" },
  { id: "kids", label: "Kids" },
];

export function LiveTVClient() {
  const [channels, setChannels] = useState<IPTVChannel[]>([]);
  const [streams, setStreams] = useState<Record<string, any>>({});
  const [selectedChannel, setSelectedChannel] = useState<IPTVChannel | null>(null);
  const [selectedStreamUrl, setSelectedStreamUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load channels and streams on mount
  useEffect(() => {
    Promise.all([getIPTVChannels(), getIPTVStreams()])
      .then(([channelsRes, streamsRes]) => {
        if (channelsRes.success) {
          setChannels(channelsRes.data || []);
        }
        if (streamsRes.success) {
          setStreams(streamsRes.data || {});
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Filter channels
  const filteredChannels = channels.filter((c) => {
    // Category filter
    if (activeCategory !== "all") {
      const cats = c.categories.map((x) => x.toLowerCase());
      if (!cats.includes(activeCategory.toLowerCase())) return false;
    }
    // Search filter
    if (searchQuery) {
      if (!c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    }
    // Must have a stream
    if (!streams[c.id]) return false;
    return true;
  });

  const playChannel = (channel: IPTVChannel) => {
    const stream = streams[channel.id];
    if (!stream?.url) return;
    setSelectedChannel(channel);
    setSelectedStreamUrl(stream.url);

    // Auto-play when video element mounts
    setTimeout(() => {
      videoRef.current?.play().catch(() => {});
    }, 100);
  };

  return (
    <>
      {/* Hero */}
      <section className="py-12 bg-navy text-white">
        <div className="container-site text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Live TV</h1>
          <p className="text-gray-medium max-w-2xl mx-auto">
            Watch free live TV channels from around the world — sports, news, music, movies, and more.
          </p>
        </div>
      </section>

      {/* Player */}
      {selectedChannel && (
        <section className="bg-black">
          <div className="container-site py-6">
            <div className="aspect-video bg-black rounded-xl overflow-hidden">
              <video
                ref={videoRef}
                src={selectedStreamUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full"
              />
            </div>
            <div className="mt-4 flex items-center gap-3">
              {selectedChannel.logo && (
                <img
                  src={selectedChannel.logo}
                  alt={selectedChannel.name}
                  className="h-10 w-10 object-contain bg-white rounded p-1"
                />
              )}
              <div>
                <h2 className="text-white font-semibold">{selectedChannel.name}</h2>
                <p className="text-xs text-gray-medium">{selectedChannel.country}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedChannel(null);
                  setSelectedStreamUrl("");
                }}
                className="ml-auto text-sm text-gray-medium hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Filters */}
      <section className="py-6 bg-white dark:bg-navy-dark border-b border-gray-light dark:border-navy-light sticky top-16 z-20">
        <div className="container-site">
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-md rounded-full border border-gray-light bg-white px-5 py-3 text-sm text-charcoal placeholder:text-gray-medium focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal dark:bg-navy dark:text-white dark:border-navy-light"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? "bg-teal text-white"
                    : "bg-gray-light dark:bg-navy text-charcoal dark:text-gray-light hover:bg-gray-medium/20"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Channels Grid */}
      <section className="py-8">
        <div className="container-site">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="card-base p-4 text-center animate-pulse">
                  <div className="h-16 w-16 rounded-full bg-gray-light mx-auto mb-2" />
                  <div className="h-3 w-2/3 rounded bg-gray-light mx-auto" />
                </div>
              ))}
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-medium">No channels found. Try a different category.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-medium mb-4">
                {filteredChannels.length} channel{filteredChannels.length === 1 ? "" : "s"} available
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredChannels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => playChannel(channel)}
                    className="card-base p-4 text-center hover:shadow-cardHover hover:-translate-y-1 transition-all"
                  >
                    <div className="h-16 w-16 rounded-lg overflow-hidden mx-auto mb-2 bg-white flex items-center justify-center p-1">
                      <img
                        src={channel.logo}
                        alt={channel.name}
                        className="max-h-full max-w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="text-xs font-semibold text-navy dark:text-white line-clamp-2 mb-1">
                      {channel.name}
                    </div>
                    <div className="text-[10px] text-gray-medium">{channel.country}</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}