import CollectionPage from '@/components/CollectionPage';

export default function LifestyleCollectionPage() {
  return (
    <CollectionPage
      title="Lifestyle Collection"
      subtitle="Casual & Street Style Sneakers"
      description="Effortlessly cool sneakers for everyday wear. From classic retros to modern lifestyle designs, perfect for casual outings and street style."
      heroGradient="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700"
      brandFilter={['Nike', 'adidas', 'Jordan', 'New Balance']}
      categoryFilter={['lifestyle']}
      performanceCategoryFilter={['lifestyle', 'casual', 'fashion']}
      tagFilter={['lifestyle', 'casual', 'retro', 'classic', 'street']}
      heroImage="/api/placeholder/1920/800"
    />
  );
}

export const metadata = {
  title: "Lifestyle Sneakers Collection | Casual Street Style Footwear",
  description: "Shop lifestyle sneakers for everyday wear. Casual, comfortable shoes perfect for street style and daily activities from top brands.",
};