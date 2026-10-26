import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ServiceWorkerProvider } from "@/components/providers/service-worker-provider";
import "./globals.css";

const inter = localFont({
  src: [
    { path: "./fonts/inter-variable-latin.woff2", weight: "100 900", style: "normal" },
    { path: "./fonts/inter-variable-italic-latin.woff2", weight: "100 900", style: "italic" },
  ],
  variable: "--font-inter",
  display: "swap",
});

const googleSansCode = localFont({
  src: "./fonts/google-sans-code-latin.woff2",
  variable: "--font-google-sans-code",
  weight: "300 800",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "TypeScript Playground",
  description: "A TypeScript and JavaScript playground.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TS Playground",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfdfc" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${googleSansCode.variable} antialiased`}
      >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        <ServiceWorkerProvider />
      </body>
    </html>
  );
}
