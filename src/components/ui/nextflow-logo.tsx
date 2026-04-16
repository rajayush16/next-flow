import { cn } from "@/lib/utils";

type NextFlowLogoProps = {
  className?: string;
};

export function NextFlowLogo({ className }: NextFlowLogoProps) {
  return (
    <div
      className={cn(
        "relative h-8 w-8 rounded-[10px] border border-white/8 bg-white/4",
        className,
      )}
    >
      <span className="absolute left-[6px] top-[5px] h-3.5 w-3.5 rounded-full bg-white" />
      <span className="absolute right-[6px] top-[6px] h-2.5 w-2.5 rounded-full bg-white/70" />
      <span className="absolute bottom-[6px] left-[7px] h-2.5 w-2.5 rounded-full bg-white/50" />
      <span className="absolute bottom-[5px] right-[6px] h-4 w-4 rounded-full border border-white/15 bg-[#7c3aed]" />
    </div>
  );
}
