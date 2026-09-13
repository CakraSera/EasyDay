import { TOOLS, type ToolStatus } from "@/lib/weeksmith";
import { palette } from "@/lib/theme";

interface Props {
  statuses: Record<string, ToolStatus>;
}

const MARK: Record<ToolStatus, string> = {
  pending: "○",
  running: "◐",
  ok: "✓",
  fail: "✕",
};

const COLOR: Record<ToolStatus, string> = {
  pending: palette.faint,
  running: palette.info,
  ok: palette.ok,
  fail: palette.danger,
};

/** Workflow chips lighting up in order during Build (PRD §6.4). */
export default function WorkflowChips({ statuses }: Props) {
  return (
    <div className="flex flex-wrap gap-x-1 gap-y-1.5">
      {TOOLS.map((tool, i) => {
        const status = statuses[tool] ?? "pending";
        return (
          <span key={tool} className="flex items-center">
            {i > 0 ? (
              <span className="mx-1 text-xs" style={{ color: COLOR[status] }}>
                →
              </span>
            ) : null}
            <span className="text-xs font-semibold" style={{ color: COLOR[status] }}>
              {MARK[status]} {tool}
            </span>
          </span>
        );
      })}
    </div>
  );
}
