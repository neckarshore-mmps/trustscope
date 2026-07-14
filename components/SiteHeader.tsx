import Image from "next/image";
import Link from "next/link";
import { PRODUCT_NAME } from "@/config/product";
import { NAV_ITEMS } from "@/config/nav";
import { BODO_ART_SCALE, BODO_BACKDROPS } from "@/config/bodo";
import { NavMenu } from "@/components/NavMenu";
import { ThemeToggle } from "@/components/ThemeToggle";

export function SiteHeader() {
  return (
    <header className="border-b border-border/70 bg-surface/40 backdrop-blur">
      <div className="relative mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link href="/" className="group flex items-center gap-2">
          {/* Bodo on a light disc — the mascot art is cyan + navy on a transparent
              canvas, so it needs a light backdrop to read fully on the dark theme
              (see config/bodo.ts). Gray echoes the landing hero. */}
          <span
            className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full ring-1 ring-black/5"
            style={{ backgroundColor: BODO_BACKDROPS.gray.hex }}
          >
            <Image
              src="/bodo.svg"
              alt="Bodo, the TrustScope mascot"
              width={28}
              height={28}
              priority
              className="h-full w-full"
              style={{ transform: `scale(${BODO_ART_SCALE})` }}
            />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            {PRODUCT_NAME}
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <NavMenu items={NAV_ITEMS} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
