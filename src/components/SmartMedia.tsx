import React, { useState } from "react";
import { Film, Image as ImageIcon } from "lucide-react";

interface SmartMediaProps {
  src: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  objectFit?: "cover" | "contain" | "fill";
}

export function parsePinterestPinId(url: string): string | null {
  if (!url) return null;
  // Match standard pinterest.com/pin/123456789/ or fr.pinterest.com/pin/123456789
  const match = url.match(/pinterest\.[a-z.]+\/pin\/(\d+)/i);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

export function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const cleanUrl = url.toLowerCase().trim();
  return (
    cleanUrl.endsWith(".mp4") ||
    cleanUrl.endsWith(".webm") ||
    cleanUrl.endsWith(".ogg") ||
    cleanUrl.endsWith(".mov") ||
    cleanUrl.includes("v1.pinimg.com/videos/") ||
    cleanUrl.includes(".mp4?") ||
    cleanUrl.includes("video/mp4")
  );
}

export function isYouTubeUrl(url: string): { isYouTube: boolean; embedUrl?: string } {
  if (!url) return { isYouTube: false };
  const cleanUrl = url.trim();
  let videoId = "";
  
  if (cleanUrl.includes("youtube.com/watch?v=")) {
    const parts = cleanUrl.split("v=");
    if (parts[1]) {
      videoId = parts[1].split("&")[0].split("#")[0];
    }
  } else if (cleanUrl.includes("youtu.be/")) {
    const parts = cleanUrl.split("youtu.be/");
    if (parts[1]) {
      videoId = parts[1].split("?")[0].split("#")[0];
    }
  } else if (cleanUrl.includes("youtube.com/embed/")) {
    const parts = cleanUrl.split("youtube.com/embed/");
    if (parts[1]) {
      videoId = parts[1].split("?")[0].split("#")[0];
    }
  } else if (cleanUrl.includes("youtube.com/shorts/")) {
    const parts = cleanUrl.split("youtube.com/shorts/");
    if (parts[1]) {
      videoId = parts[1].split("?")[0].split("#")[0];
    }
  }

  if (videoId) {
    return {
      isYouTube: true,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&enablejsapi=1`
    };
  }
  return { isYouTube: false };
}

export function isVimeoUrl(url: string): { isVimeo: boolean; embedUrl?: string } {
  if (!url) return { isVimeo: false };
  const match = url.match(/vimeo\.com\/(\d+)/i);
  if (match && match[1]) {
    return {
      isVimeo: true,
      embedUrl: `https://player.vimeo.com/video/${match[1]}?autoplay=1&loop=1&muted=1&background=1`
    };
  }
  return { isVimeo: false };
}

export const SmartMedia: React.FC<SmartMediaProps> = ({
  src,
  alt = "Product media",
  className = "w-full h-full object-cover",
  containerClassName = "relative w-full h-full overflow-hidden",
  autoPlay = true,
  loop = true,
  muted = true,
  controls = false,
  objectFit = "cover"
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src) {
    return (
      <div className={`bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center text-slate-400 p-4 ${containerClassName}`}>
        <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
        <span className="text-[10px] font-mono">Aucun média</span>
      </div>
    );
  }

  const pinId = parsePinterestPinId(src);
  const { isYouTube, embedUrl: ytEmbed } = isYouTubeUrl(src);
  const { isVimeo, embedUrl: vimeoEmbed } = isVimeoUrl(src);
  const isVid = isVideoUrl(src);

  // 1. Pinterest Pin Embed
  if (pinId) {
    return (
      <div className={`${containerClassName} bg-slate-900 flex items-center justify-center`}>
        <iframe
          src={`https://assets.pinterest.com/ext/embed.html?id=${pinId}`}
          className="w-full h-full border-0 scale-105"
          title={`Pinterest Pin ${pinId}`}
          scrolling="no"
          allow="autoplay; encrypted-media"
        />
      </div>
    );
  }

  // 2. YouTube Embed - Clean autoplay loop with all controls & logos removed
  if (isYouTube && ytEmbed) {
    return (
      <div className={`${containerClassName} bg-black relative overflow-hidden`}>
        <iframe
          src={ytEmbed}
          className="w-full h-full border-0 pointer-events-none scale-135 object-cover"
          title={alt}
          allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
        />
        {/* Transparent overlay covering the iframe to hide any YouTube hover buttons/logos */}
        <div className="absolute inset-0 z-10 bg-transparent" />
      </div>
    );
  }

  // 3. Vimeo Embed
  if (isVimeo && vimeoEmbed) {
    return (
      <div className={`${containerClassName} bg-black`}>
        <iframe
          src={vimeoEmbed}
          className="w-full h-full border-0 pointer-events-none scale-125"
          title={alt}
          allow="autoplay; fullscreen; picture-in-picture"
        />
      </div>
    );
  }

  // 4. Direct Video file (MP4, WEBM, Pinterest Video URL)
  if (isVid) {
    return (
      <div className={`${containerClassName} bg-black relative group/media`}>
        <video
          src={src}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          playsInline
          controls={controls}
          className={`${className} style-${objectFit}`}
          onError={() => setHasError(true)}
        />
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[9px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1 opacity-80 z-10 pointer-events-none">
          <Film className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>Vidéo HD</span>
        </div>
      </div>
    );
  }

  // 5. Standard Image URL (or i.pinimg.com Pinterest direct image)
  if (hasError) {
    return (
      <div className={`bg-slate-100 dark:bg-slate-850 flex flex-col items-center justify-center text-slate-400 p-4 ${containerClassName}`}>
        <ImageIcon className="w-8 h-8 mb-1 text-slate-300" />
        <span className="text-[10px] font-mono text-center">Image indisponible</span>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className={className}
      />
    </div>
  );
};

export default SmartMedia;
