import https from 'https';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// CONFIGURATION KICKSDB API
const CONFIG = {
    API_KEY: process.env.KICKSDB_API_KEY || 'KICKS-133F-707B-8C17-BDF020B41CFC',
    BASE_URL: 'api.kicks.dev',
    DELAY_BETWEEN_REQUESTS: 1000,  // 1 second
    MAX_IMAGES_PER_VARIANT: 5,
    TIMEOUT: 30000
};

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface KicksDBProduct {
    id?: string;
    name?: string;
    title?: string;
    brand?: string;
    colorway?: string;
    image?: string;
    imageUrl?: string;
    images?: string[] | any[];
    price?: number;
    lowestAsk?: number;
    sku?: string;
    slug?: string;
    source?: string;
    [key: string]: any;
}

interface ProcessedProduct {
    productName: string;
    brand: string;
    colorway?: string;
    variant: string;
    images: Array<{
        path: string;
        url: string;
        index: number;
    }>;
    imageCount: number;
    matchScore: number;
    outputDir: string;
    price?: number;
    source: string;
    kicksDBData: {
        id?: string;
        sku?: string;
        slug?: string;
    };
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to make KicksDB API request
function makeKicksDBRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    return new Promise((resolve, reject) => {
        const queryString = new URLSearchParams(params).toString();
        const url = `${endpoint}${queryString ? '?' + queryString : ''}`;

        const options: https.RequestOptions = {
            hostname: CONFIG.BASE_URL,
            path: url,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${CONFIG.API_KEY}`,
                'Content-Type': 'application/json',
                'User-Agent': 'SneakerScraper/1.0'
            },
            timeout: CONFIG.TIMEOUT
        };

        console.log(`      🌐 KicksDB API: ${CONFIG.BASE_URL}${url}`);

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const jsonData = JSON.parse(data);
                        resolve(jsonData);
                    } catch (error) {
                        reject(new Error(`JSON parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`));
                    }
                } else if (res.statusCode === 401) {
                    reject(new Error('Invalid API Key - check your KicksDB key'));
                } else if (res.statusCode === 429) {
                    reject(new Error('Rate limit exceeded - wait a moment'));
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error(`Request error: ${error.message}`));
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

// Function to search KicksDB
async function searchKicksDB(query: string, source: string = 'stockx'): Promise<KicksDBProduct[]> {
    try {
        console.log(`      🔍 KicksDB Search: "${query}" on ${source}`);

        const params = {
            query: query,
            limit: 20,
            currency: 'USD'
        };

        // Use different endpoints based on source
        let endpoint: string;
        switch (source) {
            case 'stockx':
                endpoint = '/v3/stockx/products';
                break;
            case 'goat':
                endpoint = '/v3/goat/products';
                break;
            case 'unified':
                endpoint = '/v3/products';
                break;
            default:
                endpoint = '/v3/products';
        }

        const response = await makeKicksDBRequest(endpoint, params);

        if (response && response.data && response.data.length > 0) {
            console.log(`      ✅ ${response.data.length} products found`);
            return response.data;
        } else if (response && response.products && response.products.length > 0) {
            console.log(`      ✅ ${response.products.length} products found`);
            return response.products;
        } else {
            console.log(`      📭 No products found`);
            return [];
        }

    } catch (error) {
        console.log(`      ❌ KicksDB Error: ${error instanceof Error ? error.message : 'Unknown error'}`);

        // If StockX doesn't work, try GOAT
        if (source === 'stockx' && !(error instanceof Error && error.message.includes('API Key'))) {
            console.log(`      🔄 Trying GOAT...`);
            return await searchKicksDB(query, 'goat');
        }

        return [];
    }
}

// Function to download image
function downloadImage(url: string, filepath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!url || !url.startsWith('http')) {
            reject(new Error('Invalid URL'));
            return;
        }

        console.log(`        📥 ${path.basename(filepath)}`);

        const file = fs.createWriteStream(filepath);
        const protocol = url.startsWith('https:') ? https : require('http');

        const request = protocol.get(url, (response: any) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(filepath);
                });
            } else if (response.statusCode === 302 || response.statusCode === 301) {
                fs.unlink(filepath, () => {});
                resolve(downloadImage(response.headers.location, filepath));
            } else {
                fs.unlink(filepath, () => {});
                reject(new Error(`HTTP ${response.statusCode}`));
            }
        });

        request.on('error', (err: Error) => {
            fs.unlink(filepath, () => {});
            reject(err);
        });

        request.setTimeout(15000, () => {
            request.destroy();
            fs.unlink(filepath, () => {});
            reject(new Error('Download timeout'));
        });
    });
}

// Function to create directories
function createDirectories(brand: string, product: string, variant: string): string {
    const cleanBrand = brand.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const cleanProduct = product.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const cleanVariant = variant.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

    const dir = `./public/images/scraped/${cleanBrand}/${cleanProduct}/${cleanVariant}`;
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}

// Function to extract images from KicksDB product
function extractImagesFromProduct(product: KicksDBProduct): string[] {
    const images: string[] = [];

    console.log(`      🔍 DEBUG - Product structure:`);
    console.log(`         Available fields: ${Object.keys(product).join(', ')}`);

    // Main image
    if (product.image) {
        images.push(product.image);
        console.log(`         ✓ Main image found`);
    }

    if (product.imageUrl) {
        images.push(product.imageUrl);
        console.log(`         ✓ ImageUrl found`);
    }

    // Multiple images - explore all possible fields
    const imageFields = [
        'images', 'gallery', 'media', 'photos', 'pictures',
        'imageLinks', 'imageUrls', 'productImages', 'variants'
    ];

    imageFields.forEach(field => {
        if (product[field]) {
            console.log(`         🔍 Field '${field}' found:`, typeof product[field]);

            if (Array.isArray(product[field])) {
                product[field].forEach((item: any, index: number) => {
                    if (typeof item === 'string' && item.startsWith('http')) {
                        images.push(item);
                        console.log(`         ✓ Image ${index + 1} from ${field}`);
                    } else if (item && typeof item === 'object') {
                        // Explore nested objects
                        ['url', 'imageUrl', 'src', 'href', 'link'].forEach(urlField => {
                            if (item[urlField] && item[urlField].startsWith('http')) {
                                images.push(item[urlField]);
                                console.log(`         ✓ Image ${index + 1} from ${field}.${urlField}`);
                            }
                        });

                        // If it's an object with nested images
                        if (item.images && Array.isArray(item.images)) {
                            item.images.forEach((subImg: any) => {
                                if (typeof subImg === 'string' && subImg.startsWith('http')) {
                                    images.push(subImg);
                                    console.log(`         ✓ Nested image from ${field}.images`);
                                }
                            });
                        }
                    }
                });
            }
        }
    });

    // StockX/GOAT specific fields
    const specificFields = [
        'smallImageUrl', 'thumbUrl', 'thumbnail', 'productImage',
        'mainImage', 'primaryImage', 'featuredImage'
    ];

    specificFields.forEach(field => {
        if (product[field] && product[field].startsWith('http')) {
            images.push(product[field]);
            console.log(`         ✓ Image from ${field}`);
        }
    });

    // Remove duplicates and invalid URLs
    const uniqueImages = [...new Set(images.filter(img => img && img.startsWith('http')))];
    console.log(`         📊 Total: ${uniqueImages.length} unique images extracted`);

    return uniqueImages;
}

// Function to score product match
function scoreProductMatch(product: KicksDBProduct, targetBrand: string, targetName: string, targetColor: string): number {
    if (!product) return 0;

    const productName = (product.name || product.title || '').toLowerCase();
    const productBrand = (product.brand || '').toLowerCase();
    const colorway = (product.colorway || '').toLowerCase();
    const searchText = `${productName} ${productBrand} ${colorway}`;

    const targetNameLower = targetName.toLowerCase();
    const targetColorLower = targetColor.toLowerCase();
    const targetBrandLower = targetBrand.toLowerCase();

    let score = 0;

    // Brand verification (very important)
    if (productBrand === targetBrandLower || productBrand.includes(targetBrandLower)) {
        score += 10;
    } else if (searchText.includes(targetBrandLower)) {
        score += 6;
    }

    // Product name verification
    const productWords = targetNameLower.split(' ').filter(word => word.length > 2);
    productWords.forEach(word => {
        if (searchText.includes(word.toLowerCase())) {
            score += 4;
        }
    });

    // Color verification (very important)
    const colorWords = targetColorLower.split(/[\/\-\s]/).filter(word => word.length > 2);
    colorWords.forEach(word => {
        if (searchText.includes(word.toLowerCase())) {
            score += 8;
        }
    });

    // Bonus for exact colorway match
    if (colorway && targetColorLower.includes(colorway)) {
        score += 5;
    }

    return score;
}

// Function to update product image in database
async function updateProductImageInDatabase(brand: string, model: string, imagePath: string): Promise<void> {
    try {
        const publicImagePath = imagePath.replace('./public', '');

        const { error } = await supabase
            .from('sneakers')
            .update({ image_url: publicImagePath })
            .eq('brand', brand)
            .eq('model', model)
            .limit(1);

        if (error) {
            console.log(`      ⚠️ Database update failed: ${error.message}`);
        } else {
            console.log(`      ✅ Database updated with new image`);
        }
    } catch (error) {
        console.log(`      ⚠️ Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Function to process a single product from database
async function processProductFromDatabase(sneaker: any, index: number, total: number): Promise<ProcessedProduct | null> {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📦 PRODUCT [${index}/${total}] - ${sneaker.brand} ${sneaker.model}`);
    console.log(`   Colorway: ${sneaker.colorway || 'N/A'} | Price: $${sneaker.price}`);

    try {
        // Step 1: Search with KicksDB
        console.log(`   🔍 STEP 1: KicksDB Search`);

        const searchQueries = [
            `${sneaker.brand} ${sneaker.model} ${sneaker.colorway || ''}`,
            `${sneaker.brand} ${sneaker.model}`,
            sneaker.model
        ];

        let allProducts: KicksDBProduct[] = [];

        for (let i = 0; i < Math.min(searchQueries.length, 2); i++) {
            const query = searchQueries[i].trim();
            console.log(`      🎯 Search ${i + 1}: "${query}"`);

            const searchResults = await searchKicksDB(query);

            if (searchResults.length > 0) {
                allProducts = allProducts.concat(searchResults);
                console.log(`      📊 +${searchResults.length} products found`);
            }

            if (i < Math.min(searchQueries.length, 2) - 1) {
                await delay(CONFIG.DELAY_BETWEEN_REQUESTS);
            }
        }

        if (allProducts.length === 0) {
            console.log(`   ❌ FAILURE: No products found`);
            return null;
        }

        // Score and sort products
        const scoredProducts = allProducts.map(product => ({
            ...product,
            matchScore: scoreProductMatch(product, sneaker.brand, sneaker.model, sneaker.colorway || '')
        })).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

        const bestMatch = scoredProducts[0];
        console.log(`   ✅ BEST MATCH: "${bestMatch.name || bestMatch.title}" (score: ${bestMatch.matchScore})`);

        // Step 2: Extract images
        console.log(`   📸 STEP 2: Extract images`);
        const imageUrls = extractImagesFromProduct(bestMatch);

        if (imageUrls.length === 0) {
            console.log(`   ❌ FAILURE: No images found`);
            return null;
        }

        console.log(`   🖼️ ${imageUrls.length} images found`);

        // Step 3: Download images
        console.log(`   💾 STEP 3: Download images`);
        const outputDir = createDirectories(sneaker.brand, sneaker.model, sneaker.colorway || 'default');
        console.log(`   📁 Directory: ${outputDir}`);

        const images: Array<{ path: string; url: string; index: number }> = [];
        let imageCount = 0;

        const imagesToDownload = imageUrls.slice(0, CONFIG.MAX_IMAGES_PER_VARIANT);

        for (let i = 0; i < imagesToDownload.length; i++) {
            try {
                const imageUrl = imagesToDownload[i];
                const imageName = i === 0 ? 'main.jpg' : `image_${i + 1}.jpg`;
                const imagePath = `${outputDir}/${imageName}`;

                await downloadImage(imageUrl, imagePath);
                images.push({
                    path: imagePath,
                    url: imageUrl,
                    index: i
                });
                imageCount++;

                // Update database with main image
                if (i === 0) {
                    await updateProductImageInDatabase(sneaker.brand, sneaker.model, imagePath);
                }

                if (i < imagesToDownload.length - 1) {
                    await delay(500);
                }

            } catch (imageError) {
                console.log(`        ⚠️ Image ${i + 1} failed: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`);
            }
        }

        console.log(`   🎉 SUCCESS: ${imageCount} images downloaded`);

        return {
            productName: bestMatch.name || bestMatch.title || '',
            brand: bestMatch.brand || '',
            colorway: bestMatch.colorway,
            variant: sneaker.colorway || 'default',
            images: images,
            imageCount: imageCount,
            matchScore: bestMatch.matchScore || 0,
            outputDir: outputDir,
            price: bestMatch.price || bestMatch.lowestAsk,
            source: bestMatch.source || 'kicksdb',
            kicksDBData: {
                id: bestMatch.id,
                sku: bestMatch.sku,
                slug: bestMatch.slug
            }
        };

    } catch (error) {
        console.log(`   💥 ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return null;
    }
}

// Main function
async function main() {
    console.log('🚀 KICKSDB IMAGE SCRAPER');
    console.log('='.repeat(80));
    console.log('✅ Stable and reliable API');
    console.log('📊 1.4M+ products from StockX, GOAT, Shopify...');
    console.log('🎯 Clean and normalized data\n');

    // Check configuration
    if (CONFIG.API_KEY === 'YOUR_KICKSDB_KEY') {
        console.error('❌ MISSING CONFIGURATION:');
        console.log('\n📋 STEPS TO FOLLOW:');
        console.log('1. Go to https://kicks.dev');
        console.log('2. Create a free account');
        console.log('3. Get your API key');
        console.log('4. Set KICKSDB_API_KEY environment variable');
        console.log('5. Restart the script\n');
        console.log('💡 KicksDB offers a free plan to get started!');
        process.exit(1);
    }

    // Create images directory
    if (!fs.existsSync('./public/images/scraped')) {
        fs.mkdirSync('./public/images/scraped', { recursive: true });
    }

    // Fetch products from database
    console.log('📋 Fetching products from database...\n');

    const { data: sneakers, error } = await supabase
        .from('sneakers')
        .select('*')
        .eq('in_stock', true)
        .limit(10); // Limit for testing

    if (error) {
        console.error(`❌ Database error: ${error.message}`);
        process.exit(1);
    }

    if (!sneakers || sneakers.length === 0) {
        console.error('❌ No products found in database');
        process.exit(1);
    }

    console.log(`📋 ${sneakers.length} products to process\n`);

    const downloadResults: Array<{ original: any; downloaded: ProcessedProduct | null }> = [];
    let successCount = 0;
    let totalImages = 0;
    let apiCallsUsed = 0;

    const startTime = Date.now();

    for (let i = 0; i < sneakers.length; i++) {
        const sneaker = sneakers[i];

        const result = await processProductFromDatabase(sneaker, i + 1, sneakers.length);

        apiCallsUsed += 2; // Estimation: 2 API calls per product

        if (result) {
            downloadResults.push({ original: sneaker, downloaded: result });
            successCount++;
            totalImages += result.imageCount;
        } else {
            downloadResults.push({ original: sneaker, downloaded: null });
        }

        console.log(`   📊 Progress: ${successCount}/${sneakers.length} | ${totalImages} images | ${apiCallsUsed} API calls`);

        // Delay between each product
        if (i < sneakers.length - 1) {
            console.log(`   ⏳ Pause ${CONFIG.DELAY_BETWEEN_REQUESTS/1000}s...`);
            await delay(CONFIG.DELAY_BETWEEN_REQUESTS);
        }
    }

    const totalTime = Math.round((Date.now() - startTime) / 1000);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🎉 COMPLETED - KICKSDB API`);
    console.log(`${'='.repeat(80)}`);
    console.log(`⏱️ Time: ${Math.floor(totalTime / 60)}m ${totalTime % 60}s`);
    console.log(`✅ Success: ${successCount}/${sneakers.length} (${(successCount/sneakers.length*100).toFixed(1)}%)`);
    console.log(`📸 Images: ${totalImages} (average: ${(totalImages/successCount || 0).toFixed(1)}/product)`);
    console.log(`🔥 API calls: ${apiCallsUsed}`);
    console.log(`⚡ Speed: ${(apiCallsUsed/totalTime*60).toFixed(1)} API calls/minute`);

    const report = {
        timestamp: new Date().toISOString(),
        api_used: 'KicksDB',
        execution_time_seconds: totalTime,
        api_calls_used: apiCallsUsed,
        summary: {
            total_products: sneakers.length,
            successful_products: successCount,
            total_images: totalImages,
            success_rate: (successCount/sneakers.length*100).toFixed(1) + '%',
            avg_images_per_product: (totalImages/successCount || 0).toFixed(1),
            api_calls_per_minute: (apiCallsUsed/totalTime*60).toFixed(1)
        },
        results: downloadResults
    };

    fs.writeFileSync('./kicksdb_scraping_report.json', JSON.stringify(report, null, 2));
    console.log(`📄 Detailed report: ./kicksdb_scraping_report.json`);

    if (successCount > 0) {
        console.log(`🎯 Images organized in: ./public/images/scraped/`);
        console.log(`📁 Structure: brand/product/variant/`);
        console.log(`🔄 Database updated with new image URLs`);
    }

    console.log(`\n💡 KicksDB provides data from: StockX, GOAT, Flight Club, Stadium Goods and 40+ Shopify stores`);
}

main().catch(error => {
    console.error(`❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
});