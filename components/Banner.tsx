import { StyleSheet, Text, View } from "react-native";
import { palette, radius } from "@/lib/theme";

export type BannerTone = "ok" | "pain" | "blocked" | "error" | "info";

const TONE: Record<BannerTone, { bg: string; border: string; text: string; mark: string }> = {
  ok: { bg: palette.okTint, border: palette.okBorder, text: palette.ok, mark: "✓" },
  pain: { bg: palette.warnTint, border: "#F0DCA8", text: palette.warn, mark: "⚠" },
  blocked: { bg: palette.dangerTint, border: "#F2CFC9", text: palette.danger, mark: "✕" },
  error: { bg: palette.dangerTint, border: "#F2CFC9", text: palette.danger, mark: "✕" },
  info: { bg: palette.infoTint, border: palette.border, text: palette.info, mark: "ℹ" },
};

/** The one messenger: pain / ok / illegal tap / build failure (PRD §6). */
export default function Banner({ tone, text }: { tone: BannerTone; text: string }) {
  const style = TONE[tone];
  return (
    <View style={[styles.banner, { backgroundColor: style.bg, borderColor: style.border }]}>
      <Text style={[styles.mark, { color: style.text }]}>{style.mark}</Text>
      <Text style={[styles.text, { color: style.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    gap: 8,
    borderRadius: radius.control,
    borderWidth: 1,
    padding: 12,
    alignItems: "flex-start",
  },
  mark: { fontSize: 14, lineHeight: 19 },
  text: { flex: 1, fontSize: 13, fontWeight: "500", lineHeight: 19 },
});
