import CollectionPage from '@/components/CollectionPage';

export default function MenCollectionPage() {
  return (
    <CollectionPage
      title="Men's Collection"
      subtitle="Premium Sneakers for Men"
      description="Discover our curated selection of premium men's sneakers from iconic brands like Jordan, Nike, and adidas. From basketball legends to lifestyle classics."
      heroGradient="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900"
      brandFilter={['Jordan', 'Nike', 'adidas', 'New Balance', 'ASICS']}
      genderFilter={['men', 'unisex']}
      categoryFilter={['basketball', 'running', 'lifestyle', 'training']}
      tagFilter={['basketball', 'athletic', 'performance', 'sport', 'premium']}
      heroImage="/api/placeholder/1920/800"
    />
  );
}

export const metadata = {
  title: "Men's Sneaker Collection | Premium Athletic Footwear",
  description: "Shop our premium men's sneaker collection featuring Jordan, Nike, adidas and more. Basketball, running, and lifestyle sneakers for the modern man.",
};