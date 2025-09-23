import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Utility function to create clean slugs
const createSlug = (brand: string, model: string, sku: string): string => {
  return `${brand}-${model}-${sku}`
    .toLowerCase()
    .replace(/['"]/g, '') // Remove quotes
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

export async function GET() {
  try {
    console.log('🔍 API: Testing database connection...');

    // Test the same query as the frontend
    const { data: dbProducts, error } = await supabase
      .from('sneakers')
      .select(`
        id,
        brand,
        model,
        colorway,
        price,
        sku,
        image_url,
        in_stock,
        description
      `)
      .eq('in_stock', true)
      .limit(10);

    console.log('📊 API: Database query result:', { dbProducts, error });

    if (error) {
      console.error('❌ API: Error fetching from database:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 });
    }

    if (!dbProducts || dbProducts.length === 0) {
      console.warn('⚠️ API: No products found in database');
      return NextResponse.json({
        success: true,
        products: [],
        message: 'No products found'
      });
    }

    console.log('✅ API: Found products:', dbProducts.length);

    // Transform products like the frontend does
    const formattedProducts = dbProducts.map((sneaker: any) => ({
      id: sneaker.id,
      name: `${sneaker.brand} ${sneaker.model}`,
      brand: sneaker.brand,
      price: parseFloat(sneaker.price) || 0,
      image: sneaker.image_url || '/api/placeholder/400/400',
      colorway: sneaker.colorway,
      sku: sneaker.sku,
      slug: createSlug(sneaker.brand, sneaker.model, sneaker.sku)
    }));

    console.log('✅ API: Transformed products:', formattedProducts);

    return NextResponse.json({
      success: true,
      products: formattedProducts,
      count: formattedProducts.length,
      raw: dbProducts
    });

  } catch (error) {
    console.error('💥 API: Critical error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}