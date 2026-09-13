import { StyleSheet, Text, View } from "react-native";
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
    <View style={styles.wrap}>
      {TOOLS.map((tool, i) => {
        const status = statuses[tool] ?? "pending";
        return (
          <View key={tool} style={styles.item}>
            {i > 0 ? <Text style={[styles.arrow, { color: COLOR[status] }]}>→</Text> : null}
            <Text style={[styles.chip, { color: COLOR[status] }]}>
              {MARK[status]} {tool}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 4, rowGap: 6 },
  item: { flexDirection: "row", alignItems: "center" },
  arrow: { marginHorizontal: 4, fontSize: 12 },
  chip: { fontSize: 12, fontWeight: "600", fontFamily: undefined },
});
