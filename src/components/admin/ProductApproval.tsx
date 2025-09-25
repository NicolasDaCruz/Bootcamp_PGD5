'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Check,
  X,
  Eye,
  AlertCircle,
  Package,
  DollarSign,
  User,
  Calendar
} from 'lucide-react';
import Image from 'next/image';

interface PendingProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  vendor_id: string;
  vendor_name?: string;
  original_image_urls: string[] | null;
  images?: string[]; // fallback for compatibility
  category: string;
  brand: string;
  sizes: any[];
  created_at: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
}

export default function ProductApproval() {
  const [pendingProducts, setPendingProducts] = useState<PendingProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<PendingProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  // Helper function to safely get product images
  const getProductImages = (product: PendingProduct): string[] => {
    // Try original_image_urls first (primary field)
    if (product.original_image_urls && Array.isArray(product.original_image_urls) && product.original_image_urls.length > 0) {
      return product.original_image_urls;
    }
    // Fallback to images field for compatibility
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images;
    }
    return [];
  };

  useEffect(() => {
    fetchPendingProducts();
  }, [filter]);

  const fetchPendingProducts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('products')
        .select(`
          *,
          vendor:users!vendor_id (
            full_name,
            email,
            vendor_name
          )
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('approval_status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedProducts = data?.map(product => ({
        ...product,
        vendor_name: product.vendor?.vendor_name || product.vendor?.full_name || 'Unknown Vendor'
      })) || [];

      setPendingProducts(formattedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveProduct = async (productId: string) => {
    try {
      setProcessing(true);

      const { error } = await supabase.rpc('admin_review_product', {
        product_id: productId,
        status: 'approved',
        reason: null
      });

      if (error) throw error;

      alert('Product approved successfully!');
      setSelectedProduct(null);
      fetchPendingProducts();
    } catch (error) {
      console.error('Error approving product:', error);
      alert('Failed to approve product');
    } finally {
      setProcessing(false);
    }
  };

  const rejectProduct = async (productId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(true);

      const { error } = await supabase.rpc('admin_review_product', {
        product_id: productId,
        status: 'rejected',
        reason: rejectionReason
      });

      if (error) throw error;

      alert('Product rejected');
      setSelectedProduct(null);
      setRejectionReason('');
      fetchPendingProducts();
    } catch (error) {
      console.error('Error rejecting product:', error);
      alert('Failed to reject product');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Rejected</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Product Approval</h2>

        <div className="flex gap-2">
          {['pending', 'approved', 'rejected', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-2 rounded-lg capitalize ${
                filter === status
                  ? 'bg-black text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-2">
          <AlertCircle className="text-yellow-500" />
          <span className="font-semibold">
            {pendingProducts.filter(p => p.approval_status === 'pending').length}
          </span>
          <span className="text-gray-600">Pending Review</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="text-green-500" />
          <span className="font-semibold">
            {pendingProducts.filter(p => p.approval_status === 'approved').length}
          </span>
          <span className="text-gray-600">Approved</span>
        </div>
        <div className="flex items-center gap-2">
          <X className="text-red-500" />
          <span className="font-semibold">
            {pendingProducts.filter(p => p.approval_status === 'rejected').length}
          </span>
          <span className="text-gray-600">Rejected</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading products...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
{(() => {
                const productImages = getProductImages(product);
                return productImages.length > 0 ? (
                  <div className="relative h-48">
                    <Image
                      src={productImages[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(product.approval_status)}
                    </div>
                  </div>
                ) : (
                  <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-400" />
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(product.approval_status)}
                    </div>
                  </div>
                );
              })()}

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <p className="text-sm text-gray-500">{product.brand}</p>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{product.vendor_name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span>${product.price}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(product.created_at).toLocaleDateString()}</span>
                </div>

                {product.rejection_reason && (
                  <div className="p-2 bg-red-50 rounded text-sm text-red-600">
                    <strong>Rejection Reason:</strong> {product.rejection_reason}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200"
                  >
                    <Eye className="w-4 h-4 inline mr-1" />
                    View Details
                  </button>
                  {product.approval_status === 'pending' && (
                    <>
                      <button
                        onClick={() => approveProduct(product.id)}
                        disabled={processing}
                        className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setRejectionReason('');
                        }}
                        disabled={processing}
                        className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        <X className="w-4 h-4 inline" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Product Review</h3>
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setRejectionReason('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Product Images</h4>
                <div className="grid grid-cols-2 gap-2">
                  {(() => {
                    const selectedImages = getProductImages(selectedProduct);
                    return selectedImages.length > 0 ? (
                      selectedImages.map((img, idx) => (
                        <div key={idx} className="relative h-32">
                          <Image
                            src={img}
                            alt={`Product ${idx + 1}`}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 h-32 bg-gray-100 flex items-center justify-center rounded">
                        <div className="text-center">
                          <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No images available</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold">Product Details</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Name:</strong> {selectedProduct.name}<br />
                    <strong>Brand:</strong> {selectedProduct.brand}<br />
                    <strong>Category:</strong> {selectedProduct.category}<br />
                    <strong>Price:</strong> ${selectedProduct.price}<br />
                    <strong>Vendor:</strong> {selectedProduct.vendor_name}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold">Description</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedProduct.description}
                  </p>
                </div>

                {selectedProduct.approval_status === 'pending' && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Action</h4>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Rejection reason (if rejecting)..."
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveProduct(selectedProduct.id)}
                        disabled={processing}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        Approve Product
                      </button>
                      <button
                        onClick={() => rejectProduct(selectedProduct.id)}
                        disabled={processing}
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject Product
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}