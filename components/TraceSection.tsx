import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Span } from "@/lib/weeksmith";
import { palette, radius } from "@/lib/theme";

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
    <View style={styles.wrap}>
      <Pressable style={styles.header}>
        <Text style={styles.title}>Build trace</Text>
        <Text style={styles.badge}>{running ? "running…" : `${spans.length} spans`}</Text>
      </Pressable>
      {allDone || running
        ? spans.map((span) => (
            <View key={span.tool} style={styles.row}>
              <Text style={[styles.mark, { color: COLOR[span.status] }]}>{MARK[span.status]}</Text>
              <Text style={styles.tool}>{span.tool}</Text>
              <Text style={styles.detail} numberOfLines={1}>
                {span.detail}
              </Text>
              <Text style={styles.ms}>{span.ms > 0 ? `${span.ms} ms` : ""}</Text>
            </View>
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: palette.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
    gap: 8,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 13, fontWeight: "700", color: palette.ink, textTransform: "uppercase", letterSpacing: 0.5 },
  badge: { fontSize: 12, color: palette.muted },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  mark: { width: 16, fontSize: 13, textAlign: "center" },
  tool: { fontSize: 13, fontWeight: "600", color: palette.ink, width: 96 },
  detail: { flex: 1, fontSize: 12, color: palette.muted },
  ms: { fontSize: 11, color: palette.faint, minWidth: 48, textAlign: "right" },
});
