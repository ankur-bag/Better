import { motion } from 'framer-motion';

const steps = [
  {
    number: '01',
    title: 'Create & Design',
    description: 'Build your event page with our restrained design system. Focus on what matters: the experience.'
  },
  {
    number: '02',
    title: 'Invite & Manage',
    description: 'Send elegant invitations and track RSVPs in real-time. Full control, zero noise.'
  },
  {
    number: '03',
    title: 'Host & Scale',
    description: 'Run your event seamlessly. From intimate gatherings to global summits, we scale with you.'
  }
];

export default function HowItWorksSection() {
  return (
    <section id="howitworks" className="px-14 py-24 bg-[#FEF5F8]">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-20">
          <h2 className="text-[clamp(48px,5vw,72px)] leading-[0.9] font-light tracking-[-3px] text-[#020605]">
            How it <span className="italic text-[#FF1313]">actually</span> works
          </h2>
          <p className="max-w-[400px] text-[18px] font-normal text-[#83868F]">
            We stripped away the complexity to leave you with a process that feels as good as it looks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[rgba(2,6,5,0.07)]">
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-[#FEF5F8] p-12 flex flex-col gap-8"
            >
              <span className="text-[14px] font-medium text-[#FF1313] tracking-widest">
                STEP {step.number}
              </span>
              <div className="flex flex-col gap-4">
                <h3 className="text-[24px] font-medium text-[#020605]">
                  {step.title}
                </h3>
                <p className="text-[16px] leading-relaxed font-normal text-[#83868F]">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
