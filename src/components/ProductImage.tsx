'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

interface ProductImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  width?: number;
  height?: number;
}

export default function ProductImage({
  src,
  alt,
  fill,
  className = '',
  sizes,
  width,
  height
}: ProductImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Generate a placeholder using a gradient based on the product name
  const generatePlaceholder = (name: string) => {
    const colors = [
      'from-blue-400 to-purple-500',
      'from-green-400 to-blue-500',
      'from-purple-400 to-pink-500',
      'from-yellow-400 to-red-500',
      'from-pink-400 to-red-500',
      'from-indigo-400 to-purple-500',
      'from-cyan-400 to-blue-500',
      'from-emerald-400 to-teal-500',
    ];

    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = hash % colors.length;

    return colors[colorIndex];
  };

  if (hasError || src.includes('/api/placeholder/')) {
    return (
      <div className={`bg-gradient-to-br ${generatePlaceholder(alt)} flex items-center justify-center w-full h-full min-h-[200px] ${className}`}>
        <div className="text-white text-center p-4">
          <div className="text-sm font-semibold mb-2">Sneaker Image</div>
          <div className="text-xs opacity-75">
            {alt.split(' ').slice(0, 3).join(' ')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-700 z-10">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      )}

      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={width}
        height={height}
        sizes={sizes}
        className={`object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        priority={false}
        unoptimized={false}
      />
    </div>
  );
}