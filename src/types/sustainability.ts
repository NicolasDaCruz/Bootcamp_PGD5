// Comprehensive Sustainability Types for Sneaker E-commerce
export interface SustainabilityScore {
  overall_score: number; // 0-100
  environmental_impact: number; // 0-100
  social_responsibility: number; // 0-100
  durability_rating: number; // 0-100
  recyclability_score: number; // 0-100
  carbon_footprint_kg: number;
  water_usage_liters: number;
  last_calculated: string;
}

export interface EcoCertification {
  id: string;
  name: string;
  organization: string;
  logo_url: string;
  description: string;
  verification_url?: string;
  expires_at?: string;
  credibility_score: number; // 0-100
}

export interface MaterialComposition {
  material_type: string;
  percentage: number;
  is_recycled: boolean;
  is_organic: boolean;
  is_vegan: boolean;
  sustainability_impact: 'positive' | 'neutral' | 'negative';
  source_region?: string;
}

export interface ManufacturingInfo {
  factory_location: string;
  fair_trade_certified: boolean;
  worker_safety_rating: number; // 0-100
  transportation_method: string;
  manufacturing_process: string[];
  energy_source: 'renewable' | 'mixed' | 'fossil';
}

export interface ProductSustainabilityProfile {
  product_id: string;
  sustainability_score: SustainabilityScore;
  eco_certifications: EcoCertification[];
  material_composition: MaterialComposition[];
  manufacturing_info: ManufacturingInfo;
  lifespan_estimate_years: number;
  repair_service_available: boolean;
  recycling_program_eligible: boolean;
  second_hand_value_retention: number; // 0-100
  sustainability_improvements_over_time: {
    version: string;
    improvements: string[];
    score_change: number;
  }[];
}

export interface CarbonFootprint {
  materials_extraction_kg: number;
  manufacturing_kg: number;
  transportation_kg: number;
  packaging_kg: number;
  end_of_life_kg: number;
  total_kg: number;
  offset_programs: string[];
}

export interface WaterFootprint {
  materials_liters: number;
  manufacturing_liters: number;
  dyeing_liters: number;
  total_liters: number;
}

export interface SustainabilityBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria: {
    min_score?: number;
    required_certifications?: string[];
    material_requirements?: string[];
  };
  rarity: 'common' | 'rare' | 'exclusive';
}

export interface UserSustainabilityProfile {
  user_id: string;
  sustainability_preference: 'high' | 'medium' | 'low';
  preferred_certifications: string[];
  carbon_footprint_target_kg: number;
  sustainability_achievements: string[];
  points_earned: number;
  trees_planted_equivalent: number;
}

export interface SustainabilityFilter {
  min_environmental_score?: number;
  required_certifications?: string[];
  max_carbon_footprint?: number;
  vegan_only?: boolean;
  recycled_materials_only?: boolean;
  fair_trade_only?: boolean;
  local_manufacturing_only?: boolean;
  repair_service_required?: boolean;
}

export interface RecyclingProgram {
  id: string;
  brand: string;
  program_name: string;
  description: string;
  accepted_products: string[];
  incentives: {
    discount_percentage?: number;
    store_credit_amount?: number;
    tree_planting?: number;
  };
  process_description: string[];
  environmental_impact: string;
}

export interface SecondHandListing {
  id: string;
  original_product_id: string;
  seller_id: string;
  condition: 'like_new' | 'excellent' | 'good' | 'fair' | 'poor';
  condition_assessment: {
    overall_score: number;
    upper_condition: number;
    sole_condition: number;
    interior_condition: number;
    box_included: boolean;
    original_accessories: boolean;
  };
  price: number;
  original_price: number;
  sustainability_impact_saved: {
    carbon_kg: number;
    water_liters: number;
    waste_prevented_kg: number;
  };
  verification_status: 'pending' | 'verified' | 'rejected';
  images: string[];
  size: string;
  purchase_date?: string;
}

export interface SustainabilityChallenge {
  id: string;
  title: string;
  description: string;
  type: 'individual' | 'community' | 'brand';
  target_metric: 'carbon_reduction' | 'recycling' | 'second_hand_purchases' | 'repair_services';
  target_value: number;
  reward: {
    points: number;
    discount: number;
    badge?: string;
    tree_planting?: number;
  };
  start_date: string;
  end_date: string;
  participants_count: number;
  current_progress: number;
}

// Utility types for API responses
export interface SustainabilityAnalytics {
  total_carbon_saved_kg: number;
  total_water_saved_liters: number;
  products_recycled: number;
  second_hand_purchases: number;
  repair_services_used: number;
  sustainability_score_trend: {
    date: string;
    score: number;
  }[];
}

export interface BrandSustainabilityRanking {
  brand: string;
  average_sustainability_score: number;
  total_products: number;
  certifications_count: number;
  improvement_trend: 'improving' | 'stable' | 'declining';
  notable_initiatives: string[];
}