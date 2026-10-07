import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { categories } from '../data/categories.js';

export default function SiteFooter() {
  return (
    <footer className="bg-[#171717] text-[#f7f6f2]">
      <div className="page-shell grid gap-12 py-12 md:grid-cols-[1fr_auto] md:items-end md:py-16">
        <div>
          <p className="eyebrow text-white/50">A good place to start</p>
          <p className="mt-4 max-w-[540px] text-[28px] font-semibold leading-[1.08] tracking-[-.055em] md:text-[40px]">Everyday things.<br />A little more considered.</p>
        </div>
        <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-[12px]">
          {categories.map((category) => (
            <Link key={category.slug} className="flex items-center gap-1 text-white/70 transition-colors hover:text-white" to={`/shop/${category.slug}`} data-testid={`footer-category-${category.slug}`}>
              {category.name}<ArrowUpRight size={12} />
            </Link>
          ))}
          <Link className="flex items-center gap-1 text-white/70 transition-colors hover:text-white" to="/shop" data-testid="footer-shop-all">Shop all<ArrowUpRight size={12} /></Link>
        </div>
      </div>
      <div className="page-shell flex flex-col gap-2 border-t border-white/15 py-5 text-[10px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
        <span data-testid="text-footer-brand">E-SHOP® — Good things, chosen well.</span>
        <span>Made for the everyday.</span>
      </div>
    </footer>
  );
}
