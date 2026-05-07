import { motion } from 'framer-motion';

const features = [
  {
    title: 'Editorial Design System',
    description: 'A layout engine that prioritizes typography and whitespace for a premium look.'
  },
  {
    title: 'Smart Guest Lists',
    description: 'Dynamic filtering and segmentation for precise attendee management.'
  },
  {
    title: 'Automated Workflows',
    description: 'Trigger emails and updates based on guest behavior without lifting a finger.'
  },
  {
    title: 'Global Payments',
    description: 'Secure, low-fee ticket processing in 135+ currencies across the globe.'
  },
  {
    title: 'Real-time Analytics',
    description: 'Deep insights into registration trends and attendee engagement metrics.'
  }
];

export default function FeaturesListSection() {
  return (
    <section id="features" className="px-14 py-32 bg-white">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-20">
        <div>
          <h2 className="text-[clamp(48px,5vw,72px)] leading-[0.9] font-light tracking-[-3px] text-[#020605] sticky top-32">
            Everything <span className="italic text-[#FF1313]">included</span> <br />
            in the box
          </h2>
        </div>

        <div className="flex flex-col">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="py-10 border-b border-[rgba(2,6,5,0.07)] flex gap-6 group"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF1313] mt-2.5 shrink-0" />
              <div className="flex flex-col gap-2">
                <h3 className="text-[20px] font-medium text-[#020605]">
                  {feature.title}
                </h3>
                <p className="text-[16px] leading-relaxed font-normal text-[#83868F]">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
