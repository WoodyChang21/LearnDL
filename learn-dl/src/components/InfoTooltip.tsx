import { Info } from "lucide-react";

type InfoTooltipProps = {
  content: string;
};

export function InfoTooltip({ content }: InfoTooltipProps) {
  return (
    <span className="group relative inline-flex items-center">
      <span
        tabIndex={0}
        role="img"
        aria-label={content}
        className="inline-flex size-4 items-center justify-center text-gray-400 transition-colors hover:text-gray-600 focus:text-gray-600 focus:outline-none"
      >
        <Info className="size-3.5" />
      </span>
      <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 hidden w-56 -translate-x-1/2 rounded-md bg-gray-900 px-2 py-1.5 text-xs text-white shadow-lg group-hover:block group-focus-within:block">
        {content}
      </span>
    </span>
  );
}
