"use client";

import { useState, useEffect, useRef } from "react";

export function HeroSearch() {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [show, setShow] = useState(false);
  const [clipboardUrl, setClipboardUrl] = useState("");
  const [showClipboard, setShowClipboard] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Extract YouTube video ID from any URL format
  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /(?:m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /(?:music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Fetch suggestions
  useEffect(() => {
    if (input.trim().length < 2) { setSuggestions([]); return; }

    // Skip suggestions if it's a YouTube URL
    const videoId = extractYouTubeId(input);
    if (videoId) { setSuggestions([]); return; }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://mediavault-o52i.onrender.com/api/suggest?q=${encodeURIComponent(input)}`);
        const data = await res.json();
        setSuggestions(data.data || []);
        setShow(true);
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [input]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShow(false);
        setShowClipboard(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // Check clipboard on focus
  const handleFocus = async () => {
    if (suggestions.length > 0) setShow(true);

    try {
      const text = await navigator.clipboard.readText();
      const videoId = extractYouTubeId(text);

      if (videoId && text !== input) {
        setClipboardUrl(text);
        setShowClipboard(true);
      }
    } catch {
      // Clipboard access denied — silently ignore
    }
  };

  // Handle paste directly
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text");
    const videoId = extractYouTubeId(pastedText);

    if (videoId) {
      e.preventDefault();
      setInput("");
      setShow(false);
      window.location.href = `/song/${videoId}`;
    }
  };

  // Submit search or URL
  const search = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;

    setShow(false);
    setShowClipboard(false);
    setSuggestions([]);

    // Check if it's a YouTube URL
    const videoId = extractYouTubeId(trimmed);
    if (videoId) {
      window.location.href = `/song/${videoId}`;
      return;
    }

    // Normal search
    window.location.href = `/search?q=${encodeURIComponent(trimmed)}`;
  };

  // Use the clipboard URL
  const useClipboard = () => {
    const videoId = extractYouTubeId(clipboardUrl);
    if (videoId) {
      setShowClipboard(false);
      window.location.href = `/song/${videoId}`;
    }
  };

  return (
    <div className="py-8">
      <div className="container-site">
        <h1 className="text-2xl md:text-3xl font-bold text-center text-navy dark:text-white mb-6">
          What do you want to download?
        </h1>
        <div className="max-w-xl mx-auto relative" ref={ref}>
          <form onSubmit={(e) => { e.preventDefault(); search(input); }}>
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onFocus={handleFocus}
                onPaste={handlePaste}
                placeholder="Search or paste YouTube URL..."
                className="flex-1 rounded-full border border-gray-light bg-white px-5 py-3 text-sm text-charcoal placeholder:text-gray-medium focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal dark:bg-navy dark:text-white dark:border-navy-light"
              />
              <button
                type="submit"
                className="rounded-full bg-teal px-6 py-3 text-sm font-semibold text-white hover:bg-teal-dark transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Clipboard suggestion */}
          {showClipboard && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-navy-light rounded-xl border border-gray-light dark:border-white/10 shadow-2xl z-50 p-4 flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00C2BA" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-semibold text-navy dark:text-white">YouTube link detected</div>
                <div className="text-xs text-charcoal dark:text-gray-medium truncate">{clipboardUrl}</div>
              </div>
              <button
                type="button"
                onClick={useClipboard}
                className="flex-shrink-0 rounded-full bg-teal text-white px-4 py-2 text-xs font-semibold hover:bg-teal-dark transition-colors"
              >
                Use link
              </button>
              <button
                type="button"
                onClick={() => setShowClipboard(false)}
                aria-label="Dismiss"
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-medium hover:bg-gray-light dark:hover:bg-navy transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          )}

          {/* Suggestions */}
          {show && suggestions.length > 0 && !showClipboard && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-navy-dark rounded-xl border border-gray-light dark:border-navy-light shadow-2xl z-50 overflow-hidden">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(s); search(s); }}
                  className="flex items-center gap-3 w-full px-5 py-3 text-sm text-charcoal dark:text-gray-light hover:bg-gray-light dark:hover:bg-navy transition-colors text-left"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hint */}
        <p className="text-xs text-center text-gray-medium mt-4">
          Tip: Paste any YouTube link (youtube.com, youtu.be, shorts) to download instantly
        </p>
      </div>
    </div>
  );
}