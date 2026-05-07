import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="px-14 py-8 bg-white border-t border-[rgba(2,6,5,0.07)] flex flex-col md:flex-row justify-between items-center gap-4">
      <Link to="/" className="text-[#FF1313] text-xl font-semibold tracking-tight">
        AVENTO
      </Link>
      <div className="text-[14px] font-normal text-[#83868F]">
        © {currentYear} Avento Platforms Inc. All rights reserved.
      </div>
    </footer>
  );
}
