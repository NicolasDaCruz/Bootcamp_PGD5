'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Upload,
  X,
  Plus,
  Trash2,
  Save,
  Eye
} from 'lucide-react';

interface ProductVariant {
  id: string;
  name: string;
  value: string;
  size?: string;
  stock_quantity: number;
  price_adjustment: number;
}

interface ProductForm {
  name: string;
  brand: string;
  description: string;
  category_id: string;
  price: number;
  images: string[];
  variants: ProductVariant[];
  status: 'draft' | 'pending';
}

export default function NewProductPage() {
  const [form, setForm] = useState<ProductForm>({
    name: '',
    brand: '',
    description: '',
    category_id: '',
    price: 0,
    images: [],
    variants: [],
    status: 'draft'
  });
  const [loading, setLoading] = useState(false);
  const [isVendor, setIsVendor] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [currentVariant, setCurrentVariant] = useState<Partial<ProductVariant>>({
    name: '',
    value: '',
    size: '',
    stock_quantity: 0,
    price_adjustment: 0
  });

  const router = useRouter();


  const variantTypes = [
    { name: 'Size', value: 'size' },
    { name: 'Color', value: 'color' },
    { name: 'Material', value: 'material' },
    { name: 'Style', value: 'style' }
  ];

  useEffect(() => {
    const checkVendor = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in to add products');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('role, id')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'vendeur' || profile?.role === 'vendor' || profile?.role === 'admin') {
        setIsVendor(true);
        setVendorId(profile.id);
      } else {
        setError('Access denied. Vendor privileges required.');
      }
    };

    const loadCategories = async () => {
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (categoriesData) {
        setCategories(categoriesData);
      }
    };

    checkVendor();
    loadCategories();
  }, []);

  const handleImageUrlChange = (index: number, url: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = url;
    setImageUrls(newUrls);

    // Update form images (filter out empty URLs)
    setForm(prev => ({
      ...prev,
      images: newUrls.filter(url => url.trim() !== '')
    }));
  };

  const addImageUrl = () => {
    setImageUrls([...imageUrls, '']);
  };

  const removeImageUrl = (index: number) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls);
    setForm(prev => ({
      ...prev,
      images: newUrls.filter(url => url.trim() !== '')
    }));
  };

  const addVariant = () => {
    if (!currentVariant.name || !currentVariant.value) {
      alert('Please fill in variant name and value');
      return;
    }

    if ((currentVariant.price_adjustment || 0) < 0) {
      alert('Price adjustment cannot be negative');
      return;
    }

    const newVariant: ProductVariant = {
      id: `variant-${Date.now()}`,
      name: currentVariant.name || '',
      value: currentVariant.value || '',
      size: currentVariant.size,
      stock_quantity: currentVariant.stock_quantity || 0,
      price_adjustment: currentVariant.price_adjustment || 0
    };

    setForm(prev => ({
      ...prev,
      variants: [...prev.variants, newVariant]
    }));

    // Reset current variant
    setCurrentVariant({
      name: '',
      value: '',
      size: '',
      stock_quantity: 0,
      price_adjustment: 0
    });
  };

  const removeVariant = (variantId: string) => {
    setForm(prev => ({
      ...prev,
      variants: prev.variants.filter(v => v.id !== variantId)
    }));
  };

  const handleSubmit = async (status: 'draft' | 'pending') => {
    if (!vendorId) {
      setError('Vendor ID not found');
      return;
    }

    if (!form.name || !form.brand || !form.category_id || form.price <= 0) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Generate SKU and slug
      const sku = `${form.brand.toUpperCase().replace(/\s+/g, '')}-${form.name.toUpperCase().replace(/\s+/g, '').substring(0, 10)}-${Date.now().toString().slice(-6)}`;
      const slug = `${form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}-${Date.now().toString().slice(-6)}`;

      // Create product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: form.name,
          brand: form.brand,
          description: form.description,
          category_id: form.category_id,
          price: form.price,
          sku,
          slug,
          vendor_id: vendorId,
          stock_quantity: 0,
          low_stock_threshold: 5,
          manage_stock: true,
          allow_backorders: false,
          is_active: status === 'pending',
          is_featured: false
        })
        .select()
        .single();

      if (productError) throw productError;

      // Create product images if any
      if (form.images.length > 0) {
        const productImages = form.images.map((imageUrl, index) => ({
          product_id: product.id,
          image_url: imageUrl,
          alt_text: `${form.name} - Image ${index + 1}`,
          is_primary: index === 0,
          sort_order: index + 1
        }));

        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(productImages);

        if (imagesError) throw imagesError;
      }

      // Create variants if any
      if (form.variants.length > 0) {
        const variants = form.variants.map(variant => ({
          product_id: product.id,
          name: variant.name,
          value: variant.value,
          size: variant.size || null,
          stock_quantity: variant.stock_quantity || 0,
          price_adjustment: Math.max(0, Number(variant.price_adjustment) || 0),
          sku: `${sku}-${variant.value.toUpperCase()}`,
          is_active: true
        }));

        const { error: variantsError } = await supabase
          .from('product_variants')
          .insert(variants);

        if (variantsError) throw variantsError;
      }

      // Redirect to products list
      router.push('/vendor/products');

    } catch (err) {
      console.error('Error creating product:', err);
      setError('Failed to create product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isVendor && error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/vendor/products"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
              <p className="text-gray-600 mt-1">Create a new product listing for your store</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form className="space-y-6">

          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Air Jordan 1 Retro High"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand *
                </label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={(e) => setForm(prev => ({ ...prev, brand: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Nike"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm(prev => ({ ...prev, category_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your product features, materials, and details..."
              />
            </div>
          </div>

          {/* Product Images */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h2>
            <div className="space-y-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-1">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => handleImageUrlChange(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  {url && (
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  {imageUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImageUrl(index)}
                      className="p-2 text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addImageUrl}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Image</span>
              </button>
            </div>
          </div>

          {/* Product Variants */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Variants</h2>

            {/* Add Variant Form */}
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="text-md font-medium text-gray-900 mb-3">Add Variant</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Variant Type
                  </label>
                  <select
                    value={currentVariant.name}
                    onChange={(e) => setCurrentVariant(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Type</option>
                    {variantTypes.map(type => (
                      <option key={type.value} value={type.name}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value
                  </label>
                  <input
                    type="text"
                    value={currentVariant.value}
                    onChange={(e) => setCurrentVariant(prev => ({ ...prev, value: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 42, Red, Leather"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={currentVariant.stock_quantity}
                    onChange={(e) => setCurrentVariant(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Adjustment
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentVariant.price_adjustment}
                      onChange={(e) => setCurrentVariant(prev => ({ ...prev, price_adjustment: Math.max(0, parseFloat(e.target.value) || 0) }))}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addVariant}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Add Variant
                  </button>
                </div>
              </div>
            </div>

            {/* Variants List */}
            {form.variants.length > 0 && (
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">Added Variants</h3>
                <div className="space-y-2">
                  {form.variants.map((variant) => (
                    <div key={variant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <span className="font-medium">{variant.name}: {variant.value}</span>
                        <span className="text-gray-500 ml-2">
                          • Stock: {variant.stock_quantity}
                          {variant.price_adjustment !== 0 && (
                            <span> • Price: ${(form.price + variant.price_adjustment).toFixed(2)}</span>
                          )}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVariant(variant.id)}
                        className="p-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">
                  <strong>Draft:</strong> Save for later editing<br />
                  <strong>Submit for Review:</strong> Send to admin for approval
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => handleSubmit('draft')}
                  disabled={loading}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4 inline mr-2" />
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit('pending')}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Eye className="w-4 h-4 inline mr-2" />
                  Submit for Review
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}