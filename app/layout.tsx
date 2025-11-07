import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
// import { SessionProvider } from 'next-auth/react'
// import { auth } from '@/lib/auth'
import Header from '@/app/Component/header/page'
import Shop from "./Component/header/shoptext/page"
import { CartProvider } from "@/app/Component/ContextCart/page";
// import { auth } from '@/lib/auth'
//  import { AuthContextProvider } from "./context/authcontext"; // added
import { AuthProvider } from "@/app/ContextAuth/Authcontext";

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
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    // const session = await auth()
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* <Provider session={session}> */}
            <AuthProvider>
        <CartProvider> 
        <Header></Header>
            <Shop></Shop>

            {children}
          </CartProvider>
          </AuthProvider>
        {/* </Provider> */}
      </body>
    </html>
  );
}

