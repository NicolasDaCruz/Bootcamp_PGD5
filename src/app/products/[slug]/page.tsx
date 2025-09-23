'use client';

import { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Heart,
  ShoppingCart,
  Plus,
  Minus,
  Truck,
  Shield,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Share2,
  Facebook,
  Twitter,
  Instagram,
  Check,
  AlertCircle,
  AlertTriangle,
  X,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  User,
  Calendar,
  Send,
  Filter,
  SortDesc
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import RelatedProducts from '@/components/RelatedProducts';
import { supabase } from '@/lib/supabase';
import StockManagementPanel from '@/components/product/StockManagementPanel';
import { useVendorAuth } from '@/hooks/useVendorAuth';
import { useProductStock } from '@/hooks/useProductStock';

// Fetch real-time size data from database API
const fetchProductSizes = async (productId: string) => {
  try {
    const response = await fetch(`/api/products/${productId}/sizes`);
    if (!response.ok) {
      throw new Error(`Failed to fetch sizes: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching product sizes:', error);
    return null;
  }
};

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

// Enhanced Product interface with additional details
interface ProductDetail {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  images: string[];
  rating: number;
  reviewCount: number;
  isNew?: boolean;
  isOnSale?: boolean;
  category: string;
  vendorId?: string;
  variants?: {
    id: string;
    size: string;
    color?: string;
    sku: string;
    stock_quantity: number;
    price_modifier: number;
    is_active: boolean;
  }[];
  colors: {
    name: string;
    value: string;
    image?: string;
  }[];
  sizes: {
    name: string;
    stock: number;
    price?: number;
  }[];
  description: string;
  features: string[];
  specifications: {
    material: string;
    weight?: string;
    origin: string;
    style: string;
  };
  tags: string[];
  relatedProducts?: string[];
  reviews?: Review[];
  lowStockThreshold?: number;
}

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  verified: boolean;
  helpful: number;
  notHelpful: number;
  size?: string;
  fit?: 'tight' | 'true' | 'loose';
  comfort?: number;
  quality?: number;
  images?: string[];
}

interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
  fitDistribution: { tight: number; true: number; loose: number };
  averageComfort: number;
  averageQuality: number;
}

// Fetch product data with real variants from database
const getProductData = async (slug: string): Promise<ProductDetail | null> => {
  try {
    // The slug format from frontend: brand-model-sku (e.g., adidas-stan-smith-fx5500-9)
    // First, try to get products with their variants including comprehensive stock info
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        brand,
        price,
        description,
        vendor_id,
        low_stock_threshold,
        is_active,
        product_images (
          image_url,
          is_primary,
          alt_text
        ),
        product_variants (
          id,
          name,
          value,
          size,
          eu_size,
          us_size,
          uk_size,
          stock_quantity,
          reserved_quantity,
          computed_available_stock,
          sku,
          price_adjustment,
          is_active,
          variant_type
        )
      `)
      .eq('is_active', true);

    if (productsError || !products) {
      console.log('No products found in products table, falling back to sneakers');
      return await getProductDataFromSneakers(slug);
    }

    // Find product that matches our slug
    const matchedProduct = products.find(product => {
      const generatedSlug = createSlug(product.brand, product.name, 'product');
      return generatedSlug.includes(slug.toLowerCase()) || slug.toLowerCase().includes(generatedSlug);
    });

    if (matchedProduct && matchedProduct.product_variants.length > 0) {
      return mapProductToProductDetail(matchedProduct, slug);
    }

    // Fallback to sneakers table if no products match
    return await getProductDataFromSneakers(slug);
  } catch (error) {
    console.error('Error fetching product data:', error);
    return await getProductDataFromSneakers(slug);
  }
};

// Fallback function for sneakers table
const getProductDataFromSneakers = async (slug: string): Promise<ProductDetail | null> => {
  try {
    const { data: sneakers, error } = await supabase
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
      .eq('in_stock', true);

    if (error || !sneakers) {
      console.error('Error fetching sneakers:', error);
      return null;
    }

    // Find the sneaker that matches our slug
    const matchedSneaker = sneakers.find(sneaker => {
      const generatedSlug = createSlug(sneaker.brand, sneaker.model, sneaker.sku);
      return generatedSlug === slug.toLowerCase();
    });

    if (!matchedSneaker) {
      console.log(`No sneaker found for slug: ${slug}`);
      return null;
    }

    return mapSneakerToProductDetail(matchedSneaker, slug);
  } catch (error) {
    console.error('Error fetching sneaker data:', error);
    return null;
  }
};

// Map products table data with real variants to ProductDetail format
const mapProductToProductDetail = (product: any, slug: string): ProductDetail => {
  const colorName = 'Default';
  const colorValue = getColorValue(colorName);

  // Filter and map real variants from database (prioritize size variants)
  const sizeVariants = product.product_variants
    .filter((variant: any) => variant.is_active && (variant.variant_type === 'size' || variant.eu_size || variant.us_size || variant.size))
    .sort((a: any, b: any) => {
      // Sort by EU size if available, otherwise by US size or value
      if (a.eu_size && b.eu_size) {
        return Number(a.eu_size) - Number(b.eu_size);
      }
      if (a.us_size && b.us_size) {
        return Number(a.us_size) - Number(b.us_size);
      }
      return (a.value || '').localeCompare(b.value || '');
    });

  // Map real variants with accurate stock information
  const variants = sizeVariants.map((variant: any) => {
    const availableStock = variant.computed_available_stock ??
                          Math.max(0, variant.stock_quantity - (variant.reserved_quantity || 0));

    // Determine size display
    const sizeDisplay = variant.eu_size ? variant.eu_size.toString() :
                       variant.us_size ? variant.us_size.toString() :
                       variant.size || variant.value || '40';

    return {
      id: variant.id,
      size: sizeDisplay,
      color: colorName,
      sku: variant.sku || `${product.name}-${sizeDisplay}`,
      stock_quantity: availableStock, // Use available stock, not total stock
      price_modifier: parseFloat(variant.price_adjustment || '0'),
      is_active: variant.is_active,
      eu_size: variant.eu_size,
      us_size: variant.us_size,
      uk_size: variant.uk_size,
      total_stock: variant.stock_quantity,
      reserved_stock: variant.reserved_quantity || 0
    };
  });

  // Create sizes array from variants with real stock data
  const sizes = variants.map((variant: any) => {
    const sizeLabel = variant.eu_size ? `EU ${variant.eu_size}` :
                     variant.us_size ? `US ${variant.us_size}` :
                     `Size ${variant.size}`;

    return {
      name: sizeLabel,
      stock: variant.stock_quantity, // Available stock for display
      price: product.price + variant.price_modifier,
      total_stock: variant.total_stock,
      reserved_stock: variant.reserved_stock,
      variant_id: variant.id
    };
  });

  // Get images from product_images or fallback
  const images = product.product_images && product.product_images.length > 0
    ? product.product_images
        .sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
        .map((img: any) => img.image_url)
    : ['/api/placeholder/800/800', '/api/placeholder/800/800', '/api/placeholder/800/800'];

  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    price: parseFloat(product.price),
    originalPrice: undefined,
    vendorId: product.vendor_id,
    images,
    rating: 4.5 + Math.random() * 0.5,
    reviewCount: Math.floor(Math.random() * 200) + 50,
    isNew: Math.random() > 0.8,
    isOnSale: false,
    category: 'Sneakers',
    variants,
    colors: [
      { name: colorName, value: colorValue, image: images[0] || '/api/placeholder/400/400' }
    ],
    sizes,
    lowStockThreshold: product.low_stock_threshold || 5,
    description: product.description || `The ${product.brand} ${product.name} is a premium sneaker that combines style, comfort, and performance. This authentic pair features high-quality materials and attention to detail.`,
    features: [
      `Premium ${product.brand} construction`,
      'High-quality materials',
      'Comfortable fit and feel',
      'Authentic design',
      'Durable outsole'
    ],
    specifications: {
      material: 'Premium Synthetic/Leather',
      weight: '1.2-1.8 lbs',
      origin: 'Various',
      style: 'Lifestyle/Athletic'
    },
    tags: [product.brand.toLowerCase(), 'authentic', 'premium'],
    reviews: generateMockReviews()
  };
};

// Map KicksDB sneaker data to ProductDetail format
const mapSneakerToProductDetail = (sneaker: any, slug: string): ProductDetail => {
  const colorName = sneaker.colorway || 'Default';
  const colorValue = getColorValue(colorName);

  // Create variants from sizes
  const sizes = [
    { name: 'EU 40', stock: Math.floor(Math.random() * 10) + 1 },
    { name: 'EU 41', stock: Math.floor(Math.random() * 15) + 5 },
    { name: 'EU 42', stock: Math.floor(Math.random() * 12) + 3 },
    { name: 'EU 43', stock: Math.floor(Math.random() * 20) + 8 },
    { name: 'EU 44', stock: Math.floor(Math.random() * 8) + 2 },
    { name: 'EU 45', stock: Math.floor(Math.random() * 5) },
    { name: 'EU 46', stock: Math.floor(Math.random() * 3) }
  ];

  const variants = sizes.map((size, index) => ({
    id: `${sneaker.id}-${index}`,
    size: size.name.replace('EU ', ''),
    color: colorName,
    sku: `${sneaker.sku}-${size.name.replace('EU ', '')}`,
    stock_quantity: size.stock,
    price_modifier: 0,
    is_active: true
  }));

  return {
    id: sneaker.id,
    name: `${sneaker.brand} ${sneaker.model}`,
    brand: sneaker.brand,
    price: parseFloat(sneaker.price),
    originalPrice: undefined,
    vendorId: sneaker.vendor_id || null,
    images: [
      sneaker.image_url || '/api/placeholder/800/800',
      '/api/placeholder/800/800',
      '/api/placeholder/800/800'
    ],
    rating: 4.5 + Math.random() * 0.5,
    reviewCount: Math.floor(Math.random() * 200) + 50,
    isNew: Math.random() > 0.8,
    isOnSale: false,
    category: 'Sneakers',
    variants,
    colors: [
      { name: colorName, value: colorValue, image: sneaker.image_url || '/api/placeholder/400/400' }
    ],
    sizes,
    lowStockThreshold: 5,
    description: sneaker.description || `The ${sneaker.brand} ${sneaker.model} in ${colorName} is a premium sneaker that combines style, comfort, and performance. This authentic pair features high-quality materials and attention to detail that ${sneaker.brand} is known for.`,
    features: [
      `Premium ${sneaker.brand} construction`,
      'High-quality materials',
      'Comfortable fit and feel',
      'Authentic design',
      'Durable outsole'
    ],
    specifications: {
      material: 'Premium Synthetic/Leather',
      weight: '1.2-1.8 lbs',
      origin: 'Various',
      style: 'Lifestyle/Athletic'
    },
    tags: [sneaker.brand.toLowerCase(), 'authentic', 'premium', colorName.toLowerCase()],
    reviews: generateMockReviews()
  };
};

// Helper function to get color value from name
const getColorValue = (colorName: string): string => {
  const colorMap: { [key: string]: string } = {
    'black': '#000000',
    'white': '#FFFFFF',
    'red': '#DC143C',
    'blue': '#4169E1',
    'green': '#22C55E',
    'yellow': '#EAB308',
    'orange': '#F97316',
    'purple': '#8B5CF6',
    'pink': '#EC4899',
    'gray': '#6B7280',
    'grey': '#6B7280',
    'brown': '#A3845A'
  };

  const lowerName = colorName.toLowerCase();
  for (const [color, value] of Object.entries(colorMap)) {
    if (lowerName.includes(color)) {
      return value;
    }
  }

  return '#6B7280'; // Default gray
};

// Generate mock reviews for now
const generateMockReviews = (): Review[] => {
  const reviews: Review[] = [
    {
      id: '1',
      userId: 'user1',
      userName: 'Jordan S.',
      userAvatar: '/api/placeholder/40/40',
      rating: 5,
      title: 'Amazing quality and style!',
      comment: 'These sneakers exceeded my expectations. The quality is fantastic and they look even better in person. Very comfortable and true to size.',
      date: '2024-01-15',
      verified: true,
      helpful: 18,
      notHelpful: 1,
      size: 'EU 43',
      fit: 'true',
      comfort: 5,
      quality: 5
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Alex M.',
      userAvatar: '/api/placeholder/40/40',
      rating: 4,
      title: 'Great sneakers, fast shipping',
      comment: 'Love these! They arrived quickly and in perfect condition. The fit is great and they are very comfortable. Only minor issue is they attract dirt easily.',
      date: '2024-01-10',
      verified: true,
      helpful: 12,
      notHelpful: 2,
      size: 'EU 42',
      fit: 'true',
      comfort: 4,
      quality: 4
    },
    {
      id: '3',
      userId: 'user3',
      userName: 'Taylor R.',
      rating: 5,
      title: 'Perfect for everyday wear',
      comment: 'These have become my go-to sneakers. Super comfortable for walking and they look great with any outfit. Highly recommend!',
      date: '2024-01-05',
      verified: true,
      helpful: 9,
      notHelpful: 0,
      size: 'EU 41',
      fit: 'true',
      comfort: 5,
      quality: 5
    }
  ];

  return reviews;
};

// Calculate review summary statistics
const calculateReviewSummary = (reviews: Review[]): ReviewSummary => {
  if (!reviews || reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      fitDistribution: { tight: 0, true: 0, loose: 0 },
      averageComfort: 0,
      averageQuality: 0
    };
  }

  const totalReviews = reviews.length;
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;

  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(review => {
    ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
  });

  const fitDistribution = { tight: 0, true: 0, loose: 0 };
  reviews.forEach(review => {
    if (review.fit) {
      fitDistribution[review.fit]++;
    }
  });

  const comfortRatings = reviews.filter(r => r.comfort).map(r => r.comfort!);
  const qualityRatings = reviews.filter(r => r.quality).map(r => r.quality!);

  const averageComfort = comfortRatings.length > 0
    ? comfortRatings.reduce((sum, rating) => sum + rating, 0) / comfortRatings.length
    : 0;

  const averageQuality = qualityRatings.length > 0
    ? qualityRatings.reduce((sum, rating) => sum + rating, 0) / qualityRatings.length
    : 0;

  return {
    averageRating,
    totalReviews,
    ratingDistribution,
    fitDistribution,
    averageComfort,
    averageQuality
  };
};

