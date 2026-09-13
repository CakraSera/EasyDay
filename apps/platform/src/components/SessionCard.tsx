import { KIND_LABEL, type Kind } from "@runmax/domain";
import { kindStyle } from "@/lib/theme";

const SWATCH: Record<Kind, string> = {
  easy: "●",
  quality: "◆",
  rest: "○",
  walk: "▲",
};

interface Props {
  kind: Kind;
  minutes: number;
  note: string;
  date: string;
  dayIndex: number;
  disabled: boolean;
  onTap: () => void;
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

/** One Session card on the Board. Whole card is the tap target (ADR 0005). */
export default function SessionCard({
  kind,
  minutes,
  note,
  date,
  dayIndex: idx,
  disabled,
  onTap,
}: Props) {
  const style = kindStyle[kind];
  const day = DAY_NAMES[idx];
  return (
    <button
      type="button"
      onClick={onTap}
      disabled={disabled}
      className="flex w-full items-start gap-3 rounded-card border p-3.5 text-left disabled:opacity-50"
      style={{ backgroundColor: style.tint, borderColor: style.border }}
    >
      <span className="text-sm leading-5" style={{ color: style.color }}>
        {SWATCH[kind]}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <span className="text-[15px] font-bold" style={{ color: style.color }}>
            {day}
          </span>
          <span
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: style.color }}
          >
            {SWATCH[kind]} {KIND_LABEL[kind]}
          </span>
        </span>
        <span className="text-[13px] text-[#555]">
          {minutes > 0 ? `${minutes} min` : KIND_LABEL[kind] === "Rest" ? "0 min" : "—"}
          {"  ·  "}
          {formatDate(date)}
        </span>
        {note.length > 0 ? <span className="text-[13px] text-[#555]">{note}</span> : null}
      </span>
    </button>
  );
}
