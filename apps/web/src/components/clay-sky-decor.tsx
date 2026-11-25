import { cn } from "@/lib/utils";

interface ClayCloudProps {
  className?: string;
}

function ClayCloud({ className }: ClayCloudProps) {
  return (
    <div className={cn("relative h-14 w-44 sm:h-16 sm:w-52", className)}>
      <div className="clay-cloud-puff absolute -top-7 left-7 h-16 w-16 sm:-top-8 sm:left-8 sm:h-20 sm:w-20" />
      <div className="clay-cloud-puff absolute -top-5 right-7 h-13 w-13 sm:-top-6 sm:right-8 sm:h-16 sm:w-16" />
      <div className="clay-cloud-puff absolute -top-2 left-3 h-10 w-10 sm:h-12 sm:w-12" />
      <div className="clay-cloud absolute inset-x-0 bottom-0 h-11 sm:h-12" />
    </div>
  );
}

/** Decorative sculpted 3D clay clouds, warm sun orb, and soft rolling hills backdrop. */
export function ClaySkyDecor() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
    >
      <div className="clay-sun clay-drift-slow absolute right-8 top-24 h-20 w-20 opacity-90 sm:right-16 sm:top-28 sm:h-24 sm:w-24" />

      <ClayCloud className="clay-drift absolute -left-8 top-24 opacity-90 sm:left-10 sm:top-28" />
      <ClayCloud className="clay-drift-slow absolute -right-10 top-32 scale-90 opacity-95 sm:right-20 sm:top-36 sm:scale-100" />

      <ClayCloud className="clay-drift-slow absolute left-[6%] top-[48%] hidden scale-75 opacity-85 md:block" />
      <ClayCloud className="clay-drift absolute right-[7%] top-[54%] hidden scale-90 opacity-85 md:block" />

      <ClayCloud className="clay-drift absolute -left-6 bottom-12 scale-90 opacity-80 sm:left-12 sm:bottom-16 sm:scale-105" />
      <ClayCloud className="clay-drift-slow absolute -right-8 bottom-14 hidden scale-95 opacity-85 sm:block lg:right-16" />

      <div className="clay-hill-mint absolute -bottom-24 -left-24 h-52 w-96 opacity-75 sm:-bottom-28 sm:-left-16 sm:h-64 sm:w-[34rem]" />
      <div className="clay-hill-sky absolute -bottom-28 -right-24 h-56 w-96 opacity-70 sm:-bottom-32 sm:-right-16 sm:h-72 sm:w-[36rem]" />
    </div>
  );
}
