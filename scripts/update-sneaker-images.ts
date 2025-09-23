#!/usr/bin/env ts-node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase environment variables are required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// High-quality sneaker image sources for popular models
const SNEAKER_IMAGE_DATABASE = {
  'Nike Air Force 1': {
    'White': [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1584735175097-719d848f8449?w=800&h=800&fit=crop'
    ],
    'Black': [
      'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=800&h=800&fit=crop'
    ]
  },
  'Nike Air Max 90': {
    'White': [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&h=800&fit=crop'
    ],
    'Black': [
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&h=800&fit=crop'
    ]
  },
  'Nike Dunk Low': {
    'White': [
      'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=800&fit=crop'
    ],
    'Black': [
      'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=800&fit=crop'
    ]
  },
  'Air Jordan 1': {
    'Red': [
      'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800&h=800&fit=crop'
    ],
    'Black': [
      'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=800&h=800&fit=crop'
    ]
  },
  'Adidas Stan Smith': {
    'White': [
      'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=800&fit=crop'
    ]
  },
  'Converse Chuck Taylor': {
    'White': [
      'https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1584735175097-719d848f8449?w=800&h=800&fit=crop'
    ],
    'Black': [
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=800&fit=crop'
    ]
  }
};

// Additional sneaker products to add
const ADDITIONAL_SNEAKERS = [
  {
    name: 'Air Jordan 1 Retro High OG "Bred"',
    brand: 'Jordan',
    model: 'Air Jordan 1',
    color: 'Black/Red',
    colorway: 'Black/Varsity Red-White',
    price: '170.00',
    style_code: '555088-061',
    description: 'The Air Jordan 1 Retro High OG "Bred" returns with Nike Air branding and the original high-top silhouette. Features premium leather construction and classic colorblocking.',
    short_description: 'The Air Jordan 1 Retro High OG in the iconic "Bred" colorway.',
    images: ['Red', 'Black']
  },
  {
    name: 'Adidas Stan Smith "Triple White"',
    brand: 'Adidas',
    model: 'Stan Smith',
    color: 'White',
    colorway: 'Cloud White/Cloud White/Green',
    price: '80.00',
    style_code: 'M20324',
    description: 'The Adidas Stan Smith is a tennis shoe made by Adidas. It was first released in the early 1970s and is named after American tennis player Stan Smith.',
    short_description: 'Classic Adidas Stan Smith tennis shoe in all-white.',
    images: ['White']
  },
  {
    name: 'Converse Chuck Taylor All Star High Top',
    brand: 'Converse',
    model: 'Chuck Taylor',
    color: 'White',
    colorway: 'Optical White',
    price: '65.00',
    style_code: 'M7650C',
    description: 'The Converse Chuck Taylor All Star sneakers are an American classic. These high-top sneakers feature a timeless silhouette.',
    short_description: 'Classic Converse Chuck Taylor All Star high-top sneakers.',
    images: ['White']
  },
  {
    name: 'Converse Chuck Taylor All Star Low Top',
    brand: 'Converse',
    model: 'Chuck Taylor',
    color: 'Black',
    colorway: 'Black Monochrome',
    price: '60.00',
    style_code: 'M5039C',
    description: 'The Converse Chuck Taylor All Star low-top sneakers in classic black monochrome colorway.',
    short_description: 'Classic Converse Chuck Taylor All Star low-top sneakers in black.',
    images: ['Black']
  }
];

function findBestMatchingImages(model: string, color: string): string[] {
  // Try exact model match first
  if (SNEAKER_IMAGE_DATABASE[model]) {
    const modelImages = SNEAKER_IMAGE_DATABASE[model];

    // Try exact color match
    for (const colorKey in modelImages) {
      if (color.toLowerCase().includes(colorKey.toLowerCase())) {
        return modelImages[colorKey];
      }
    }

    // Fall back to first available color for this model
    const firstColor = Object.keys(modelImages)[0];
    return modelImages[firstColor];
  }

  // Try partial model match
  for (const modelKey in SNEAKER_IMAGE_DATABASE) {
    if (model.toLowerCase().includes(modelKey.toLowerCase())) {
      const modelImages = SNEAKER_IMAGE_DATABASE[modelKey];

      for (const colorKey in modelImages) {
        if (color.toLowerCase().includes(colorKey.toLowerCase())) {
          return modelImages[colorKey];
        }
      }

      const firstColor = Object.keys(modelImages)[0];
      return modelImages[firstColor];
    }
  }

  // Default fallback images
  return [
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&h=800&fit=crop'
  ];
}

