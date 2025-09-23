import CollectionPage from '@/components/CollectionPage';

export default function WomenCollectionPage() {
  return (
    <CollectionPage
      title="Women's Collection"
      subtitle="Stylish Sneakers for Women"
      description="Explore our elegant collection of women's sneakers combining style, comfort, and performance. From casual lifestyle to athletic performance shoes."
      heroGradient="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600"
      brandFilter={['Nike', 'adidas', 'New Balance', 'ASICS', 'Jordan']}
      genderFilter={['women', 'unisex']}
      categoryFilter={['running', 'lifestyle', 'training', 'basketball']}
      tagFilter={['lifestyle', 'running', 'comfort', 'fashion', 'athletic']}
      heroImage="/api/placeholder/1920/800"
    />
  );
}

export const metadata = {
  title: "Women's Sneaker Collection | Stylish Athletic Footwear",
  description: "Shop our women's sneaker collection featuring stylish and comfortable shoes for every lifestyle. Nike, adidas, and more premium brands.",
};