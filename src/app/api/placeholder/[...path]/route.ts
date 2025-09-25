import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const [width, height] = resolvedParams.path;

  // Parse dimensions with fallbacks
  const w = Math.min(Math.max(parseInt(width) || 400, 1), 2000);
  const h = Math.min(Math.max(parseInt(height) || 400, 1), 2000);

  // Create a simple SVG placeholder - but with proper headers to avoid Next.js optimization
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
    <rect width="100%" height="100%" fill="#f1f5f9"/>
    <text x="50%" y="50%" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#64748b" text-anchor="middle" dominant-baseline="middle">
      ${w}×${h}
    </text>
  </svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
      // Add headers to prevent Next.js Image optimization
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*'
    },
  });
}