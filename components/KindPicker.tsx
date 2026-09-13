import { Pressable, StyleSheet, Text, View } from "react-native";
import { KINDS, KIND_LABEL, type Kind } from "@/lib/domain";
import { kindStyle, radius } from "@/lib/theme";

interface Props {
  kind: Kind;
  onSelect: (kind: Kind) => void;
}

/** Kind picker inside the edit sheet. Quality renders disabled with its reason. */
export default function KindPicker({ kind, onSelect }: Props) {
  return (
    <View style={styles.row}>
      {KINDS.map((option) => {
        const style = kindStyle[option];
        const selected = option === kind;
        return (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            style={[
              styles.chip,
              { borderColor: style.border },
              selected && { backgroundColor: style.tint, borderColor: style.color },
            ]}
          >
            <Text style={[styles.label, { color: style.color }, selected && styles.labelStrong]}>
              {KIND_LABEL[option]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
  },
  label: { fontSize: 14, fontWeight: "500" },
  labelStrong: { fontWeight: "700" },
});
