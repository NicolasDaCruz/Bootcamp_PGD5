// Product import script for populating database with KicksDB data
import {
  kicksdb,
  fetchAllBrandsData,
  generateSizeStock,
  generateColorVariations,
  extractProductImages,
  generateProductSlug,
  isRareProduct,
  POPULAR_BRANDS,
  SIZE_CATEGORIES,
} from './kicksdb';
import { supabase } from './supabase';
import type { KicksDBProduct } from '@/types/product';
import type {
  ProductInsert,
  ProductVariantInsert,
} from '@/types/database';

// Categories mapping for sneakers
const SNEAKER_CATEGORIES = [
  {
    name: 'Basketball',
    slug: 'basketball',
    description: 'High-performance basketball sneakers',
    keywords: ['basketball', 'air jordan', 'lebron', 'kobe', 'kyrie', 'kd'],
  },
  {
    name: 'Running',
    slug: 'running',
    description: 'Lightweight running and athletic shoes',
    keywords: ['running', 'zoom', 'react', 'boost', 'ultraboost', 'pegasus'],
  },
  {
    name: 'Lifestyle',
    slug: 'lifestyle',
    description: 'Casual sneakers for everyday wear',
    keywords: ['lifestyle', 'casual', 'classic', 'stan smith', 'air force'],
  },
  {
    name: 'Skateboarding',
    slug: 'skateboarding',
    description: 'Durable skateboarding shoes',
    keywords: ['skate', 'sb', 'vans', 'converse', 'skateboarding'],
  },
  {
    name: 'Limited Edition',
    slug: 'limited-edition',
    description: 'Rare and exclusive sneaker releases',
    keywords: ['limited', 'exclusive', 'collab', 'off-white', 'fragment'],
  },
  {
    name: 'Retro',
    slug: 'retro',
    description: 'Classic and vintage sneaker styles',
    keywords: ['retro', 'vintage', 'og', 'classic', 'original'],
  },
];

// Import progress tracking
interface ImportProgress {
  totalProducts: number;
  processedProducts: number;
  successfulImports: number;
  errors: string[];
  startTime: Date;
}

class ProductImporter {
  private progress: ImportProgress = {
    totalProducts: 0,
    processedProducts: 0,
    successfulImports: 0,
    errors: [],
    startTime: new Date(),
  };

