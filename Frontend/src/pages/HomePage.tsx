import Navbar from '../components/Navbar.tsx';
import HeroSection from '../components/HeroSection.tsx';
import MetricsBar from '../components/MetricsBar.tsx';
import HowItWorksSection from '../components/HowItWorksSection.tsx';
import FeaturesListSection from '../components/FeaturesListSection.tsx';
import CTASection from '../components/CTASection.tsx';
import Footer from '../components/Footer.tsx';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col selection:bg-[#FF1313] selection:text-white">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <MetricsBar />
        <HowItWorksSection />
        <FeaturesListSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
