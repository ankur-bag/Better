import { motion } from 'framer-motion';

const metrics = [
  { label: 'Events hosted', value: '12k+' },
  { label: 'Happy guests', value: '450k' },
  { label: 'Success rate', value: '99.9%' },
  { label: 'Global reach', value: '42+' }
];

export default function MetricsBar() {
  return (
    <section className="px-14 bg-white">
      <div className="grid grid-cols-2 md:grid-cols-4 border-t border-[rgba(2,6,5,0.07)]">
        {metrics.map((metric, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`py-12 flex flex-col gap-2 ${index !== metrics.length - 1 ? 'border-r border-[rgba(2,6,5,0.07)]' : ''} ${index % 2 === 0 ? 'pr-8' : 'pl-8'} md:px-8`}
          >
            <span className="text-[40px] font-light tracking-tight text-[#020605]">
              {metric.value}
            </span>
            <span className="text-[14px] uppercase tracking-widest font-medium text-[#83868F]">
              {metric.label}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
