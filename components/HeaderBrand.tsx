import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { palette } from "@/lib/theme";

/** Board chrome brand: runner icon + wordmark in the navigation header. */
export default function HeaderBrand() {
  return (
    <View style={styles.row}>
      <MaterialCommunityIcons name="run" size={22} color={palette.ink} />
      <Text style={styles.label}>RunMax</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { fontSize: 18, fontWeight: "800", color: palette.ink, letterSpacing: -0.4 },
});
