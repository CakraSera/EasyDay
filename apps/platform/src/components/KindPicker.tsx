import { KINDS, KIND_LABEL, type Kind } from "@/lib/domain";
import { kindStyle } from "@/lib/theme";

interface Props {
  kind: Kind;
  onSelect: (kind: Kind) => void;
}

/** Kind picker inside the edit sheet. Quality renders disabled with its reason. */
export default function KindPicker({ kind, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {KINDS.map((option) => {
        const style = kindStyle[option];
        const selected = option === kind;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className="rounded-full border bg-white px-3.5 py-2 text-sm"
            style={{
              borderColor: selected ? style.color : style.border,
              backgroundColor: selected ? style.tint : "#FFFFFF",
              color: style.color,
              fontWeight: selected ? 700 : 500,
            }}
          >
            {KIND_LABEL[option]}
          </button>
        );
      })}
    </div>
  );
}
