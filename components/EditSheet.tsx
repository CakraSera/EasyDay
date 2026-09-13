import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { type Kind, type Session } from "@/lib/domain";
import { palette, radius } from "@/lib/theme";
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
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <Text style={styles.title}>{DAY_NAMES[dayIndex]}</Text>
          <Text style={styles.subtitle}>
            {formatDate(session.date)} · date is locked · hard follows Kind
          </Text>

          <Text style={styles.sectionLabel}>Kind</Text>
          <KindPicker kind={kind} onSelect={setKind} />

          <Text style={styles.sectionLabel}>Minutes</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={minutes}
            onChangeText={setMinutes}
            placeholder="0"
            placeholderTextColor={palette.faint}
          />
          {kind === "rest" ? (
            <Text style={styles.hint}>Rest is always 0 minutes — minutes clear on Apply.</Text>
          ) : kind === "walk" ? (
            <Text style={styles.hint}>Walk may have minutes.</Text>
          ) : (
            <Text style={styles.hint}>Easy and Quality need at least 1 minute.</Text>
          )}

          <Text style={styles.sectionLabel}>Note</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            value={note}
            onChangeText={setNote}
            multiline
            placeholder="One ordinary line. No paces."
            placeholderTextColor={palette.faint}
          />

          {painFlag ? (
            <Text style={styles.hint}>
              Your Log mentions pain — Quality stays locked out this week.
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.secondary]} onPress={onClose}>
              <Text style={styles.secondaryLabel}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.primary]}
              onPress={() => onApply(kind, safeMinutes, note)}
            >
              <Text style={styles.primaryLabel}>Apply</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: "rgba(20,22,26,0.4)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: 20,
    gap: 6,
  },
  title: { fontSize: 18, fontWeight: "700", color: palette.ink },
  subtitle: { fontSize: 13, color: palette.muted },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: palette.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.control,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: palette.ink,
    backgroundColor: "#FFFFFF",
  },
  noteInput: { minHeight: 60, textAlignVertical: "top" },
  hint: { fontSize: 12, color: palette.warn, marginTop: 2 },
  actions: { flexDirection: "row", gap: 10, marginTop: 16 },
  button: { flex: 1, borderRadius: radius.control, paddingVertical: 12, alignItems: "center" },
  secondary: { backgroundColor: palette.infoTint },
  secondaryLabel: { color: palette.info, fontWeight: "600" },
  primary: { backgroundColor: palette.ink },
  primaryLabel: { color: "#FFFFFF", fontWeight: "700" },
});
