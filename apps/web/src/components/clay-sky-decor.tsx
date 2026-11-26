import { cn } from "@/lib/utils";

interface ClayCloudProps {
  className?: string;
}

interface ClaySkyDecorProps {
  showSchool?: boolean;
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

function ClaySchoolBuilding() {
  return (
    <div className="absolute bottom-6 right-8 hidden w-56 opacity-75 sm:block lg:right-14 lg:w-64">
      <div className="relative flex flex-col items-center">
        <div className="flex flex-col items-center">
          <div className="h-5 w-1 rounded-full bg-muted-foreground/60" />
          <div className="-mt-4 ml-3.5 h-3 w-5 overflow-hidden rounded-xs shadow-2xs">
            <div className="h-1.5 w-full bg-coral" />
            <div className="h-1.5 w-full bg-card" />
          </div>
        </div>

        <div className="clay-pill z-10 -mb-3 flex h-8 w-16 items-center justify-center rounded-t-xl bg-sun-soft">
          <span className="h-3.5 w-3.5 rounded-full border-2 border-primary/70 bg-card" />
        </div>

        <div className="clay-card h-8 w-52 rounded-t-2xl bg-coral-soft" />

        <div className="clay-card -mt-1 flex w-48 flex-col items-center gap-3 rounded-t-md rounded-b-xl bg-card px-4 pb-3 pt-4">
          <div className="grid w-full grid-cols-3 gap-2">
            <span className="clay-well h-5 rounded-md bg-sky-soft" />
            <span className="clay-well h-5 rounded-md bg-sky-soft" />
            <span className="clay-well h-5 rounded-md bg-sky-soft" />
            <span className="clay-well h-5 rounded-md bg-sky-soft" />
            <span className="clay-well h-5 rounded-md bg-sky-soft" />
            <span className="clay-well h-5 rounded-md bg-sky-soft" />
          </div>
          <div className="clay-pill h-7 w-10 rounded-t-full bg-primary/80" />
        </div>
      </div>
    </div>
  );
}

/** Decorative sculpted 3D clay clouds, warm sun orb, soft hills, and optional schoolhouse backdrop. */
export function ClaySkyDecor({ showSchool = false }: ClaySkyDecorProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
    >
      <div className="clay-sun absolute right-8 top-24 h-20 w-20 opacity-90 sm:right-16 sm:top-28 sm:h-24 sm:w-24" />

      <ClayCloud className="absolute -left-8 top-24 opacity-90 sm:left-10 sm:top-28" />
      <ClayCloud className="absolute -right-10 top-32 scale-90 opacity-95 sm:right-20 sm:top-36 sm:scale-100" />

      <ClayCloud className="absolute left-[6%] top-[48%] hidden scale-75 opacity-85 md:block" />
      <ClayCloud className="absolute right-[7%] top-[54%] hidden scale-90 opacity-85 md:block" />

      <ClayCloud className="absolute -left-6 bottom-12 scale-90 opacity-80 sm:left-12 sm:bottom-16 sm:scale-105" />
      <ClayCloud className="absolute -right-8 bottom-14 hidden scale-95 opacity-85 sm:block lg:right-16" />

      <div className="clay-hill-mint absolute -bottom-24 -left-24 h-52 w-96 opacity-75 sm:-bottom-28 sm:-left-16 sm:h-64 sm:w-[34rem]" />
      <div className="clay-hill-sky absolute -bottom-28 -right-24 h-56 w-96 opacity-70 sm:-bottom-32 sm:-right-16 sm:h-72 sm:w-[36rem]" />

      {showSchool && <ClaySchoolBuilding />}
    </div>
  );
}
