'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  PhotoIcon,
  XMarkIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface CreateListingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (listingData: any) => void;
}

export function CreateListingForm({
  isOpen,
  onClose,
  onSubmit
}: CreateListingFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    model: '',
    size: '',
    condition: 'good' as const,
    price: '',
    originalPrice: '',
    purchaseDate: '',
    description: '',
    upperCondition: 80,
    soleCondition: 75,
    interiorCondition: 80,
    boxIncluded: false,
    originalAccessories: false,
    images: [] as string[]
  });

  const [previewImages, setPreviewImages] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages = Array.from(files).slice(0, 5 - previewImages.length);

    newImages.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreviewImages(prev => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const calculateSustainabilityImpact = () => {
    const originalPrice = parseFloat(formData.originalPrice) || 0;
    const carbonSaved = originalPrice * 0.08; // Rough estimate
    const waterSaved = originalPrice * 3.2;
    const wastePrevented = 0.85;

    return {
      carbonSaved: carbonSaved.toFixed(1),
      waterSaved: Math.round(waterSaved),
      wastePrevented: wastePrevented.toFixed(1)
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    const impact = calculateSustainabilityImpact();
    const listingData = {
      ...formData,
      images: previewImages,
      sustainabilityImpact: impact,
      overallConditionScore: Math.round(
        (formData.upperCondition + formData.soleCondition + formData.interiorCondition) / 3
      )
    };

    onSubmit?.(listingData);
    onClose();
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sneaker Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="e.g., Nike Air Max 90"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand
            </label>
            <select
              value={formData.brand}
              onChange={(e) => setFormData({...formData, brand: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Select Brand</option>
              <option value="Nike">Nike</option>
              <option value="Adidas">Adidas</option>
              <option value="Jordan">Jordan</option>
              <option value="Puma">Puma</option>
              <option value="New Balance">New Balance</option>
              <option value="Vans">Vans</option>
              <option value="Converse">Converse</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Size (US)
            </label>
            <select
              value={formData.size}
              onChange={(e) => setFormData({...formData, size: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Select Size</option>
              {Array.from({length: 11}, (_, i) => i + 7).map(size => (
                <option key={size} value={size.toString()}>{size}</option>
              ))}
              {Array.from({length: 8}, (_, i) => 7.5 + i).map(size => (
                <option key={size} value={size.toString()}>{size}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Condition
            </label>
            <select
              value={formData.condition}
              onChange={(e) => setFormData({...formData, condition: e.target.value as any})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="like_new">Like New</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Asking Price ($)
          </label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: e.target.value})}
            placeholder="89.99"
            min="1"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Original Price ($)
          </label>
          <input
            type="number"
            value={formData.originalPrice}
            onChange={(e) => setFormData({...formData, originalPrice: e.target.value})}
            placeholder="120.00"
            min="1"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Purchase Date (Optional)
        </label>
        <input
          type="date"
          value={formData.purchaseDate}
          onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Condition Assessment</h3>
        <p className="text-sm text-gray-600 mb-6">
          Be honest about the condition to ensure buyer satisfaction and successful sales.
        </p>

        <div className="space-y-6">
          {[
            { key: 'upperCondition', label: 'Upper Condition', description: 'Leather, fabric, stitching' },
            { key: 'soleCondition', label: 'Sole Condition', description: 'Outsole wear, tread depth' },
            { key: 'interiorCondition', label: 'Interior Condition', description: 'Insole, lining, padding' }
          ].map(({ key, label, description }) => (
            <div key={key}>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{label}</label>
                  <p className="text-xs text-gray-500">{description}</p>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {formData[key as keyof typeof formData]}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={formData[key as keyof typeof formData] as number}
                onChange={(e) => setFormData({
                  ...formData,
                  [key]: parseInt(e.target.value)
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-green"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Poor</span>
                <span>Fair</span>
                <span>Good</span>
                <span>Excellent</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <input
              type="checkbox"
              checked={formData.boxIncluded}
              onChange={(e) => setFormData({...formData, boxIncluded: e.target.checked})}
              className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Original Box Included</span>
              <p className="text-xs text-gray-500">Increases resale value</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <input
              type="checkbox"
              checked={formData.originalAccessories}
              onChange={(e) => setFormData({...formData, originalAccessories: e.target.checked})}
              className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Original Accessories</span>
              <p className="text-xs text-gray-500">Laces, insoles, etc.</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const impact = calculateSustainabilityImpact();

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Photos & Description</h3>

          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos (Up to 5)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {previewImages.map((image, index) => (
                <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img src={image} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {previewImages.length < 5 && (
                <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors">
                  <PhotoIcon className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Add Photo</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe any additional details about the condition, history, or special features..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Environmental Impact Preview */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🌍</span>
            <h4 className="font-semibold text-green-900">Environmental Impact</h4>
          </div>
          <p className="text-sm text-green-800 mb-3">
            By selling this item second-hand, you're helping to:
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="font-bold text-green-700">{impact.carbonSaved}kg</div>
              <div className="text-xs text-green-600">CO₂ Saved</div>
            </div>
            <div>
              <div className="font-bold text-green-700">{impact.waterSaved}L</div>
              <div className="text-xs text-green-600">Water Saved</div>
            </div>
            <div>
              <div className="font-bold text-green-700">{impact.wastePrevented}kg</div>
              <div className="text-xs text-green-600">Waste Prevented</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">List Your Sneakers</h2>
            <p className="text-sm text-gray-600">Step {step} of 3</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-green-600 h-2 rounded-full"
              initial={{ width: '33%' }}
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => step > 1 ? setStep(step - 1) : onClose()}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              {step > 1 ? 'Previous' : 'Cancel'}
            </button>

            <button
              type="submit"
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {step < 3 ? 'Next Step' : (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  Create Listing
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      <style jsx>{`
        .slider-green::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
        }

        .slider-green::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </motion.div>
  );
}