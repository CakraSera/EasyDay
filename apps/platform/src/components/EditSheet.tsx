import { useEffect, useState } from "react";
import { type Kind, type Session } from "@runmax/domain";
import KindPicker from "./KindPicker";

interface Props {
  session: Session | null;
  dayIndex: number;
  painFlag: boolean;
  onApply: (kind: Kind, minutes: number, note: string) => void;
  onClose: () => void;
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

/**
 * Card editor (PRD §6): Kind, minutes, note. Date is fixed. Local draft
 * state; Apply proposes the edit — the parent's checkWeek decides (ADR 0007).
 */
export default function EditSheet({ session, dayIndex, painFlag, onApply, onClose }: Props) {
  const [kind, setKind] = useState<Kind>("easy");
  const [minutes, setMinutes] = useState("0");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (session) {
      setKind(session.kind);
      setMinutes(String(session.durationMinutes));
      setNote(session.note);
    }
  }, [session]);

  if (!session) return null;

  const parsedMinutes = Number.parseInt(minutes, 10);
  const safeMinutes = Number.isNaN(parsedMinutes) ? 0 : parsedMinutes;

  return (
    <div className="fixed inset-0 z-20 flex items-end bg-[rgba(20,22,26,0.4)]" onClick={onClose}>
      <div
        className="w-full rounded-t-sheet bg-surface p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-ink">{DAY_NAMES[dayIndex]}</h2>
        <p className="text-[13px] text-muted">
          {formatDate(session.date)} · date is locked · hard follows Kind
        </p>

        <p className="mt-2.5 text-xs font-semibold uppercase tracking-wide text-muted">Kind</p>
        <KindPicker kind={kind} onSelect={setKind} />

        <p className="mt-2.5 text-xs font-semibold uppercase tracking-wide text-muted">Minutes</p>
        <input
          className="w-full rounded-control border border-border bg-white px-3 py-2.5 text-[15px] text-ink"
          inputMode="numeric"
          value={minutes}
          onChange={(event) => setMinutes(event.target.value)}
          placeholder="0"
        />
        {kind === "rest" ? (
          <p className="mt-0.5 text-xs text-warn">Rest is always 0 minutes — minutes clear on Apply.</p>
        ) : kind === "walk" ? (
          <p className="mt-0.5 text-xs text-warn">Walk may have minutes.</p>
        ) : (
          <p className="mt-0.5 text-xs text-warn">Easy and Quality need at least 1 minute.</p>
        )}

        <p className="mt-2.5 text-xs font-semibold uppercase tracking-wide text-muted">Note</p>
        <textarea
          className="min-h-[60px] w-full rounded-control border border-border bg-white px-3 py-2.5 text-[15px] text-ink"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="One ordinary line. No paces."
        />

        {painFlag ? (
          <p className="mt-0.5 text-xs text-warn">
            Your Log mentions pain — Quality stays locked out this week.
          </p>
        ) : null}

        <div className="mt-4 flex gap-2.5">
          <button
            type="button"
            className="flex-1 rounded-control bg-info-tint py-3 font-semibold text-info"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 rounded-control bg-ink py-3 font-bold text-white"
            onClick={() => onApply(kind, safeMinutes, note)}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

