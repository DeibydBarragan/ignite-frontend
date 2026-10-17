"use client";

import { useState } from "react";
import Image from "next/image";
import { Disc3 } from "lucide-react";

export interface CoverImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  iconSize?: number;
  priority?: boolean;
  sizes?: string;
}

const ALLOWED_HOSTS = new Set([
  "i.ytimg.com",
  "images.unsplash.com",
  "cdn.discordapp.com",
  "i.scdn.co",
  "mosaic.scdn.co",
  "image-cdn-ak.spotifycdn.com",
  "image-cdn-fa.spotifycdn.com",
]);

function isUnoptimizedUrl(url: string): boolean {
  if (!url.startsWith("http://") && !url.startsWith("https://")) return true;
  try {
    const parsed = new URL(url);
    return !ALLOWED_HOSTS.has(parsed.hostname);
  } catch {
    return true;
  }
}

export function CoverImage(props: CoverImageProps) {
  return <CoverImageInner key={props.src ?? "empty"} {...props} />;
}

function CoverImageInner({
  src,
  alt,
  className = "",
  imgClassName = "",
  iconSize = 18,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 300px",
}: CoverImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const safeSrc = src?.trim() ?? "";
  const showPlaceholder = !safeSrc || failed || !loaded;

  return (
    <div className={`relative overflow-hidden bg-black/5 dark:bg-white/5 ${className}`}>
      {showPlaceholder && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 dark:from-[#1b2030] dark:via-[#141724] dark:to-[#0d0f18] z-0">
          <Disc3 size={iconSize} className="text-slate-400 dark:text-purple-400/70 shrink-0" />
          <div className="absolute inset-0 ignite-shimmer opacity-15 pointer-events-none" />
        </div>
      )}
      {safeSrc && !failed && (
        <Image
          src={safeSrc}
          alt={alt || "Carátula"}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={isUnoptimizedUrl(safeSrc)}
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`h-full w-full object-cover transition-opacity duration-300 relative z-10 ${
            loaded ? "opacity-100" : "opacity-0"
          } ${imgClassName}`}
        />
      )}
    </div>
  );
}
