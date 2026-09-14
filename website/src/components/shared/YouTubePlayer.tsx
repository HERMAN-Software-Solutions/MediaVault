"use client";

import { useEffect, useRef, useState } from "react";

interface YouTubePlayerProps {
  videoId: string;
  className?: string;
  autoplay?: boolean;
}

export function YouTubePlayer({ videoId, className = "", autoplay = true }: YouTubePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [blocked, setBlocked] = useState(false);

  // Listen for YouTube iframe error messages
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      // Only accept messages from YouTube
      if (!e.origin.includes("youtube.com")) return;

      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;

        // YouTube posts error events with info
        if (data?.event === "onError" || data?.info?.errorCode) {
          const code = data?.info?.errorCode ?? data?.info;
          if (code === 101 || code === 150 || code === 100 || code === 2) {
            setBlocked(true);
          }
        }
      } catch {
        // Ignore non-JSON messages
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Reset when videoId changes
  useEffect(() => {
    setBlocked(false);
  }, [videoId]);

  if (blocked) {
    return (
      <div className={`relative aspect-video bg-navy-dark flex items-center justify-center ${className}`}>
        {/* Thumbnail as background */}
        <img
          src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
          alt="Video thumbnail"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          onError={(e) => {
            // Fallback to lower quality thumbnail if maxres doesn't exist
            (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
          }}
        />

        {/* Overlay */}
        <div className="relative z-10 text-center px-6">
          <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <polygon points="10 8 16 11.5 10 15" fill="white"/>
            </svg>
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">
            This video can&apos;t be played here
          </h3>
          <p className="text-gray-medium text-sm mb-5 max-w-sm mx-auto">
            The owner has restricted embedded playback. You can still watch it directly on YouTube.
          </p>
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#FF0000] hover:bg-[#CC0000] text-white px-6 py-3 text-sm font-semibold transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            Watch on YouTube
          </a>
        </div>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&controls=1&enablejsapi=1&playsinline=1&origin=${typeof window !== "undefined" ? window.location.origin : ""}`}
      className={`w-full h-full ${className}`}
      allowFullScreen
      allow="autoplay; encrypted-media"
      title="YouTube video player"
    />
  );
}