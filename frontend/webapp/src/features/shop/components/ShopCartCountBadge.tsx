"use client";

import { useEffect, useState } from "react";

import { getCartAction } from "../actions/cart.actions";

/**
 * Live cart-count pill for {@link ShopHeader}. Renders `initial` straight away
 * (0 on a statically-rendered page) and then reconciles with the real cart on
 * mount, so the header no longer forces the page to be dynamically rendered.
 */
export function ShopCartCountBadge({ initial = 0 }: { initial?: number }) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    let alive = true;
    getCartAction()
      .then((cart) => {
        if (alive && typeof cart?.itemCount === "number") setCount(cart.itemCount);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (count <= 0) return null;

  return (
    <span className="absolute end-0 top-0 min-w-[16px] rounded-full bg-[#eacb7f] px-1 text-center text-[10px] font-bold leading-4 text-[#083f30]">
      {count > 99 ? "99+" : count}
    </span>
  );
}
