'use client';

import { motion } from 'framer-motion';
import HeroSection from '../components/HeroSection';
import FeaturedProducts from '../components/FeaturedProducts';
import SustainabilitySection from '../components/SustainabilitySection';
import BrandsCarousel from '../components/BrandsCarousel';
import NewsletterSection from '../components/NewsletterSection';

export default function Home() {
  const handleSearch = (query: string) => {
    console.log('Search query:', query);
    // TODO: Implement search functionality
  };

  // Page transition variants
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const sectionVariants = {
    initial: {
      opacity: 0,
      y: 30
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  return (
    <motion.main
      className="min-h-screen"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.div variants={sectionVariants}>
        <HeroSection onSearch={handleSearch} />
      </motion.div>

      <motion.div variants={sectionVariants}>
        <FeaturedProducts />
      </motion.div>

      <motion.div variants={sectionVariants}>
        <SustainabilitySection />
      </motion.div>

      <motion.div variants={sectionVariants}>
        <BrandsCarousel />
      </motion.div>

      <motion.div variants={sectionVariants}>
        <NewsletterSection />
      </motion.div>
    </motion.main>
  );
}
