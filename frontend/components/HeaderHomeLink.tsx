"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getScrollBehavior } from "@/lib/scroll-ux";
import { useContentScrollContainer } from "./ContentScrollContext";

const brandClassName = "text-[20px] font-bold text-ink hover:opacity-80 transition-opacity";

export default function HeaderHomeLink() {
  const pathname = usePathname();
  const router = useRouter();
  const scrollContainer = useContentScrollContainer();

  if (pathname !== "/") {
    return (
      <Link href="/" scroll={true} className={brandClassName}>
        Yehyeok
      </Link>
    );
  }

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    const params = new URLSearchParams(window.location.search);
    params.delete("tag");
    const query = params.toString();
    const nextUrl = query ? `/?${query}` : "/";

    router.replace(nextUrl, { scroll: false });

    if (scrollContainer && scrollContainer.scrollTop > 0) {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      scrollContainer.scrollTo({ top: 0, behavior: getScrollBehavior(reducedMotion) });
    }
  };

  return (
    <Link href="/" scroll={true} onClick={handleClick} className={brandClassName}>
      Yehyeok
    </Link>
  );
}
