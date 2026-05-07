import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <section className="px-14 pb-32 bg-white">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="bg-[#020605] rounded-[32px] p-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
      >
        <div className="flex flex-col gap-6">
          <h2 className="text-[clamp(40px,4vw,56px)] leading-[1] font-light tracking-[-3px] text-white">
            Ready to host <br />
            something <span className="italic text-[#FF1313]">memorable?</span>
          </h2>
          <p className="max-w-[400px] text-[18px] font-normal text-[#83868F]">
            Join thousands of organizers creating the future of events. Start building your next experience today.
          </p>
        </div>

        <div className="flex flex-col gap-4 items-end">
          <Link 
            to="/dashboard" 
            className="bg-[#FF1313] text-white px-10 py-5 rounded-full font-medium hover:bg-[#E61111] transition-all w-full md:w-auto text-center text-lg"
          >
            Create your first event
          </Link>
          <Link 
            to="/pricing" 
            className="text-white font-medium hover:text-[#83868F] transition-colors pr-4"
          >
            View all features
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
