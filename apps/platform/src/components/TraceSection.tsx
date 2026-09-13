import type { Span } from "@/lib/weeksmith";
import { palette } from "@/lib/theme";

interface Props {
  spans: Span[];
  running: boolean;
}

const MARK: Record<Span["status"], string> = {
  pending: "○",
  running: "◐",
  ok: "✓",
  fail: "✕",
};

const COLOR: Record<Span["status"], string> = {
  pending: palette.faint,
  running: palette.info,
  ok: palette.ok,
  fail: palette.danger,
};

/** Collapsible Build trace: one span per tool (PRD §10, demo 0:58). */
export default function TraceSection({ spans, running }: Props) {
  if (spans.length === 0) return null;
  const allDone = spans.every((s) => s.status === "ok" || s.status === "fail");
  return (
    <section className="flex flex-col gap-2 rounded-card border border-border bg-surface p-3.5">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-ink">Build trace</h2>
        <span className="text-xs text-muted">{running ? "running…" : `${spans.length} spans`}</span>
      </div>
      {allDone || running
        ? spans.map((span) => (
            <div key={span.tool} className="flex items-center gap-2">
              <span className="w-4 text-center text-[13px]" style={{ color: COLOR[span.status] }}>
                {MARK[span.status]}
              </span>
              <span className="w-24 text-[13px] font-semibold text-ink">{span.tool}</span>
              <span className="min-w-0 flex-1 truncate text-xs text-muted">{span.detail}</span>
              <span className="min-w-12 text-right text-[11px] text-faint">
                {span.ms > 0 ? `${span.ms} ms` : ""}
              </span>
            </div>
          ))
        : null}
    </section>
  );
}
