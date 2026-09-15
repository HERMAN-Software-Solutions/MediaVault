"use client";

import { useState, useEffect, useRef } from "react";
import { getIPTVChannels, type IPTVChannel } from "@/lib/iptv-api";

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
  const [streamError, setStreamError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);

  // Load channels on mount
  useEffect(() => {
    getIPTVChannels()
      .then((res) => {
        if (res.success) {
          setChannels(res.data || []);
          // Build streams map from channel data
          const streamsMap: Record<string, any> = {};
          (res.data || []).forEach((c: any) => {
            if (c.streamUrl) {
              streamsMap[c.id] = { url: c.streamUrl };
            }
          });
          setStreams(streamsMap);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Handle HLS stream loading
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selectedStreamUrl) return;

    setStreamError(false);

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Native HLS support (Safari, iOS)
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = selectedStreamUrl;
      video.play().catch(() => {});
      return;
    }

    // Use hls.js for Chrome/Firefox/Edge
    let cancelled = false;

    import("hls.js").then(({ default: Hls }) => {
      if (cancelled) return;

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          // Give up quickly if the stream is dead
          manifestLoadingTimeOut: 10000,
          manifestLoadingMaxRetry: 2,
          levelLoadingTimeOut: 10000,
          fragLoadingTimeOut: 20000,
        });

        hls.loadSource(selectedStreamUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
          if (data.fatal) {
            console.warn("HLS fatal error:", data);
            setStreamError(true);
            hls.destroy();
            hlsRef.current = null;
          }
        });

        hlsRef.current = hls;
      } else {
        // Fallback: try direct src
        video.src = selectedStreamUrl;
        video.play().catch(() => setStreamError(true));
      }
    });

    return () => {
      cancelled = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [selectedStreamUrl]);

  // Filter channels
  const filteredChannels = channels.filter((c) => {
    if (activeCategory !== "all") {
      const cats = c.categories.map((x) => x.toLowerCase());
      if (!cats.includes(activeCategory.toLowerCase())) return false;
    }
    if (searchQuery) {
      if (!c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    }
    if (!streams[c.id]) return false;
    return true;
  });

  const playChannel = (channel: IPTVChannel) => {
    const stream = streams[channel.id];
    if (!stream?.url) return;
    setSelectedChannel(channel);
    setSelectedStreamUrl(stream.url);
  };

  const closePlayer = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = "";
    }
    setSelectedChannel(null);
    setSelectedStreamUrl("");
    setStreamError(false);
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
            <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
              <video
                ref={videoRef}
                controls
                autoPlay
                playsInline
                className="w-full h-full"
              />

              {streamError && (
                <div className="absolute inset-0 flex items-center justify-center bg-navy-dark/90 text-center px-6">
                  <div>
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">
                      Stream unavailable
                    </h3>
                    <p className="text-gray-medium text-sm max-w-sm mx-auto">
                      This channel isn&apos;t responding right now. Try another channel from the list below.
                    </p>
                  </div>
                </div>
              )}
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
                onClick={closePlayer}
                className="ml-auto text-sm text-gray-medium hover:text-white transition-colors"
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
                  <div className="h-16 w-16 rounded-lg bg-gray-light mx-auto mb-2" />
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