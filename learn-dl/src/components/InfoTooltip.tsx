type InfoTooltipProps = {
  content: string;
};

export function InfoTooltip({ content }: InfoTooltipProps) {
  return (
    <span
      className="inline-flex size-4 items-center justify-center rounded-full border border-gray-300 text-[10px] font-semibold text-gray-500 cursor-help"
      title={content}
      aria-label={content}
    >
      i
    </span>
  );
}
