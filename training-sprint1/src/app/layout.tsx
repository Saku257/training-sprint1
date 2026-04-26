import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Training Sprint',
  description: 'R2B Training Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="container mx-auto px-4 py-8 flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="bg-blue-600 text-white py-4">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold">R2B Training</h1>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-4 mt-8">
      <div className="container mx-auto px-4 text-center">
        <p>&copy; 2026 R2B Training Platform</p>
      </div>
    </footer>
  );
}
