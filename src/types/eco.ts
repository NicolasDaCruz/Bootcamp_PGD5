export interface EcoMetrics {
  carbonFootprint: number; // kg CO2
  sustainabilityScore: number; // 1-100
  recycledMaterials: number; // percentage
  waterUsage: number; // liters
  energyConsumption: number; // kWh
}

export interface EcoLabel {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface ProductCondition {
  id: string;
  name: string;
  description: string;
  priceReduction: number; // percentage
  qualityScore: number; // 1-10
}

export interface TradeInEstimate {
  productId: string;
  originalPrice: number;
  estimatedValue: number;
  condition: ProductCondition;
  factors: {
    brand: number;
    age: number;
    condition: number;
    marketDemand: number;
  };
}

export interface CarbonFootprintData {
  manufacturing: number;
  transportation: number;
  packaging: number;
  total: number;
  offsetOptions: OffsetOption[];
}

export interface OffsetOption {
  id: string;
  name: string;
  description: string;
  pricePerKg: number;
  verificationBody: string;
}

export interface EcoProduct {
  id: string;
  originalId: string;
  condition: ProductCondition;
  ecoMetrics: EcoMetrics;
  ecoLabels: EcoLabel[];
  reconditioning: ReconditioningInfo;
  isSecondLife: boolean;
}

export interface ReconditioningInfo {
  processDate: Date;
  technician: string;
  qualityCheck: QualityCheck[];
  warranty: number; // months
}

export interface QualityCheck {
  aspect: string;
  score: number;
  notes: string;
}

export interface EcoFriendlyOptions {
  packaging: PackagingOption[];
  shipping: ShippingOption[];
  carbonOffset: boolean;
}

export interface PackagingOption {
  id: string;
  name: string;
  description: string;
  ecoScore: number;
  additionalCost: number;
  materials: string[];
}

export interface ShippingOption {
  id: string;
  name: string;
  carbonFootprint: number;
  deliveryTime: string;
  cost: number;
  carrier: string;
}