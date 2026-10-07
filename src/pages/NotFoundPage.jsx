import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="page-shell flex min-h-[65vh] flex-col items-start justify-center py-20" data-testid="page-not-found">
      <p className="eyebrow text-black/45">A small wrong turn</p>
      <h1 className="mt-4 text-[clamp(4rem,12vw,8rem)] font-semibold leading-[.85] tracking-[-.09em]">Not found.</h1>
      <p className="mt-6 max-w-[360px] text-[14px] leading-[1.7] text-black/55">This page isn’t here, but there are still good places to look.</p>
      <Link to="/" className="mt-8 inline-flex items-center gap-3 border-b border-black pb-2 text-[11px] font-semibold uppercase tracking-[.12em]" data-testid="link-not-found-home"><ArrowLeft size={14} /> Back to E-SHOP</Link>
    </main>
  );
}
