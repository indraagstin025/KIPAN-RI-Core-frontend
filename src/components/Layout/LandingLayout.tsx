import type { ReactNode } from 'react';
import Footer from './Footer';
import Navbar from './Navbar';

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-kipan-text-dark antialiased">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
