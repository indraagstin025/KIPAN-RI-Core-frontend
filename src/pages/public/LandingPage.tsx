import LandingLayout from '@/components/Layout/LandingLayout';
import AlurSection from '@/components/landing/AlurSection';
import CtaSection from '@/components/landing/CtaSection';
import Hero from '@/components/landing/Hero';
import HistoryBanner from '@/components/landing/HistoryBanner';
import LayananSection from '@/components/landing/LayananSection';
import TentangSection from '@/components/landing/TentangSection';
import TipeSection from '@/components/landing/TipeSection';

export default function LandingPage() {
  return (
    <LandingLayout>
      <Hero />
      <HistoryBanner />
      <TipeSection />
      <TentangSection />
      <AlurSection />
      <LayananSection />
      <CtaSection />
    </LandingLayout>
  );
}