  // Initialize categories in database
  async initializeCategories(): Promise<Map<string, string>> {
    console.log('Initializing categories...');
    const categoryMap = new Map<string, string>();

    for (const category of SNEAKER_CATEGORIES) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .upsert(
            {
              name: category.name,
              slug: category.slug,
              description: category.description,
            },
            { onConflict: 'slug' }
          )
          .select('id, slug')
          .single();

        if (error) throw error;

        categoryMap.set(category.slug, data.id);
        console.log(`✓ Category: ${category.name} (${data.id})`);
      } catch (error) {
        console.error(`Failed to create category ${category.name}:`, error);
        this.progress.errors.push(`Category error: ${category.name}`);
      }
    }

    return categoryMap;
  }

  // Determine category for a product based on its name and brand
  private determineCategory(product: KicksDBProduct): string {
    const searchText = `${product.name} ${product.brand}`.toLowerCase();

    for (const category of SNEAKER_CATEGORIES) {
      if (category.keywords.some(keyword => searchText.includes(keyword))) {
        return category.slug;
      }
    }

    // Default to lifestyle if no specific category matches
    return 'lifestyle';
  }

  // Generate market price based on retail price and rarity
  private generateMarketPrice(retailPrice: number, isRare: boolean): number {
    if (isRare) {
      // Rare shoes typically trade above retail
      const multiplier = 1.5 + Math.random() * 2; // 1.5x to 3.5x retail
      return Math.round(retailPrice * multiplier);
    } else {
      // Regular shoes might be slightly above or below retail
      const variation = 0.8 + Math.random() * 0.4; // 0.8x to 1.2x retail
      return Math.round(retailPrice * variation);
    }
  }

  // Create brand if it doesn't exist
  private async ensureBrand(brandName: string): Promise<string | null> {
    try {
      // First, try to find existing brand
      const { data: existingBrand } = await supabase
        .from('brands')
        .select('id')
        .eq('name', brandName)
        .single();

      if (existingBrand) {
        return existingBrand.id;
      }

      // Create new brand
      const { data, error } = await supabase
        .from('brands')
        .insert({
          name: brandName,
          slug: brandName.toLowerCase().replace(/\s+/g, '-'),
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error(`Failed to ensure brand ${brandName}:`, error);
      return null;
    }
  }

  // Convert KicksDB product to database product
  private async convertProduct(
    kicksProduct: KicksDBProduct,
    categoryMap: Map<string, string>
  ): Promise<{
    product: ProductInsert;
    variants: ProductVariantInsert[];
  } | null> {
    try {
      const categorySlug = this.determineCategory(kicksProduct);
      const categoryId = categoryMap.get(categorySlug);

      if (!categoryId) {
        throw new Error(`Category not found: ${categorySlug}`);
      }

      const brandId = await this.ensureBrand(kicksProduct.brand);
      const isRare = isRareProduct(kicksProduct.name);
      const images = extractProductImages(kicksProduct);
      const slug = generateProductSlug(kicksProduct.name, kicksProduct.brand);

      const product: ProductInsert = {
        name: kicksProduct.name,
        slug,
        brand_id: brandId,
        description: kicksProduct.description || `${kicksProduct.brand} ${kicksProduct.name}`,
        category_id: categoryId,
        base_price: kicksProduct.retailPrice || 150,
        market_price: this.generateMarketPrice(kicksProduct.retailPrice || 150, isRare),
        images,
        kicksdb_id: kicksProduct.id,
        is_active: true,
      };

      // Generate variants for different sizes and colors
      const variants: ProductVariantInsert[] = [];

      // Determine size category based on product name/type
      const sizeCategory = this.determineSizeCategory(kicksProduct.name);
      const sizeStock = generateSizeStock(sizeCategory, isRare);
      const colors = generateColorVariations(images);

      for (const color of colors) {
        for (const { size, stock } of sizeStock) {
          const sku = `${kicksProduct.brand.toUpperCase()}-${kicksProduct.id}-${color.toUpperCase()}-${size}`;

          variants.push({
            product_id: '', // Will be filled after product creation
            size,
            color,
            sku,
            stock_quantity: stock,
            price_modifier: 0, // Base price modifier
            is_active: stock > 0,
          });
        }
      }

      return { product, variants };
    } catch (error) {
      console.error(`Failed to convert product ${kicksProduct.id}:`, error);
      return null;
    }
  }

  // Determine size category based on product characteristics
  private determineSizeCategory(productName: string): keyof typeof SIZE_CATEGORIES {
    const lowerName = productName.toLowerCase();

    if (lowerName.includes('kids') || lowerName.includes('child')) {
      return 'kids';
    }

    if (lowerName.includes('women') || lowerName.includes("women's")) {
      return 'women';
    }

    // Default to men's sizing
    return 'men';
  }

  // Import a single product to database
  private async importProduct(
    kicksProduct: KicksDBProduct,
    categoryMap: Map<string, string>
  ): Promise<boolean> {
    try {
      // Check if product already exists
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('kicksdb_id', kicksProduct.id)
        .single();

      if (existingProduct) {
        console.log(`Product already exists: ${kicksProduct.name}`);
        return true;
      }

      const converted = await this.convertProduct(kicksProduct, categoryMap);
      if (!converted) return false;

      // Insert product
      const { data: insertedProduct, error: productError } = await supabase
        .from('products')
        .insert(converted.product)
        .select('id')
        .single();

      if (productError) throw productError;

      // Insert variants
      const variantsWithProductId = converted.variants.map(variant => ({
        ...variant,
        product_id: insertedProduct.id,
      }));

      const { error: variantsError } = await supabase
        .from('product_variants')
        .insert(variantsWithProductId);

      if (variantsError) throw variantsError;

      console.log(`✓ Imported: ${kicksProduct.name} (${variantsWithProductId.length} variants)`);
      return true;
    } catch (error) {
      console.error(`Failed to import product ${kicksProduct.name}:`, error);
      this.progress.errors.push(`Import error: ${kicksProduct.name}`);
      return false;
    }
  }

  // Main import function
  async importAllProducts(): Promise<ImportProgress> {
    console.log('Starting product import from KicksDB...');
    this.progress.startTime = new Date();

    try {
      // Initialize categories
      const categoryMap = await this.initializeCategories();

      // Fetch data from KicksDB
      console.log('Fetching product data from KicksDB...');
      const brandsData = await fetchAllBrandsData();

      // Calculate total products
      this.progress.totalProducts = brandsData.reduce(
        (sum, brand) => sum + brand.products.length,
        0
      );

      console.log(`Found ${this.progress.totalProducts} products to import`);

      // Import products brand by brand
      for (const { brand, products } of brandsData) {
        console.log(`\nImporting ${products.length} products from ${brand}...`);

        for (const product of products) {
          const success = await this.importProduct(product, categoryMap);
          this.progress.processedProducts++;

          if (success) {
            this.progress.successfulImports++;
          }

          // Progress update
          if (this.progress.processedProducts % 10 === 0) {
            console.log(
              `Progress: ${this.progress.processedProducts}/${this.progress.totalProducts} (${Math.round(
                (this.progress.processedProducts / this.progress.totalProducts) * 100
              )}%)`
            );
          }

          // Small delay to avoid overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const duration = Date.now() - this.progress.startTime.getTime();
      console.log(`\n✅ Import completed in ${Math.round(duration / 1000)}s`);
      console.log(`Successful imports: ${this.progress.successfulImports}/${this.progress.totalProducts}`);

      if (this.progress.errors.length > 0) {
        console.log(`Errors: ${this.progress.errors.length}`);
        this.progress.errors.forEach(error => console.log(`  - ${error}`));
      }

      return this.progress;
    } catch (error) {
      console.error('Import failed:', error);
      this.progress.errors.push(`Critical error: ${error}`);
      return this.progress;
    }
  }

  // Import specific brands only
  async importByBrands(brands: string[]): Promise<ImportProgress> {
    console.log(`Starting import for specific brands: ${brands.join(', ')}`);
    this.progress.startTime = new Date();

    try {
      const categoryMap = await this.initializeCategories();

      for (const brand of brands) {
        if (POPULAR_BRANDS.includes(brand as any)) {
          console.log(`Fetching products for ${brand}...`);
          const products = await kicksdb.searchByBrand(brand, 20);

          for (const product of products.products || []) {
            const success = await this.importProduct(product, categoryMap);
            this.progress.processedProducts++;

            if (success) {
              this.progress.successfulImports++;
            }

            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }

      return this.progress;
    } catch (error) {
      console.error('Brand-specific import failed:', error);
      this.progress.errors.push(`Critical error: ${error}`);
      return this.progress;
    }
  }
}

// Export the importer
export const productImporter = new ProductImporter();

// Convenience functions
export const importAllProducts = () => productImporter.importAllProducts();
export const importByBrands = (brands: string[]) => productImporter.importByBrands(brands);