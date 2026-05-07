import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  
  const clerk = useClerk();
  const { isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();
  const handleGetStarted = async () => {
    if (!isLoaded) {
      // Wait for Clerk to load
      return;
    }
    
    if (!isSignedIn) {
      // Open sign-in modal - user will be redirected to /dashboard after signing in
      clerk.openSignIn({ 
        fallbackRedirectUrl: '/dashboard',
        forceRedirectUrl: '/dashboard'
      });
    } else {
      // Already signed in - navigate to dashboard
      navigate('/dashboard');
    }
  };

  // Transform values for scroll-based morphing
  const width = useTransform(scrollY, [0, 50], ['100%', '90%']);
  const maxWidth = useTransform(scrollY, [0, 50], ['1440px', '1200px']);
  const borderRadius = useTransform(scrollY, [0, 50], ['0px', '40px']);
  const top = useTransform(scrollY, [0, 50], ['0px', '20px']);
  const backgroundColor = useTransform(
    scrollY, 
    [0, 50], 
    ['rgba(255, 255, 255, 0)', 'rgba(2, 6, 5, 0.8)']
  );
  const backdropBlur = useTransform(scrollY, [0, 50], ['blur(0px)', 'blur(16px)']);
  const shadow = useTransform(
    scrollY, 
    [0, 50], 
    ['0px 0px 0px rgba(0,0,0,0)', '0px 20px 40px rgba(0,0,0,0.3)']
  );
  const border = useTransform(
    scrollY,
    [0, 50],
    ['1px solid rgba(2, 6, 5, 0)', '1px solid rgba(255, 255, 255, 0.1)']
  );
  // Removed unused textColor transform

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToSection = (sectionId: string) => {
    setIsOpen(false);
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <motion.nav
        style={{
          width,
          maxWidth,
          borderRadius,
          top,
          backgroundColor,
          backdropFilter: backdropBlur,
          boxShadow: shadow,
          border,
        }}
        className="pointer-events-auto overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
      >
        <div className="px-14 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <motion.span 
              style={{ color: isScrolled ? '#FF1313' : '#FF1313' }}
              className="text-2xl font-bold tracking-tighter"
            >
              AVENTO
            </motion.span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-10">
            <button
              onClick={() => handleScrollToSection('howitworks')}
              className="relative text-sm font-medium tracking-wide group cursor-pointer"
              style={{ color: isScrolled ? 'rgba(255,255,255,0.7)' : 'rgba(2,6,5,0.7)' }}
            >
              <span className="group-hover:text-[#FF1313] transition-colors">About</span>
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#FF1313] transition-all duration-300 group-hover:w-full" />
              <span className="absolute -inset-2 bg-[#FF1313]/0 blur-lg group-hover:bg-[#FF1313]/10 rounded-full transition-all duration-500" />
            </button>

            <button
              onClick={() => handleScrollToSection('features')}
              className="relative text-sm font-medium tracking-wide group cursor-pointer"
              style={{ color: isScrolled ? 'rgba(255,255,255,0.7)' : 'rgba(2,6,5,0.7)' }}
            >
              <span className="group-hover:text-[#FF1313] transition-colors">Features</span>
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#FF1313] transition-all duration-300 group-hover:w-full" />
              <span className="absolute -inset-2 bg-[#FF1313]/0 blur-lg group-hover:bg-[#FF1313]/10 rounded-full transition-all duration-500" />
            </button>

            {isSignedIn && (
              <Link
                to="/dashboard"
                className="relative text-sm font-medium tracking-wide transition-colors group"
                style={{ color: isScrolled ? 'rgba(255,255,255,0.7)' : 'rgba(2,6,5,0.7)' }}
              >
                <span className="group-hover:text-[#FF1313] transition-colors">Dashboard</span>
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#FF1313] transition-all duration-300 group-hover:w-full" />
                <span className="absolute -inset-2 bg-[#FF1313]/0 blur-lg group-hover:bg-[#FF1313]/10 rounded-full transition-all duration-500" />
              </Link>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={handleGetStarted}
              className="bg-[#FF1313] text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-[#E61111] hover:shadow-[0_0_20px_rgba(255,19,19,0.4)] transition-all hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
            >
              Get started
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-full transition-colors cursor-pointer"
            style={{ color: isScrolled ? '#ffffff' : '#020605' }}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden border-t border-white/10 bg-black/90 backdrop-blur-2xl"
            >
              <div className="px-14 py-10 flex flex-col gap-8">
                <button
                  onClick={() => handleScrollToSection('howitworks')}
                  className="text-2xl font-light tracking-tight text-white/70 hover:text-[#FF1313] transition-colors text-left cursor-pointer"
                >
                  About
                </button>

                <button
                  onClick={() => handleScrollToSection('features')}
                  className="text-2xl font-light tracking-tight text-white/70 hover:text-[#FF1313] transition-colors text-left cursor-pointer"
                >
                  Features
                </button>

                {isSignedIn && (
                  <Link
                    to="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="text-2xl font-light tracking-tight text-white/70 hover:text-[#FF1313] transition-colors"
                  >
                    Dashboard
                  </Link>
                )}
                <div className="h-px bg-white/10 my-4" />
                <Link 
                  to="/sign-in"
                  className="text-xl font-light text-white/70"
                >
                  Sign in
                </Link>
                <Link
                  to="/sign-up"
                  className="bg-[#FF1313] text-white p-5 rounded-2xl text-center font-semibold text-lg"
                >
                  Get Started
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </div>
  );
}
