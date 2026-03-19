 import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from '@/app/Component/header/page'
import { CartProvider } from "@/app/Component/ContextCart/page";
import { WishlistProvider } from "@/app/Component/ContextWishlist/page";
import { AuthProvider } from "@/app/ContextAuth/Authcontext";
import { ThemeProvider } from '@/app/Component/ThemeProvider/ThemeProvider'
import { Toaster } from "react-hot-toast";
import PageWrapper from "@/app/Component/PageWrapper/page";

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
  title: "MogShop at Your Service",
  description: "Your one-stop shop for all things awesome!",
  manifest: "/manifest.json",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <Toaster position="top-center" reverseOrder={false} />
          <AuthProvider>
            <WishlistProvider>
              <CartProvider> 
                <Header />
                <PageWrapper>
                  {children}
                </PageWrapper>
              </CartProvider>
            </WishlistProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
 