import "./globals.css";
import { Metadata } from "next";
import { Toaster } from "sonner";
import { Providers } from './providers'

export const metadata: Metadata = {
  title: "E2B Desktop Use App",
  description:
    "A app for E2B desktop use demo, built with Next.js, Tailwind CSS, TypeScript and E2B Desktop Use SDK.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <Toaster position="top-center" richColors />
          {children}
        </Providers>
      </body>
    </html>
  );
}
