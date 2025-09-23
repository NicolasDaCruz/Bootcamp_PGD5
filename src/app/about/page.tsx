'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Shield, Heart, Globe, Award, Users, Zap, ArrowRight, Mail, Phone, MapPin } from 'lucide-react';

export default function AboutPage() {
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  };

  const sectionVariants = {
    initial: { opacity: 0, y: 30 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay: 0.2 }
    }
  };

  const values = [
    {
      icon: Shield,
      title: "Authenticity Guaranteed",
      description: "Every sneaker in our collection is verified for authenticity. We work directly with authorized retailers and brands to ensure you get genuine products."
    },
    {
      icon: Heart,
      title: "Community First",
      description: "Built by sneakerheads, for sneakerheads. We understand the passion and culture behind every release, drop, and collaboration."
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "From limited releases in Tokyo to exclusive drops in New York, we bring the world's best sneakers to your doorstep."
    },
    {
      icon: Award,
      title: "Quality Service",
      description: "Premium packaging, fast shipping, and exceptional customer support. Your satisfaction is our top priority."
    }
  ];

  const team = [
    {
      name: "Alex Chen",
      role: "Founder & CEO",
      description: "20+ years in sneaker culture, former Nike executive"
    },
    {
      name: "Jordan Smith",
      role: "Head of Authenticity",
      description: "Expert authenticator with 15+ years experience"
    },
    {
      name: "Mia Rodriguez",
      role: "Community Manager",
      description: "Connecting sneakerheads worldwide"
    }
  ];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
    >
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-6"
          >
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">SneakerVault</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed"
          >
            We're more than just a sneaker store. We're a community of passionate collectors,
            trend-setters, and culture enthusiasts dedicated to bringing you the most coveted
            footwear from around the globe.
          </motion.p>
        </div>
      </section>

      {/* Story Section */}
      <motion.section
        variants={sectionVariants}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="py-16 px-6"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-slate-600 dark:text-slate-300">
                <p>
                  Founded in 2020 by a group of sneaker enthusiasts, SneakerVault was born from a simple
                  idea: everyone deserves access to authentic, high-quality sneakers, regardless of where
                  they are in the world.
                </p>
                <p>
                  What started as a small collection shared among friends has grown into a global platform
                  serving thousands of sneaker lovers. We've built relationships with trusted suppliers,
                  developed rigorous authentication processes, and created a community where passion for
                  sneaker culture thrives.
                </p>
                <p>
                  Today, we're proud to offer everything from daily wearables to rare collectibles,
                  all backed by our guarantee of authenticity and quality.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
                <div className="flex items-center space-x-4 mb-6">
                  <Users className="w-8 h-8" />
                  <div>
                    <div className="text-3xl font-bold">50K+</div>
                    <div className="text-blue-100">Happy Customers</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4 mb-6">
                  <Zap className="w-8 h-8" />
                  <div>
                    <div className="text-3xl font-bold">100K+</div>
                    <div className="text-blue-100">Sneakers Sold</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Award className="w-8 h-8" />
                  <div>
                    <div className="text-3xl font-bold">99.9%</div>
                    <div className="text-blue-100">Authenticity Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Values Section */}
      <motion.section
        variants={sectionVariants}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="py-16 px-6 bg-white dark:bg-slate-800"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Our Values
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center p-6 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {value.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    {value.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Team Section */}
      <motion.section
        variants={sectionVariants}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="py-16 px-6"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              The passionate people behind SneakerVault
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-200"
              >
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4"></div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">
                  {member.name}
                </h3>
                <p className="text-blue-600 dark:text-blue-400 text-center font-medium mb-3">
                  {member.role}
                </p>
                <p className="text-slate-600 dark:text-slate-300 text-center">
                  {member.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Contact Section */}
      <motion.section
        variants={sectionVariants}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="py-16 px-6 bg-white dark:bg-slate-800"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Get In Touch
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Have questions? We'd love to hear from you.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <Mail className="w-8 h-8 text-blue-600 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Email</h3>
              <p className="text-slate-600 dark:text-slate-300">support@sneakervault.com</p>
            </div>
            <div className="text-center p-6">
              <Phone className="w-8 h-8 text-blue-600 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Phone</h3>
              <p className="text-slate-600 dark:text-slate-300">+1 (555) 123-4567</p>
            </div>
            <div className="text-center p-6">
              <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Address</h3>
              <p className="text-slate-600 dark:text-slate-300">123 Sneaker St, Fashion District, NY</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Legal Section */}
      <motion.section
        variants={sectionVariants}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="py-16 px-6"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Legal Information
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Your privacy and rights matter to us
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            {/* GDPR Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                <Shield className="w-6 h-6 mr-3 text-blue-600" />
                GDPR Compliance
              </h3>
              <div className="space-y-4 text-slate-600 dark:text-slate-300">
                <p>
                  <strong>Data Protection:</strong> We are committed to protecting your personal data
                  in accordance with the General Data Protection Regulation (GDPR).
                </p>
                <p>
                  <strong>Your Rights:</strong> You have the right to access, rectify, erase, restrict
                  processing, data portability, and object to processing of your personal data.
                </p>
                <p>
                  <strong>Data Collection:</strong> We only collect data necessary for providing our
                  services, including order processing, authentication, and customer support.
                </p>
                <p>
                  <strong>Consent:</strong> By using our services, you consent to our data processing
                  practices as outlined in our Privacy Policy.
                </p>
              </div>
              <Link
                href="/privacy"
                className="inline-flex items-center mt-6 text-blue-600 hover:text-blue-700 font-medium"
              >
                Read Full Privacy Policy <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>

            {/* CGV Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                <Award className="w-6 h-6 mr-3 text-blue-600" />
                Terms & Conditions (CGV)
              </h3>
              <div className="space-y-4 text-slate-600 dark:text-slate-300">
                <p>
                  <strong>Product Authenticity:</strong> All products are guaranteed authentic.
                  Full refund available if authenticity is disputed.
                </p>
                <p>
                  <strong>Returns:</strong> 30-day return policy for unworn items in original
                  packaging. Return shipping costs may apply.
                </p>
                <p>
                  <strong>Pricing:</strong> Prices are subject to change. Orders are confirmed
                  at checkout with final pricing.
                </p>
                <p>
                  <strong>Shipping:</strong> Delivery times are estimates. We are not responsible
                  for delays by shipping carriers.
                </p>
                <p>
                  <strong>Warranty:</strong> Manufacturing defects are covered for 6 months
                  from purchase date.
                </p>
              </div>
              <Link
                href="/terms"
                className="inline-flex items-center mt-6 text-blue-600 hover:text-blue-700 font-medium"
              >
                Read Full Terms <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>

          {/* Additional Legal Info */}
          <div className="mt-12 bg-slate-100 dark:bg-slate-700 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Company Information
            </h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-slate-600 dark:text-slate-300">
              <div>
                <p><strong>Company Name:</strong> DCN Web</p>
                <p><strong>Registration:</strong> Lyon, France</p>
                <p><strong>Tax ID:</strong> 12-3456789</p>
              </div>
              <div>
                <p><strong>Founded:</strong> 2025</p>
                <p><strong>Data Protection Officer:</strong> pro.dcnweb@gmail.com</p>
                <p><strong>Customer Service:</strong> Available 24/7</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        variants={sectionVariants}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="py-16 px-6 bg-gradient-to-r from-blue-600 to-purple-600"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Start Your Sneaker Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of sneaker enthusiasts who trust SneakerVault for their
            authentic footwear needs.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors duration-200"
          >
            Explore Collection <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </motion.section>
    </motion.div>
  );
}