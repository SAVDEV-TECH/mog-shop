 import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from '@/components/Header'
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from "react-hot-toast";
import PageWrapper from "@/components/PageWrapper";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import Script from "next/script";

import ErrorBoundary from "@/components/ErrorBoundary";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://mog-six.vercel.app'),
  title: "Mogshops — Quality Groceries & Provisions in Port Harcourt",
  description: "Mogshops is your trusted destination for quality groceries, daily provisions, and household essentials in Nigeria. Fast and reliable delivery.",
  manifest: "/manifest.json",
  keywords: ["groceries", "provisions", "food delivery", "Port Harcourt", "Nigeria", "online store", "Mogshops"],
  authors: [{ name: "Mogshops" }],
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://mog-six.vercel.app",
    siteName: "Mogshops",
    title: "Mogshops — Quality Groceries & Provisions",
    description: "Your trusted destination for groceries and provisions in Nigeria. Fast and reliable same-day delivery.",
    images: [
      {
        url: "/mog.png",
        width: 800,
        height: 600,
        alt: "Mogshops",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mogshops — Quality Groceries & Provisions",
    description: "Your trusted destination for groceries and provisions in Nigeria. Fast and reliable same-day delivery.",
    images: ["/mog.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mogshops",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-Y6X6VBHF5P"
        />
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
          
            gtag('config', 'G-Y6X6VBHF5P');
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <Toaster position="top-center" reverseOrder={false} />
          <AuthProvider>
            <WishlistProvider>
              <CartProvider> 
                <Header />
                <CartDrawer />
                <ErrorBoundary>
                  <PageWrapper>
                    {children}
                  </PageWrapper>
                </ErrorBoundary>
                <Footer />
              </CartProvider>
            </WishlistProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
 