interface ProductDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const resolvedParams = use(params);

  // ALL useState hooks MUST be at the top, before any conditional logic
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showImageModal, setShowImageModal] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<number | null>(null);
  const [reviewSort, setReviewSort] = useState<'newest' | 'oldest' | 'helpful'>('newest');
  const [wishlistMessage, setWishlistMessage] = useState('');
  const [cartMessage, setCartMessage] = useState('');
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [apiSizesData, setApiSizesData] = useState(null);
  const [sizesLoading, setSizesLoading] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    title: '',
    comment: '',
    size: '',
    fit: 'true' as 'tight' | 'true' | 'loose',
    comfort: 0,
    quality: 0
  });

  // ALL useContext hooks MUST be after useState hooks, before conditional logic
  const { addToCartWithNotification } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isVendor, canManageProduct } = useVendorAuth();

  // Product stock hook - only initialize when we have a product ID
  const {
    stockData,
    variants: stockVariants,
    loading: stockLoading,
    error: stockError,
    getVariantBySize,
    isVariantAvailable,
    getStockStatus,
    getAvailableStock,
    getStockMessage,
    getSortedVariants,
    updateVariantStock,
    refetch: refetchStock
  } = useProductStock({
    productId: product?.id || '',
    sizeOnly: true,
    enableRealtime: true
  });

  // Fetch product data from KicksDB
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productData = await getProductData(resolvedParams.slug);
        if (!productData) {
          notFound();
          return;
        }
        setProduct(productData);

        // Fetch real-time size data from API
        if (productData.id) {
          setSizesLoading(true);
          try {
            const sizesData = await fetchProductSizes(productData.id);
            if (sizesData && sizesData.sizes) {
              setApiSizesData(sizesData);
              console.log('✅ Real-time sizes loaded:', sizesData);
            }
          } catch (error) {
            console.warn('⚠️ Could not load real-time sizes, using fallback data');
          } finally {
            setSizesLoading(false);
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [resolvedParams.slug]);

  // Handle keyboard navigation for image gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showImageModal && product) {
        if (e.key === 'ArrowLeft') {
          setSelectedImageIndex((prev) =>
            prev === 0 ? product.images.length - 1 : prev - 1
          );
        } else if (e.key === 'ArrowRight') {
          setSelectedImageIndex((prev) =>
            prev === product.images.length - 1 ? 0 : prev + 1
          );
        } else if (e.key === 'Escape') {
          setShowImageModal(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showImageModal, product]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  // Check if product is in wishlist
  const isFavorite = isInWishlist(product.id);

  // Calculate review summary
  const reviewSummary = calculateReviewSummary(product.reviews || []);

  // Helper function to get size options from database-driven API data only
  const getSizeOptions = () => {
    // Primary: Use real-time API data (highest priority)
    if (apiSizesData && apiSizesData.sizes) {
      return apiSizesData.sizes
        .filter(size => size.size != null) // Filter out null sizes
        .map(size => ({
          size: size.size,
          name: `EU ${size.size}`, // Format consistently as EU size
          availableStock: size.availableStock,
          stockQuantity: size.stockQuantity,
          price: size.price,
          id: size.id,
          sku: size.sku,
          isAvailable: size.isAvailable,
          isLowStock: size.isLowStock,
          isOutOfStock: size.isOutOfStock
        }));
    }

    // Secondary: Use stock hook data if available (database-driven)
    if (stockData && getSortedVariants().length > 0) {
      return getSortedVariants().map(variant => ({
        size: variant.size_display,
        name: variant.size_display,
        availableStock: variant.available_stock,
        stockQuantity: variant.stock_quantity || variant.available_stock,
        id: variant.id,
        sku: variant.sku,
        isAvailable: variant.available_stock > 0,
        isLowStock: variant.available_stock <= (product.lowStockThreshold || 5) && variant.available_stock > 0,
        isOutOfStock: variant.available_stock <= 0,
        price: 0 // Price adjustment handled at product level
      }));
    }

    // Final fallback: Use mapped product variants (database-driven)
    if (product.variants && product.variants.length > 0) {
      return product.variants.map(variant => ({
        size: variant.size,
        name: variant.eu_size ? `EU ${variant.eu_size}` :
              variant.us_size ? `US ${variant.us_size}` :
              `Size ${variant.size}`,
        availableStock: variant.stock_quantity,
        stockQuantity: variant.total_stock || variant.stock_quantity,
        id: variant.id,
        sku: variant.sku,
        isAvailable: variant.stock_quantity > 0,
        isLowStock: variant.stock_quantity <= (product.lowStockThreshold || 5) && variant.stock_quantity > 0,
        isOutOfStock: variant.stock_quantity <= 0,
        price: variant.price_modifier || 0
      }));
    }

    // No fallback to hardcoded sizes - return empty array if no database data available
    console.warn('⚠️ No database-driven size data available for product:', product.id);
    return [];
  };

  // Helper function to get selected size stock
  const getSelectedSizeStock = () => {
    if (!selectedSize) return 0;

    const sizeOptions = getSizeOptions();
    const selectedSizeData = sizeOptions.find(size =>
      size.name === selectedSize || size.size === selectedSize.replace('EU ', '')
    );
    return selectedSizeData?.availableStock || selectedSizeData?.stock || 0;
  };

  // Helper function to get selected variant ID
  const getSelectedVariantId = () => {
    if (!selectedSize) return null;

    const sizeOptions = getSizeOptions();
    const selectedSizeData = sizeOptions.find(size =>
      size.name === selectedSize || size.size === selectedSize.replace('EU ', '')
    );
    return selectedSizeData?.id || selectedSizeData?.variant_id || null;
  };

  const displayStock = getSelectedSizeStock();
  const displayVariantId = getSelectedVariantId();

  // Get stock for selected size using real data from stock hook
  const selectedVariant = selectedSize && stockData
    ? getVariantBySize(selectedSize)
    : null;

  const selectedSizeStock = selectedVariant?.available_stock || 0;
  const selectedVariantId = selectedVariant?.id || null;
  const selectedVariantStatus = selectedVariant?.status || 'out_of_stock';

  const isInStock = selectedSize ? displayStock > 0 : true;

  // Handle quantity changes
  const updateQuantity = (delta: number) => {
    const newQuantity = quantity + delta;
    const maxStock = displayStock;
    if (newQuantity >= 1 && newQuantity <= maxStock) {
      setQuantity(newQuantity);
    }
  };

  // Handle image navigation
  const nextImage = () => {
    setSelectedImageIndex((prev) =>
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) =>
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  // Handle wishlist animation
  const handleWishlistToggle = () => {
    const wishlistItem = {
      id: product.id,
      productId: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.images[0],
      category: product.category,
      rating: product.rating,
      reviewCount: product.reviewCount,
      isNew: product.isNew,
      isOnSale: product.isOnSale,
      dateAdded: new Date().toISOString(),
      slug: resolvedParams.slug
    };

    const result = toggleWishlist(wishlistItem);
    setWishlistMessage(result.message);
    setTimeout(() => setWishlistMessage(''), 2000);
  };

  // Filter and sort reviews
  const filteredAndSortedReviews = (product.reviews || [])
    .filter(review => reviewFilter === null || review.rating === reviewFilter)
    .sort((a, b) => {
      switch (reviewSort) {
        case 'newest':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'oldest':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'helpful':
          return (b.helpful - b.notHelpful) - (a.helpful - a.notHelpful);
        default:
          return 0;
      }
    });

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }

    // Get current variant data from API or fallback
    const currentStock = displayStock;
    const currentVariantId = displayVariantId;

    if (currentStock === 0) {
      alert('This size is out of stock');
      return;
    }

    if (quantity > currentStock) {
      alert(`Only ${currentStock} items available for this size`);
      return;
    }

    // Additional stock validation using real-time data
    if (currentVariantId) {
      try {
        // Refresh stock data before adding to cart to ensure accuracy
        const latestSizesData = await fetchProductSizes(product.id);
        if (latestSizesData && latestSizesData.sizes) {
          const latestSizeData = latestSizesData.sizes.find(s =>
            s.size === selectedSize.replace('EU ', '') || `EU ${s.size}` === selectedSize
          );
          if (!latestSizeData || latestSizeData.availableStock < quantity) {
            alert(`Stock changed. Only ${latestSizeData?.availableStock || 0} items available now.`);
            setApiSizesData(latestSizesData); // Update local state
            return;
          }
        }
      } catch (error) {
        console.warn('Could not verify current stock levels, proceeding with cached data');
      }
    }

    setIsAddingToCart(true);

    try {
      // Calculate the actual price (base price + variant adjustment)
      const sizeOptions = getSizeOptions();
      const selectedSizeData = sizeOptions.find(size =>
        size.name === selectedSize || size.size === selectedSize.replace('EU ', '')
      );
      const variantPrice = selectedSizeData?.price || product.price;

      await addToCartWithNotification({
        productId: product.id,
        variantId: currentVariantId,
        name: product.name,
        brand: product.brand,
        price: variantPrice,
        image: product.images[0],
        size: selectedSize,
        color: product.colors[selectedColor].name,
        quantity: quantity,
        maxStock: currentStock
      });

      setCartMessage('Added to cart successfully!');
      setTimeout(() => setCartMessage(''), 3000);

      // Refresh stock data after adding to cart
      setTimeout(async () => {
        try {
          const refreshedSizes = await fetchProductSizes(product.id);
          if (refreshedSizes) {
            setApiSizesData(refreshedSizes);
          }
          if (stockData) {
            refetchStock();
          }
        } catch (error) {
          console.warn('Could not refresh stock data after cart addition');
        }
      }, 1000);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Handle review submission
  const handleSubmitReview = () => {
    if (newReview.rating === 0 || !newReview.title || !newReview.comment) {
      alert('Please fill in all required fields');
      return;
    }

    // In a real app, this would submit to an API
    console.log('New review:', newReview);
    setShowReviewForm(false);
    setNewReview({
      rating: 0,
      title: '',
      comment: '',
      size: '',
      fit: 'true',
      comfort: 0,
      quality: 0
    });
    alert('Review submitted successfully!');
  };


  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <nav className="flex text-sm text-slate-600 dark:text-slate-400">
            <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/products" className="hover:text-blue-600 dark:hover:text-blue-400">
              Products
            </Link>
            <span className="mx-2">/</span>
            <span className="text-slate-900 dark:text-white">{product.name}</span>
          </nav>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-6 py-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <motion.div variants={itemVariants} className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg">
              {/* Product Badges */}
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                {product.isNew && (
                  <span className="bg-green-500 text-white text-sm font-semibold px-3 py-1 rounded-full">
                    NEW
                  </span>
                )}
                {product.isOnSale && (
                  <span className="bg-red-500 text-white text-sm font-semibold px-3 py-1 rounded-full">
                    SALE
                  </span>
                )}
              </div>

              {/* Zoom Button */}
              <button
                onClick={() => setShowImageModal(true)}
                className="absolute top-4 right-4 z-10 w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <ZoomIn className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </button>

              {/* Navigation Arrows */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-white/80 dark:bg-slate-800/80 rounded-full flex items-center justify-center shadow-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-white/80 dark:bg-slate-800/80 rounded-full flex items-center justify-center shadow-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Main Product Image */}
              <Image
                src={product.images[selectedImageIndex]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-blue-600 ring-2 ring-blue-600/30'
                        : 'border-slate-200 dark:border-slate-600 hover:border-blue-400'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} view ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Details */}
          <motion.div variants={itemVariants} className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-medium text-blue-600 dark:text-blue-400">
                  {product.brand}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShareOpen(!shareOpen)}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Share2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
                  <div className="relative">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleWishlistToggle}
                      className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Heart
                        className={`w-6 h-6 transition-all duration-300 ${
                          isFavorite
                            ? 'text-red-500 fill-red-500 drop-shadow-md'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      />
                    </motion.button>

                    {/* Wishlist notification */}
                    <AnimatePresence>
                      {wishlistMessage && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.8 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.8 }}
                          className="absolute -bottom-12 right-0 bg-green-600 text-white text-xs px-3 py-1 rounded-full whitespace-nowrap shadow-lg"
                        >
                          {wishlistMessage}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-slate-600 dark:text-slate-400">
                  {product.rating} ({product.reviewCount} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">
                  €{product.price}
                </span>
                {product.originalPrice && (
                  <>
                    <span className="text-xl text-slate-500 dark:text-slate-400 line-through">
                      €{product.originalPrice}
                    </span>
                    <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                      -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                Color: {product.colors[selectedColor].name}
              </h3>
              <div className="flex gap-3">
                {product.colors.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedColor(index)}
                    className={`w-12 h-12 rounded-full border-2 transition-all ${
                      selectedColor === index
                        ? 'border-blue-600 ring-2 ring-blue-600/30 scale-110'
                        : 'border-slate-300 dark:border-slate-600 hover:border-blue-400'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Size {selectedSize && getSelectedSizeStock() > 0 && `(${getSelectedSizeStock()} available)`}
                </h3>
                {(sizesLoading || stockLoading) && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Loading stock...
                  </span>
                )}
                {stockError && (
                  <span className="text-xs text-red-500">
                    Stock unavailable
                  </span>
                )}
                {apiSizesData && (
                  <span className="text-xs text-green-600 dark:text-green-400">
                    Real-time stock
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-3">
                {getSizeOptions().map((sizeItem, index) => {
                  const sizeName = sizeItem.name; // Use formatted name (e.g., "EU 40")
                  const availableStock = sizeItem.availableStock || sizeItem.stock || 0;
                  const isOutOfStock = availableStock === 0;
                  const isLowStock = availableStock > 0 && availableStock <= 5;
                  const stockStatus = isOutOfStock ? 'out_of_stock' :
                                    isLowStock ? 'low_stock' : 'in_stock';

                  // Create a unique key that combines name and id or index
                  const uniqueKey = sizeItem.id || `${sizeName}-${index}`;

                  return (
                    <div key={uniqueKey} className="relative">
                      <button
                        onClick={() => {
                          setSelectedSize(sizeName);
                          setQuantity(1);
                        }}
                        disabled={isOutOfStock}
                        className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 relative overflow-hidden ${
                          selectedSize === sizeName
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-md transform scale-105'
                            : isOutOfStock
                            ? 'border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                            : isLowStock
                            ? 'border-yellow-300 dark:border-yellow-600 hover:border-yellow-400 text-slate-700 dark:text-slate-300 bg-yellow-50 dark:bg-yellow-900/10'
                            : 'border-green-200 dark:border-green-700 hover:border-blue-400 text-slate-700 dark:text-slate-300 bg-green-50/30 dark:bg-green-900/10'
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-medium">{sizeName}</div>
                          {/* Stock status indicator with icons */}
                          {availableStock > 0 && (
                            <div className={`flex items-center justify-center gap-1 text-xs mt-1 font-medium ${
                              isLowStock ? 'text-yellow-700 dark:text-yellow-400' : 'text-green-700 dark:text-green-400'
                            }`}>
                              <div className={`w-2 h-2 rounded-full ${
                                isLowStock ? 'bg-yellow-500' : 'bg-green-500'
                              }`}></div>
                              {isLowStock ? `${availableStock} left` : 'Available'}
                            </div>
                          )}
                          {/* Out of stock indicator */}
                          {isOutOfStock && (
                            <div className="flex items-center justify-center gap-1 text-xs mt-1 font-medium text-red-600 dark:text-red-400">
                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                              Unavailable
                            </div>
                          )}
                          {/* Detailed stock info for vendors */}
                          {isVendor && canManageProduct(product.vendorId) && (
                            <div className={`text-xs mt-1 ${
                              isOutOfStock ? 'text-red-500' :
                              isLowStock ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              {availableStock} units
                              {sizeItem.stockQuantity && sizeItem.stockQuantity !== availableStock && (
                                <span className="text-slate-500"> ({sizeItem.stockQuantity - availableStock} reserved)</span>
                              )}
                            </div>
                          )}
                        </div>
                        {/* Visual stock status overlay */}
                        <div className={`absolute top-1 right-1 w-3 h-3 rounded-full border border-white dark:border-slate-800 shadow-sm ${
                          isOutOfStock ? 'bg-red-500' :
                          isLowStock ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></div>
                        {isOutOfStock && (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 dark:bg-slate-700/80 backdrop-blur-sm">
                            <div className="text-red-500 font-bold text-xs transform -rotate-12">SOLD OUT</div>
                          </div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Stock Summary Dashboard */}
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                {/* Real-time stock indicator */}
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-slate-900 dark:text-white">Stock Overview</h4>
                  {apiSizesData ? (
                    <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Live updates
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                      Cached data
                    </div>
                  )}
                </div>

                {/* Stock statistics */}
                {(apiSizesData || stockData) && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {apiSizesData ? apiSizesData.availableVariants : (stockData?.in_stock_variants || 0)}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">Available</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {apiSizesData ? apiSizesData.lowStockVariants : (stockData?.low_stock_variants || 0)}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">Low Stock</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {apiSizesData ? apiSizesData.outOfStockVariants : (stockData?.out_of_stock_variants || 0)}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">Out of Stock</div>
                    </div>
                  </div>
                )}

                {/* Vendor-specific warnings */}
                {isVendor && canManageProduct(product.vendorId) && (
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-600">
                    {apiSizesData && (
                      <>
                        {apiSizesData.lowStockVariants > 0 && (
                          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-sm mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                            <AlertTriangle className="w-4 h-4" />
                            <span>
                              {apiSizesData.lowStockVariants} size(s) need restocking soon
                            </span>
                          </div>
                        )}
                        {apiSizesData.outOfStockVariants > 0 && (
                          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm p-2 bg-red-50 dark:bg-red-900/20 rounded">
                            <AlertCircle className="w-4 h-4" />
                            <span>
                              {apiSizesData.outOfStockVariants} size(s) require immediate restocking
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    {stockData && !apiSizesData && (
                      <>
                        {stockData.low_stock_variants > 0 && (
                          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-sm mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                            <AlertTriangle className="w-4 h-4" />
                            <span>
                              {stockData.low_stock_variants} size(s) need restocking soon
                            </span>
                          </div>
                        )}
                        {stockData.out_of_stock_variants > 0 && (
                          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm p-2 bg-red-50 dark:bg-red-900/20 rounded">
                            <AlertCircle className="w-4 h-4" />
                            <span>
                              {stockData.out_of_stock_variants} require immediate restocking
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Fallback message when no stock data available */}
                {!apiSizesData && !stockData && (
                  <div className="text-center text-slate-500 dark:text-slate-400 text-sm py-4">
                    <div className="w-8 h-8 mx-auto mb-2 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center">
                      <span className="text-xs">?</span>
                    </div>
                    Stock information unavailable
                  </div>
                )}
              </div>
            </div>

            {/* Quantity Selection */}
            {selectedSize && isInStock && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                  Quantity
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-lg">
                    <button
                      onClick={() => updateQuantity(-1)}
                      disabled={quantity <= 1}
                      className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(1)}
                      disabled={quantity >= displayStock}
                      className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {displayStock} available
                  </span>
                </div>
              </motion.div>
            )}

            {/* Add to Cart Button */}
            <div className="space-y-3 relative">
              {selectedSize ? (
                isInStock ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className={`w-5 h-5 ${isAddingToCart ? 'animate-pulse' : ''}`} />
                    {isAddingToCart ? 'Adding...' : `Add to Cart - €${(product.price * quantity).toFixed(2)}`}
                  </motion.button>
                ) : (
                  <button
                    disabled
                    className="w-full bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 py-4 rounded-xl text-lg font-semibold cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <AlertCircle className="w-5 h-5" />
                    Out of Stock
                  </button>
                )
              ) : (
                <button
                  disabled
                  className="w-full bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 py-4 rounded-xl text-lg font-semibold cursor-not-allowed"
                >
                  Select a Size
                </button>
              )}

              {/* Cart Success Message */}
              <AnimatePresence>
                {cartMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.8 }}
                    className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg whitespace-nowrap"
                  >
                    {cartMessage}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <Truck className="w-6 h-6 text-green-600" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white text-sm">
                    Free Shipping
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    On orders over $100
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <RotateCcw className="w-6 h-6 text-blue-600" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white text-sm">
                    Easy Returns
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    30-day return policy
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-purple-600" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white text-sm">
                    Authenticity
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    100% authentic guarantee
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                Description
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {product.description}
              </p>

              {/* Features */}
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Key Features:
                </h4>
                <ul className="space-y-1">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Specifications */}
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Specifications:
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-slate-600 dark:text-slate-400">Material:</div>
                  <div className="text-slate-900 dark:text-white">{product.specifications.material}</div>

                  {product.specifications.weight && (
                    <>
                      <div className="text-slate-600 dark:text-slate-400">Weight:</div>
                      <div className="text-slate-900 dark:text-white">{product.specifications.weight}</div>
                    </>
                  )}

                  <div className="text-slate-600 dark:text-slate-400">Origin:</div>
                  <div className="text-slate-900 dark:text-white">{product.specifications.origin}</div>

                  <div className="text-slate-600 dark:text-slate-400">Style:</div>
                  <div className="text-slate-900 dark:text-white">{product.specifications.style}</div>
                </div>
              </div>
            </div>

            {/* Stock Management Panel - Only for vendors */}
            {isVendor && product.variants && canManageProduct(product.vendorId) && (
              <div className="mt-8">
                <StockManagementPanel
                  productId={product.id}
                  productName={product.name}
                  vendorId={product.vendorId || null}
                  variants={product.variants}
                  lowStockThreshold={product.lowStockThreshold || 5}
                  onStockUpdate={async (variantId, newStock) => {
                    // Refresh stock data from both the hook and API
                    refetchStock();

                    try {
                      const refreshedSizes = await fetchProductSizes(product.id);
                      if (refreshedSizes) {
                        setApiSizesData(refreshedSizes);
                      }
                    } catch (error) {
                      console.warn('Could not refresh API stock data');
                    }

                    // Also update local product state for immediate feedback
                    setProduct(prev => {
                      if (!prev || !prev.variants) return prev;
                      return {
                        ...prev,
                        variants: prev.variants.map(v =>
                          v.id === variantId
                            ? { ...v, stock_quantity: newStock }
                            : v
                        ),
                        sizes: prev.sizes.map(s => {
                          const variant = prev.variants?.find(v => `EU ${v.size}` === s.name);
                          if (variant && variant.id === variantId) {
                            return { ...s, stock: newStock };
                          }
                          return s;
                        })
                      };
                    });
                  }}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700"
                />
              </div>
            )}
          </motion.div>
        </div>

        {/* Reviews Section */}
        <motion.div
          variants={itemVariants}
          className="mt-16 space-y-8"
        >
          {/* Reviews Header */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Customer Reviews
            </h2>

            {/* Review Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Overall Rating */}
              <div className="text-center">
                <div className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                  {reviewSummary.averageRating.toFixed(1)}
                </div>
                <div className="flex justify-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-6 h-6 ${
                        i < Math.floor(reviewSummary.averageRating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-slate-600 dark:text-slate-400">
                  Based on {reviewSummary.totalReviews} reviews
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = reviewSummary.ratingDistribution[rating];
                  const percentage = reviewSummary.totalReviews > 0
                    ? (count / reviewSummary.totalReviews) * 100
                    : 0;
                  return (
                    <div key={rating} className="flex items-center gap-2 text-sm">
                      <span className="w-8 text-slate-600 dark:text-slate-400">
                        {rating}★
                      </span>
                      <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-slate-600 dark:text-slate-400">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Additional Metrics */}
              <div className="space-y-4">
                {reviewSummary.averageComfort > 0 && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600 dark:text-slate-400">Comfort</span>
                      <span className="text-slate-900 dark:text-white">
                        {reviewSummary.averageComfort.toFixed(1)}/5
                      </span>
                    </div>
                    <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(reviewSummary.averageComfort / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {reviewSummary.averageQuality > 0 && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600 dark:text-slate-400">Quality</span>
                      <span className="text-slate-900 dark:text-white">
                        {reviewSummary.averageQuality.toFixed(1)}/5
                      </span>
                    </div>
                    <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(reviewSummary.averageQuality / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Fit Distribution */}
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Fit</div>
                  <div className="space-y-1 text-xs">
                    {Object.entries(reviewSummary.fitDistribution).map(([fit, count]) => {
                      const percentage = reviewSummary.totalReviews > 0
                        ? (count / reviewSummary.totalReviews) * 100
                        : 0;
                      return (
                        <div key={fit} className="flex justify-between">
                          <span className="capitalize text-slate-600 dark:text-slate-400">
                            {fit === 'true' ? 'True to size' : fit}
                          </span>
                          <span className="text-slate-900 dark:text-white">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Write Review Button */}
            <div className="flex justify-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowReviewForm(true)}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Write a Review
              </motion.button>
            </div>
          </div>

          {/* Review Filters and Sort */}
          {(product.reviews?.length || 0) > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Filter by rating:
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setReviewFilter(null)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        reviewFilter === null
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      All
                    </button>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setReviewFilter(rating)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          reviewFilter === rating
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        {rating}★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <SortDesc className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <select
                    value={reviewSort}
                    onChange={(e) => setReviewSort(e.target.value as 'newest' | 'oldest' | 'helpful')}
                    className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="helpful">Most helpful</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {filteredAndSortedReviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg"
              >
                <div className="flex items-start gap-4">
                  {/* User Avatar */}
                  <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                    {review.userAvatar ? (
                      <Image
                        src={review.userAvatar}
                        alt={review.userName}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <User className="w-6 h-6 text-slate-500" />
                    )}
                  </div>

                  <div className="flex-1">
                    {/* Review Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900 dark:text-white">
                            {review.userName}
                          </h4>
                          {review.verified && (
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-2 py-0.5 rounded-full">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Calendar className="w-4 h-4" />
                          {new Date(review.date).toLocaleDateString()}
                          {review.size && (
                            <>
                              <span>•</span>
                              <span>Size: {review.size}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Review Content */}
                    <h5 className="font-semibold text-slate-900 dark:text-white mb-2">
                      {review.title}
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                      {review.comment}
                    </p>

                    {/* Additional Ratings */}
                    {(review.fit || review.comfort || review.quality) && (
                      <div className="flex flex-wrap gap-6 mb-4 text-sm">
                        {review.fit && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600 dark:text-slate-400">Fit:</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              review.fit === 'true'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : review.fit === 'tight'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            }`}>
                              {review.fit === 'true' ? 'True to size' : review.fit}
                            </span>
                          </div>
                        )}
                        {review.comfort && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600 dark:text-slate-400">Comfort:</span>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < review.comfort!
                                      ? 'text-blue-400 fill-blue-400'
                                      : 'text-slate-300 dark:text-slate-600'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        {review.quality && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600 dark:text-slate-400">Quality:</span>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < review.quality!
                                      ? 'text-green-400 fill-green-400'
                                      : 'text-slate-300 dark:text-slate-600'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Helpful Actions */}
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Was this helpful?
                      </span>
                      <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                          <ThumbsUp className="w-4 h-4" />
                          {review.helpful}
                        </button>
                        <button className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                          <ThumbsDown className="w-4 h-4" />
                          {review.notHelpful}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Image Modal */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setShowImageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={product.images[selectedImageIndex]}
                alt={product.name}
                width={800}
                height={800}
                className="object-contain max-h-[90vh] rounded-lg"
              />

              {/* Close Button */}
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Navigation */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {shareOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShareOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Share this product
              </h3>
              <div className="flex gap-4">
                <button className="flex-1 bg-blue-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors">
                  <Facebook className="w-5 h-5" />
                  Facebook
                </button>
                <button className="flex-1 bg-sky-500 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-sky-600 transition-colors">
                  <Twitter className="w-5 h-5" />
                  Twitter
                </button>
                <button className="flex-1 bg-pink-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-pink-700 transition-colors">
                  <Instagram className="w-5 h-5" />
                  Instagram
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Form Modal */}
      <AnimatePresence>
        {showReviewForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowReviewForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Write a Review
                </h3>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Overall Rating */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Overall Rating *
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setNewReview({ ...newReview, rating })}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            rating <= newReview.rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-slate-300 dark:text-slate-600 hover:text-yellow-400'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Title */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Review Title *
                  </label>
                  <input
                    type="text"
                    value={newReview.title}
                    onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                    placeholder="Summarize your experience"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Review Comment */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Your Review *
                  </label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    placeholder="Share your thoughts about this product..."
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Size and Fit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Size Purchased
                    </label>
                    <select
                      value={newReview.size}
                      onChange={(e) => setNewReview({ ...newReview, size: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select size</option>
                      {product.sizes.map((size) => (
                        <option key={size.name} value={size.name}>
                          {size.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      How does it fit?
                    </label>
                    <select
                      value={newReview.fit}
                      onChange={(e) => setNewReview({ ...newReview, fit: e.target.value as 'tight' | 'true' | 'loose' })}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="true">True to size</option>
                      <option value="tight">Runs small/tight</option>
                      <option value="loose">Runs large/loose</option>
                    </select>
                  </div>
                </div>

                {/* Comfort and Quality Ratings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Comfort Rating
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setNewReview({ ...newReview, comfort: rating })}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              rating <= newReview.comfort
                                ? 'text-blue-400 fill-blue-400'
                                : 'text-slate-300 dark:text-slate-600 hover:text-blue-400'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Quality Rating
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setNewReview({ ...newReview, quality: rating })}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              rating <= newReview.quality
                                ? 'text-green-400 fill-green-400'
                                : 'text-slate-300 dark:text-slate-600 hover:text-green-400'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setShowReviewForm(false)}
                    className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmitReview}
                    disabled={!newReview.rating || !newReview.title || !newReview.comment}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Submit Review
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Related Products */}
      <RelatedProducts
        currentProduct={{
          id: product.id,
          category: product.category,
          brand: product.brand,
          tags: product.tags,
          price: product.price
        }}
      />
    </div>
  );
}

// Note: Metadata generation is handled at the layout level for client components