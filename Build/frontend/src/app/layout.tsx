import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { AuthProviders } from "@/components/AuthProviders";
import { ThemeProvider } from "next-themes";
import { OnboardingProvider } from "@/components/OnboardingProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chatbot Builder",
  description: "Build AI chatbots",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} antialiased bg-paper text-ink`}>
        <AuthProviders>
          <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem={false}>
            <OnboardingProvider>
              {children}
            </OnboardingProvider>
          </ThemeProvider>
        </AuthProviders>
      </body>
    </html>
  );
}