async function updateExistingProductImages(): Promise<void> {
  console.log('🔄 Updating existing product images...');

  // Get all existing products
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, model, color, brand');

  if (error) {
    console.error('Failed to fetch products:', error);
    return;
  }

  for (const product of products) {
    console.log(`\n📦 Processing: ${product.name}`);

    // Remove old images
    const { error: deleteError } = await supabase
      .from('product_images')
      .delete()
      .eq('product_id', product.id);

    if (deleteError) {
      console.error(`Failed to delete old images for ${product.name}:`, deleteError);
      continue;
    }

    // Find new images
    const images = findBestMatchingImages(product.model || product.name, product.color || 'White');

    // Add new images
    for (let i = 0; i < Math.min(images.length, 4); i++) {
      const { error: imageError } = await supabase
        .from('product_images')
        .insert({
          product_id: product.id,
          image_url: images[i],
          alt_text: `${product.name} ${i === 0 ? '' : `View ${i + 1}`}`.trim(),
          is_primary: i === 0,
          sort_order: i + 1,
        });

      if (imageError) {
        console.error(`Failed to insert image for ${product.name}:`, imageError);
      } else {
        console.log(`   📸 Added image ${i + 1}/${Math.min(images.length, 4)}`);
      }
    }
  }
}

async function addNewSneakerProducts(): Promise<void> {
  console.log('\n🆕 Adding new sneaker products...');

  for (const sneaker of ADDITIONAL_SNEAKERS) {
    console.log(`\n[NEW] Adding: ${sneaker.name}`);

    // Check if product already exists
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('style_code', sneaker.style_code)
      .single();

    if (existing) {
      console.log(`   ⏭️  Product already exists, skipping...`);
      continue;
    }

    // Create product record
    const { data: insertedProduct, error: productError } = await supabase
      .from('products')
      .insert({
        name: sneaker.name,
        brand: sneaker.brand,
        model: sneaker.model,
        color: sneaker.color,
        colorway: sneaker.colorway,
        description: sneaker.description,
        short_description: sneaker.short_description,
        style_code: sneaker.style_code,
        price: sneaker.price,
        slug: sneaker.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        sku: sneaker.style_code,
        is_active: true,
        is_featured: true,
        stock_quantity: 15,
        manage_stock: true,
        category_id: 'da74ab02-f304-488f-96cc-eb4e361a7575', // Use existing category
      })
      .select()
      .single();

    if (productError) {
      console.error(`Failed to insert product ${sneaker.name}:`, productError);
      continue;
    }

    console.log(`   ✅ Product created successfully`);

    // Add images
    const imageColors = sneaker.images;
    let imageIndex = 0;

    for (const colorKey of imageColors) {
      const images = SNEAKER_IMAGE_DATABASE[sneaker.model]?.[colorKey] || [];

      for (let i = 0; i < Math.min(images.length, 2); i++) {
        const { error: imageError } = await supabase
          .from('product_images')
          .insert({
            product_id: insertedProduct.id,
            image_url: images[i],
            alt_text: `${sneaker.name} ${colorKey} ${i === 0 ? '' : `View ${i + 1}`}`.trim(),
            is_primary: imageIndex === 0,
            sort_order: imageIndex + 1,
          });

        if (imageError) {
          console.error(`Failed to insert image for ${sneaker.name}:`, imageError);
        } else {
          console.log(`   📸 Added ${colorKey} image ${i + 1}`);
          imageIndex++;
        }
      }
    }
  }
}

async function main() {
  console.log('🚀 Starting sneaker image update...\n');

  try {
    await updateExistingProductImages();
    await addNewSneakerProducts();

    console.log('\n🎉 Sneaker image update completed!');
    console.log('\n📊 Summary:');

    // Get updated counts
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    const { count: imageCount } = await supabase
      .from('product_images')
      .select('*', { count: 'exact', head: true });

    console.log(`   Products: ${productCount}`);
    console.log(`   Images: ${imageCount}`);

  } catch (error) {
    console.error('❌ Error during update:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { main as updateSneakerImages };