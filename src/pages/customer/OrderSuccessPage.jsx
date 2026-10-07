import { Check, Package, ArrowRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";

export default function OrderSuccessPage() {
  const { id } = useParams();

  return (
    <main className="min-h-screen bg-[#f7f6f2]">
      <div className="mx-auto flex min-h-[75vh] max-w-3xl items-center justify-center px-4 py-16">

        <div className="w-full border border-black/10 bg-white p-8 text-center md:p-14">

          <div className="mx-auto grid h-16 w-16 place-items-center bg-black text-white">
            <Check size={30} />
          </div>

          <p className="mt-8 text-[10px] font-semibold uppercase tracking-[.15em] text-black/40">
            E-SHOP
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-.05em] md:text-5xl">
            Order Placed
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-black/50">
            Thank you for your order. Your order has been
            successfully placed with Cash on Delivery.
          </p>

          <div className="mx-auto mt-8 max-w-md border border-black/10 bg-[#f7f6f2] p-5">

            <div className="flex items-center justify-center gap-3">
              <Package size={18} />

              <div className="text-left">
                <p className="text-[10px] uppercase tracking-wider text-black/40">
                  Order ID
                </p>

                <p className="mt-1 break-all font-mono text-xs font-semibold">
                  {id}
                </p>
              </div>
            </div>

          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">

            <Link
              to="/customer"
              className="inline-flex items-center justify-center gap-2 bg-black px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-black/80"
            >
              View My Orders
              <ArrowRight size={14} />
            </Link>

            <Link
              to="/shop"
              className="inline-flex items-center justify-center border border-black/15 px-6 py-3 text-xs font-semibold uppercase tracking-wider transition hover:border-black"
            >
              Continue Shopping
            </Link>

          </div>

        </div>

      </div>
    </main>
  );
}