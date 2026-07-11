import Image from "next/image";
import { BODO_ART_SCALE, BODO_BACKDROPS, type BodoBackdrop } from "@/config/bodo";

/**
 * Bodo in a coloured disc — the reusable mascot badge. `backdrop` picks one of the
 * stored on-brand tints (config/bodo.ts); `sizeClass` sets the disc size via a Tailwind
 * height/width class. The art is scaled up inside the clipped disc so Bodo sits near the
 * edge with a small margin. Used on the landing hero (gray); reusable for the report later.
 */
export function BodoBadge({
  backdrop = "gray",
  sizeClass = "h-44 w-44",
  priority = false,
}: {
  backdrop?: BodoBackdrop;
  sizeClass?: string;
  priority?: boolean;
}) {
  const { hex } = BODO_BACKDROPS[backdrop];
  return (
    <span
      className={`flex ${sizeClass} items-center justify-center overflow-hidden rounded-full ring-1 ring-black/5 shadow-[0_14px_60px_rgba(45,212,191,0.18)]`}
      style={{ backgroundColor: hex }}
    >
      <Image
        src="/bodo.svg"
        alt="Bodo, the TrustScope mascot"
        width={176}
        height={176}
        priority={priority}
        className="h-full w-full"
        style={{ transform: `scale(${BODO_ART_SCALE})` }}
      />
    </span>
  );
}
