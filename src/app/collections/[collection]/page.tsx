import { notFound } from 'next/navigation';
import CollectionPage from '@/components/CollectionPage';
import { Metadata } from 'next';

// Define collection configurations
const collectionConfig = {
  men: {
    title: "Men's Collection",
    subtitle: "Premium Sneakers for Men",
    description: "Discover our curated selection of premium men's sneakers from iconic brands like Jordan, Nike, and adidas. From basketball legends to lifestyle classics.",
    heroGradient: "bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900",
    brandFilter: ['Jordan', 'Nike', 'adidas', 'New Balance', 'ASICS'],
    genderFilter: ['men', 'unisex'],
    categoryFilter: ['basketball', 'running', 'lifestyle', 'training'],
    tagFilter: ['basketball', 'athletic', 'performance', 'sport', 'premium'],
    heroImage: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1920&h=800&fit=crop" // Men's sneakers collection
  },
  women: {
    title: "Women's Collection",
    subtitle: "Stylish Sneakers for Women",
    description: "Explore our elegant collection of women's sneakers combining style, comfort, and performance. From casual lifestyle to athletic performance shoes.",
    heroGradient: "bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600",
    brandFilter: ['Nike', 'adidas', 'New Balance', 'ASICS', 'Jordan'],
    genderFilter: ['women', 'unisex'],
    categoryFilter: ['running', 'lifestyle', 'training', 'basketball'],
    tagFilter: ['lifestyle', 'running', 'comfort', 'fashion', 'athletic'],
    heroImage: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1920&h=800&fit=crop" // Women's sneakers collection
  },
  kids: {
    title: "Kids Collection",
    subtitle: "Fun & Comfortable",
    description: "Colorful, comfortable sneakers designed for active kids and growing feet. Durable construction meets playful designs.",
    heroGradient: "bg-gradient-to-r from-purple-500 to-pink-500",
    brandFilter: ['Nike', 'adidas', 'Jordan', 'New Balance'],
    genderFilter: ['kids', 'boys', 'girls', 'unisex'],
    ageGroupFilter: ['kids', 'youth', 'toddler'],
    categoryFilter: ['basketball', 'running', 'lifestyle'],
    tagFilter: ['kids', 'youth', 'colorful', 'durable', 'comfort'],
    heroImage: "https://images.unsplash.com/photo-1575537302964-96cd47c06b1b?w=1920&h=800&fit=crop" // Kids sneakers collection
  },
  sneakers: {
    title: "Athletic Sneakers",
    subtitle: "Performance & Sport",
    description: "High-performance athletic sneakers for serious athletes and sport enthusiasts. Cutting-edge technology meets superior comfort.",
    heroGradient: "bg-gradient-to-r from-blue-600 to-purple-700",
    brandFilter: ['Nike', 'adidas', 'ASICS', 'New Balance', 'Jordan'],
    categoryFilter: ['basketball', 'running', 'training'],
    performanceCategoryFilter: ['performance', 'athletic', 'sport'],
    tagFilter: ['performance', 'athletic', 'sport', 'technology', 'training'],
    heroImage: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=1920&h=800&fit=crop" // Athletic sneakers
  },
  lifestyle: {
    title: "Lifestyle Collection",
    subtitle: "Casual & Street Style",
    description: "Effortlessly cool sneakers for everyday wear and street style. Perfect blend of comfort, style, and versatility.",
    heroGradient: "bg-gradient-to-r from-emerald-600 to-teal-600",
    brandFilter: ['Nike', 'adidas', 'Jordan', 'New Balance'],
    categoryFilter: ['lifestyle'],
    performanceCategoryFilter: ['lifestyle', 'casual', 'fashion'],
    tagFilter: ['lifestyle', 'casual', 'street', 'fashion', 'everyday'],
    heroImage: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1920&h=800&fit=crop" // Lifestyle sneakers
  }
};

interface PageProps {
  params: {
    collection: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const config = collectionConfig[params.collection as keyof typeof collectionConfig];

  if (!config) {
    return {
      title: 'Collection Not Found',
      description: 'The requested collection could not be found.'
    };
  }

  return {
    title: `${config.title} | Premium Sneaker Collection`,
    description: config.description,
    keywords: config.tagFilter?.join(', '),
    openGraph: {
      title: config.title,
      description: config.description,
      images: [config.heroImage || '/api/placeholder/1200/630'],
    }
  };
}

export default function DynamicCollectionPage({ params }: PageProps) {
  const config = collectionConfig[params.collection as keyof typeof collectionConfig];

  if (!config) {
    notFound();
  }

  return (
    <CollectionPage
      title={config.title}
      subtitle={config.subtitle}
      description={config.description}
      heroGradient={config.heroGradient}
      brandFilter={config.brandFilter}
      genderFilter={config.genderFilter}
      ageGroupFilter={config.ageGroupFilter}
      categoryFilter={config.categoryFilter}
      performanceCategoryFilter={config.performanceCategoryFilter}
      tagFilter={config.tagFilter}
      heroImage={config.heroImage}
    />
  );
}

// Generate static params for known collections
export async function generateStaticParams() {
  return [
    { collection: 'men' },
    { collection: 'women' },
    { collection: 'kids' },
    { collection: 'sneakers' },
    { collection: 'lifestyle' }
  ];
}