export type BannerTone = "ok" | "pain" | "blocked" | "error" | "info";

const TONE: Record<BannerTone, { bg: string; border: string; text: string; mark: string }> = {
  ok: { bg: "bg-ok-tint", border: "border-ok-border", text: "text-ok", mark: "✓" },
  pain: { bg: "bg-warn-tint", border: "border-quality-border", text: "text-warn", mark: "⚠" },
  blocked: { bg: "bg-danger-tint", border: "border-[#F2CFC9]", text: "text-danger", mark: "✕" },
  error: { bg: "bg-danger-tint", border: "border-[#F2CFC9]", text: "text-danger", mark: "✕" },
  info: { bg: "bg-info-tint", border: "border-border", text: "text-info", mark: "ℹ" },
};

/** The one messenger: pain / ok / illegal tap / build failure (PRD §6). */
export default function Banner({ tone, text }: { tone: BannerTone; text: string }) {
  const style = TONE[tone];
  return (
    <div className={`flex items-start gap-2 rounded-control border p-3 ${style.bg} ${style.border}`}>
      <span className={`text-sm leading-[19px] ${style.text}`}>{style.mark}</span>
      <p className={`flex-1 text-[13px] font-medium leading-[19px] ${style.text}`}>{text}</p>
    </div>
  );
}
