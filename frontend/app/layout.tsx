import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "../components/layout/Navbar";
import { NavigationProvider } from "../components/layout/NavigationProvider";
import { CircleProvider } from "../src/providers/CircleProvider";
import { Web3Provider } from "../src/providers/Web3Provider";
import { WalletSync } from "../src/providers/WalletSync";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Equb | Save together, receive together",
    template: "%s | Equb",
  },
  description: "Transparent community savings circles powered by USDC on Arc.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Web3Provider>
          <CircleProvider>
            <WalletSync />
            <NavigationProvider>
              <Navbar />
              {children}
            </NavigationProvider>
          </CircleProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
