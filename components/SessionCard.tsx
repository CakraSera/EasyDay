import { StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import { KIND_LABEL, type Kind } from "@/lib/domain";
import { kindStyle, radius } from "@/lib/theme";

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

/** One Session card on the Board. Whole card is the tap target (ADR 0005). */
export default function SessionCard({ kind, minutes, note, date, dayIndex: idx, disabled, onTap }: Props) {
  const style = kindStyle[kind];
  const day = DAY_NAMES[idx];
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: style.tint, borderColor: style.border },
        disabled && styles.cardDisabled,
      ]}
    >
      <Text style={[styles.kindMark, { color: style.color }]}>{SWATCH[kind]}</Text>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.day, { color: style.color }]}>{day}</Text>
          <Text style={[styles.kind, { color: style.color }]}>
            {SWATCH[kind]} {KIND_LABEL[kind]}
          </Text>
        </View>
        <Text style={styles.meta}>
          {minutes > 0 ? `${minutes} min` : KIND_LABEL[kind] === "Rest" ? "0 min" : "—"}
          {"  ·  "}
          {formatDate(date)}
        </Text>
        {note.length > 0 ? <Text style={styles.note}>{note}</Text> : null}
      </View>
    </View>
  );
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function formatDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: radius.card,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    alignItems: "flex-start",
  } as ViewStyle,
  cardDisabled: { opacity: 0.5 } as ViewStyle,
  kindMark: { fontSize: 14, lineHeight: 20 } as TextStyle,
  body: { flex: 1, gap: 2 } as ViewStyle,
  topRow: { flexDirection: "row", alignItems: "center", gap: 8 } as ViewStyle,
  day: { fontSize: 15, fontWeight: "700" } as TextStyle,
  kind: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 } as TextStyle,
  meta: { fontSize: 13, color: "#555" } as TextStyle,
  note: { fontSize: 13, color: "#555" } as TextStyle,
});
