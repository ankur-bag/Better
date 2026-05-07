import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/react';

export default function HeroSection() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.95]);
  
  const clerk = useClerk();
  const { isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();
  
  const handleLaunchEvent = async () => {
    if (!isLoaded) {
      // Wait for Clerk to load
      return;
    }
    
    if (!isSignedIn) {
      // Open sign-in modal - user will be redirected to /dashboard after signing in
      clerk.openSignIn({ 
        fallbackRedirectUrl: '/dashboard',
      });
    } else {
      // Already signed in - navigate to dashboard
      navigate('/dashboard');
    }
  };

  return (
    <section className="relative pt-60 pb-32 px-14 bg-white overflow-hidden min-h-screen flex items-center">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div 
          style={{ y: y1, opacity: 0.03 }}
          className="absolute -top-[10%] -left-[10%] w-[40%] h-[60%] rounded-full bg-[#FF1313] blur-[120px]"
        />
        <motion.div 
          style={{ y: useTransform(scrollY, [0, 500], [0, -100]), opacity: 0.02 }}
          className="absolute top-[20%] -right-[5%] w-[30%] h-[50%] rounded-full bg-[#020605] blur-[100px]"
        />
      </div>

      <motion.div 
        style={{ opacity, scale }}
        className="max-w-[1440px] mx-auto w-full relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 flex items-center gap-3"
        >
          <div className="w-12 h-px bg-[#FF1313]" />
          <span className="text-[12px] uppercase tracking-[0.3em] font-medium text-[#FF1313]">
            Elevating Experiences
          </span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-[clamp(64px,10vw,140px)] leading-[0.85] font-light tracking-[-3px] text-[#020605] mb-16"
        >
          Create events that <br />
          feel <span className="italic text-[#FF1313]">extraordinary</span>
        </motion.h1>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-16">
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-[560px] text-[22px] leading-relaxed font-normal text-[#83868F]"
          >
            Avento is the editorial platform for modern organizers. Build, manage, and scale your gatherings with restrained elegance and powerful simplicity.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-end gap-6 w-full md:w-auto"
          >
            <button 
              onClick={handleLaunchEvent}
              className="group relative bg-[#020605] text-white px-10 py-5 rounded-full font-medium flex items-center gap-3 overflow-hidden transition-all hover:scale-105 active:scale-95 w-full md:w-auto justify-center cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF1313] to-[#FF1313] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10 flex items-center gap-3">
                Launch Event
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <div className="flex items-center gap-2 mr-4">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <p className="text-[14px] text-[#83868F] font-normal">
                Join 1,200+ organizers this month.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-12 left-14 flex items-center gap-4 text-[12px] uppercase tracking-widest text-[#83868F]"
      >
        <div className="w-px h-12 bg-gradient-to-b from-[#020605] to-transparent" />
        Scroll to explore
      </motion.div>
    </section>
  );
}