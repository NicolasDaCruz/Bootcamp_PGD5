import CollectionPage from '@/components/CollectionPage';

export default function SneakersCollectionPage() {
  return (
    <CollectionPage
      title="Athletic Sneakers"
      subtitle="Performance & Sport Sneakers"
      description="High-performance athletic sneakers designed for serious athletes and sport enthusiasts. Basketball, running, training, and specialized sport footwear."
      heroGradient="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700"
      brandFilter={['Jordan', 'Nike', 'adidas', 'ASICS', 'New Balance']}
      categoryFilter={['basketball', 'running', 'training']}
      performanceCategoryFilter={['performance', 'athletic', 'sport']}
      tagFilter={['athletic', 'performance', 'sport', 'basketball', 'running']}
      heroImage="/api/placeholder/1920/800"
    />
  );
}

export const metadata = {
  title: "Athletic Sneakers Collection | Performance Sports Footwear",
  description: "Shop premium athletic sneakers for basketball, running, and training. Performance footwear from Jordan, Nike, adidas, and more.",
};