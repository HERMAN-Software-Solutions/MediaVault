"use client";

import { useEffect, useRef, useState } from "react";

interface YouTubePlayerProps {
  videoId: string;
  className?: string;
  autoplay?: boolean;
  controls?: boolean;
}

export function YouTubePlayer({
  videoId,
  className = "",
  autoplay = true,
  controls = true,
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [blocked, setBlocked] = useState(false);

  // Reset when video changes
  useEffect(() => {
    setBlocked(false);
  }, [videoId]);

  // Load YouTube IFrame API and attach error listener
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initPlayer = () => {
      if (!containerRef.current || !window.YT?.Player) return;

      // Destroy previous player
      if (playerRef.current?.destroy) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          controls: controls ? 1 : 0,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onError: (event: any) => {
            // 2, 5, 100 = not found / invalid
            // 101, 150 = embedding blocked (VEVO, etc.)
            if ([2, 5, 100, 101, 150].includes(event.data)) {
              setBlocked(true);
            }
          },
        },
      });
    };

    // Load API if not already loaded
    if (window.YT?.Player) {
      initPlayer();
    } else {
      // Check if script is already loading
      const existing = document.querySelector('script[src*="youtube.com/iframe_api"]');
      if (!existing) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      // Chain callbacks (API allows only one global callback)
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        initPlayer();
      };
    }

    return () => {
      if (playerRef.current?.destroy) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
    };
  }, [videoId, autoplay, controls]);

  // Blocked fallback UI
  if (blocked) {
    return (
      <div className={`relative aspect-video bg-navy-dark flex items-center justify-center ${className}`}>
        {/* Faded thumbnail background */}
        <img
          src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/80 to-navy-dark/40" />

        {/* Overlay content */}
        <div className="relative z-10 text-center px-6 max-w-md">
          <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <polygon points="10 8 16 11.5 10 15" fill="white" />
            </svg>
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">
            This video can&apos;t be played here
          </h3>
          <p className="text-gray-medium text-sm mb-5">
            The owner has restricted embedded playback. You can still watch it on YouTube.
          </p>
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#FF0000] hover:bg-[#CC0000] text-white px-6 py-3 text-sm font-semibold transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            Watch on YouTube
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full ${className}`}>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

// TypeScript — YouTube API global
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}