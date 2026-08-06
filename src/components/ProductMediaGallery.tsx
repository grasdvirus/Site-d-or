import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { SmartMedia } from "./SmartMedia";

interface ProductMediaGalleryProps {
  image: string;
  image2?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  showIndicators?: boolean;
}

export const ProductMediaGallery: React.FC<ProductMediaGalleryProps> = ({
  image,
  image2,
  alt,
  className = "w-full h-full object-cover",
  containerClassName = "w-full h-full relative",
  showIndicators = true,
}) => {
  const images = [image, image2].filter(
    (img): img is string => typeof img === "string" && img.trim().length > 0
  );

  const [currentIndex, setCurrentIndex] = useState(0);

  // If only 1 image exists, render single SmartMedia directly
  if (images.length <= 1) {
    return (
      <SmartMedia
        src={images[0] || image}
        alt={alt}
        className={className}
        containerClassName={containerClassName}
      />
    );
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex(index);
  };

  return (
    <div className={`relative group/gallery overflow-hidden ${containerClassName}`}>
      {/* Current Slide Image */}
      <SmartMedia
        src={images[currentIndex]}
        alt={`${alt} - Vue ${currentIndex + 1}`}
        className={className}
        containerClassName="w-full h-full"
      />

      {/* Manual Slide Navigation Arrows */}
      <button
        type="button"
        onClick={handlePrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-md opacity-80 sm:opacity-0 group-hover/gallery:opacity-100 transition-all z-20 cursor-pointer shadow-md"
        title="Image précédente"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={handleNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-md opacity-80 sm:opacity-0 group-hover/gallery:opacity-100 transition-all z-20 cursor-pointer shadow-md"
        title="Image suivante"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Slideshow Pill Indicator & Navigation Dots */}
      {showIndicators && (
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-slate-950/75 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 shadow-md pointer-events-auto">
          <Layers className="w-3 h-3 text-amber-400" />
          <div className="flex gap-1 items-center">
            {images.map((_, idx) => (
              <button
                key={`dot-${idx}`}
                type="button"
                onClick={(e) => handleDotClick(e, idx)}
                className={`transition-all rounded-full cursor-pointer ${
                  currentIndex === idx
                    ? "w-4 h-1.5 bg-amber-400"
                    : "w-1.5 h-1.5 bg-white/50 hover:bg-white"
                }`}
                title={`Aller à l'image ${idx + 1}`}
              />
            ))}
          </div>
          <span className="text-[9px] font-mono font-bold text-white/90 ml-0.5">
            {currentIndex + 1}/{images.length}
          </span>
        </div>
      )}
    </div>
  );
};

export default ProductMediaGallery;
