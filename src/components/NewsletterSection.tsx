'use client';

import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Mail, Send, CheckCircle, Gift, Zap, Bell } from 'lucide-react';

interface NewsletterSectionProps {
  title?: string;
  subtitle?: string;
}

export default function NewsletterSection({
  title = "Stay in the Loop",
  subtitle = "Get the latest drops, exclusive deals, and sneaker news delivered to your inbox"
}: NewsletterSectionProps) {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(false);

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || isLoading) return;

    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubscribed(true);
    setIsLoading(false);
    setEmail('');

    // Reset after 3 seconds for demo purposes
    setTimeout(() => {
      setIsSubscribed(false);
    }, 3000);
  };

  const benefits = [
    {
      icon: Gift,
      title: 'Exclusive Drops',
      description: 'Early access to limited releases'
    },
    {
      icon: Zap,
      title: 'Flash Sales',
      description: 'Be first to know about deals'
    },
    {
      icon: Bell,
      title: 'New Arrivals',
      description: 'Latest sneakers from top brands'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: 80 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const slideUpVariants = {
    hidden: {
      opacity: 0,
      y: 60,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  if (isSubscribed) {
    return (
      <section ref={ref} className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="bg-white dark:bg-slate-800 rounded-3xl p-12 shadow-2xl border border-green-100 dark:border-green-900"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-24 h-24 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </motion.div>

            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-3xl font-bold text-slate-900 dark:text-white mb-4"
            >
              Welcome to the Family!
            </motion.h3>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-lg text-slate-600 dark:text-slate-400 mb-6"
            >
              You're now subscribed to receive the latest sneaker drops and exclusive deals.
              Check your inbox for a welcome gift!
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-4 py-2 rounded-full text-sm font-semibold"
            >
              <Gift className="w-4 h-4" />
              Welcome gift sent to your email
            </motion.div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center"
        >
          {/* Icon */}
          <motion.div
            variants={itemVariants}
            className="flex justify-center mb-6"
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl shadow-lg"
            >
              <Mail className="w-8 h-8 text-white" />
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.h2
            variants={itemVariants}
            className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4"
          >
            {title}
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto"
          >
            {subtitle}
          </motion.p>

          {/* Benefits Grid */}
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-100 dark:border-blue-900"
              >
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Newsletter Form */}
          <motion.div
            variants={slideUpVariants}
            className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl border border-blue-100 dark:border-blue-900 max-w-2xl mx-auto"
          >
            <motion.div
              variants={itemVariants}
              className="mb-8"
            >
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Never Miss a Drop
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Join 50,000+ sneaker enthusiasts and get instant notifications
              </p>
            </motion.div>

            <motion.form
              variants={itemVariants}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="relative">
                <motion.div
                  animate={{
                    scale: focusedInput ? 1.02 : 1,
                    borderColor: focusedInput ? '#3b82f6' : '#e2e8f0'
                  }}
                  className="relative"
                >
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedInput(true)}
                    onBlur={() => setFocusedInput(false)}
                    placeholder="Enter your email address"
                    required
                    className="w-full pl-12 pr-4 py-4 text-lg rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all duration-300 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                  />
                </motion.div>

                {/* Floating label effect */}
                <motion.div
                  animate={{
                    opacity: focusedInput || email ? 1 : 0,
                    y: focusedInput || email ? -30 : 0,
                    scale: focusedInput || email ? 0.8 : 1
                  }}
                  className="absolute left-12 top-4 text-blue-600 dark:text-blue-400 font-medium pointer-events-none"
                >
                  Email Address
                </motion.div>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading || !email}
                whileHover={!isLoading && email ? { scale: 1.02 } : {}}
                whileTap={!isLoading && email ? { scale: 0.98 } : {}}
                className={`w-full py-4 rounded-2xl text-lg font-semibold transition-all duration-300 flex items-center justify-center gap-3 ${
                  isLoading || !email
                    ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Subscribing...
                  </>
                ) : (
                  <>
                    Subscribe Now
                    <Send className="w-5 h-5" />
                  </>
                )}
              </motion.button>

              <motion.p
                variants={itemVariants}
                className="text-sm text-slate-500 dark:text-slate-400 text-center"
              >
                We respect your privacy. Unsubscribe at any time.
              </motion.p>
            </motion.form>

            {/* Social Proof */}
            <motion.div
              variants={itemVariants}
              className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center justify-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>50,000+ subscribers</span>
                </div>
                <div className="w-1 h-4 bg-slate-300 dark:bg-slate-600" />
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>No spam, ever</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Additional CTA */}
          <motion.div
            variants={itemVariants}
            className="mt-12 text-center"
          >
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Already a member?
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors duration-200"
            >
              Manage your preferences →
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}