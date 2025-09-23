import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { PaymentProvider } from "@/contexts/PaymentContext";
import { PrivacyProvider } from "@/contexts/PrivacyContext";
import { EcoProvider } from "@/contexts/EcoContext";
import { LoyaltyProvider } from "@/contexts/LoyaltyContext";
import Header from "@/components/Header";
import ShoppingCart from "@/components/ShoppingCart";
import ReservationStatus from "@/components/ReservationStatus";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import PrivacyDashboard from "@/components/PrivacyDashboard";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import VercelAnalytics from "@/components/VercelAnalytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SneakerVault - Find Your Perfect Sneakers",
  description: "Discover the latest drops, rare finds, and timeless classics from top sneaker brands worldwide. Your ultimate destination for authentic streetwear and sneaker culture.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAnalytics />
        <VercelAnalytics />
        <PrivacyProvider>
          <EcoProvider>
            <LoyaltyProvider>
              <CartProvider>
                <WishlistProvider>
                  <PaymentProvider>
                    <Header />
                    <main className="pt-16">
                      {children}
                    </main>
                    <ShoppingCart />
                    <ReservationStatus />
                    <CookieConsentBanner />
                    <PrivacyDashboard />
                  </PaymentProvider>
                </WishlistProvider>
              </CartProvider>
            </LoyaltyProvider>
          </EcoProvider>
        </PrivacyProvider>
      </body>
    </html>
  );
}
