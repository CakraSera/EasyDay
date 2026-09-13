import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Banner, { type BannerTone } from "@/components/Banner";
import EditSheet from "@/components/EditSheet";
import SessionCard from "@/components/SessionCard";
import TraceSection from "@/components/TraceSection";
import WorkflowChips from "@/components/WorkflowChips";
import {
  checkWeek,
  DAY_SHORT,
  formatRange,
  humanizeViolation,
  mondayOf,
  weekSummary,
  type Kind,
  type Week,
} from "@/lib/domain";
import { loadWeek, saveWeek } from "@/lib/store";
import { palette, radius } from "@/lib/theme";
import {
  runBuildThisWeek,
  type Span,
  type ToolStatus,
} from "@/lib/weeksmith";

interface BannerState {
  tone: BannerTone;
  text: string;
}

export default function Index() {
  const [log, setLog] = useState("");
  const [week, setWeek] = useState<Week | null>(() => loadWeek());
  const [building, setBuilding] = useState(false);
  const [spans, setSpans] = useState<Span[]>([]);
  const [statuses, setStatuses] = useState<Record<string, ToolStatus>>({});
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const weekStart = mondayOf(new Date());

  const build = useCallback(async () => {
    setBuilding(true);
    setBanner(null);
    setStatuses({});
    const result = await runBuildThisWeek(log, (next) => {
      setSpans(next);
      setStatuses(Object.fromEntries(next.map((s) => [s.tool, s.status])));
    });
    if (result.ok && result.week) {
      saveWeek(result.week);
      setWeek(result.week);
      setBanner(
        result.week.flags.includes("pain")
          ? {
              tone: "pain",
              text: "Your Log mentions pain, so this week has no Quality — Easy, Walk, and Rest only. This is not a diagnosis.",
            }
          : { tone: "ok", text: `Week saved · ${weekSummary(result.week)}` },
      );
    } else {
      setBanner({
        tone: "error",
        text: `Build failed: ${result.error ?? "Weeksmith could not complete"}. Nothing was saved.`,
      });
    }
    setBuilding(false);
  }, [log]);

  const applyEdit = useCallback(
    (index: number, kind: Kind, minutes: number, note: string) => {
      if (!week) return;
      const sessions = week.sessions.map((s, i) =>
        i === index
          ? {
              ...s,
              kind,
              durationMinutes: kind === "rest" ? 0 : minutes,
              note: kind === "rest" && kind !== week.sessions[i].kind ? "" : note,
              hard: kind === "quality",
            }
          : s,
      );
      const next: Week = { ...week, sessions };
      const violations = checkWeek(next);
      if (violations.length > 0) {
        setBanner({
          tone: "blocked",
          text: `Change not applied — ${humanizeViolation(violations[0].code)} (${violations[0].detail})`,
        });
      } else {
        saveWeek(next);
        setWeek(next);
        setBanner({ tone: "ok", text: "Session updated." });
      }
      setEditingIndex(null);
    },
    [week],
  );

  const editing = useMemo(
    () => (editingIndex !== null && week ? week.sessions[editingIndex] : null),
    [editingIndex, week],
  );

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.tagline}>This week is for VO₂ max — mostly Easy, one Quality, one Rest or Walk.</Text>
      </View>

      <View style={styles.weekHeader}>
        <Text style={styles.weekTitle}>This Week</Text>
        <Text style={styles.weekRange}>{formatRange(weekStart)}</Text>
      </View>

      {banner ? (
        <View style={styles.bannerSlot}>
          <Banner tone={banner.tone} text={banner.text} />
        </View>
      ) : null}

      {week ? (
        <View style={styles.board}>
          {week.sessions.map((session, i) => (
            <Pressable key={session.date} onPress={() => setEditingIndex(i)} disabled={building}>
              <SessionCard
                kind={session.kind}
                minutes={session.durationMinutes}
                note={session.note}
                date={session.date}
                dayIndex={i}
                disabled={building}
                onTap={() => undefined}
              />
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No week yet</Text>
          <Text style={styles.emptyBody}>
            Paste a messy Log below (or leave it empty), then tap Build this week. Seven cards,
            Monday to Sunday, always.
          </Text>
        </View>
      )}

      <View style={styles.logSection}>
        <Text style={styles.sectionLabel}>Log (optional)</Text>
        <TextInput
          style={styles.logInput}
          multiline
          placeholder="e.g. Rabu lutut agak nyeri, jalan aja. Selasa 40 menit gampang."
          placeholderTextColor={palette.faint}
          value={log}
          onChangeText={setLog}
        />
        <Pressable
          style={[styles.cta, building && styles.ctaBusy]}
          onPress={build}
          disabled={building}
        >
          <Text style={styles.ctaLabel}>{building ? "Building…" : "Build this week"}</Text>
        </Pressable>
        <WorkflowChips statuses={statuses} />
      </View>

      <TraceSection spans={spans} running={building} />

      <EditSheet
        session={editing}
        dayIndex={editingIndex ?? 0}
        painFlag={week?.flags.includes("pain") ?? false}
        onApply={(kind, minutes, note) => editingIndex !== null && applyEdit(editingIndex, kind, minutes, note)}
        onClose={() => setEditingIndex(null)}
      />

      <Text style={styles.footer}>
        {DAY_SHORT.join(" · ")} — one week at a time. No past weeks, no chat, no diagnosis.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 16, gap: 14, maxWidth: 480, width: "100%", alignSelf: "center" },
  header: { gap: 4, marginTop: 8 },
  tagline: { fontSize: 13, color: palette.muted, lineHeight: 18 },
  weekHeader: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: 6 },
  weekTitle: { fontSize: 17, fontWeight: "700", color: palette.ink },
  weekRange: { fontSize: 13, color: palette.muted },
  bannerSlot: { gap: 0 },
  board: { gap: 10 },
  empty: {
    backgroundColor: palette.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 20,
    gap: 6,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: palette.ink },
  emptyBody: { fontSize: 13, color: palette.muted, lineHeight: 19 },
  logSection: { gap: 8, marginTop: 4 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: palette.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  logInput: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.control,
    minHeight: 72,
    padding: 12,
    fontSize: 14,
    color: palette.ink,
    textAlignVertical: "top",
  },
  cta: {
    backgroundColor: palette.ink,
    borderRadius: radius.control,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaBusy: { opacity: 0.6 },
  ctaLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  footer: { fontSize: 11, color: palette.faint, textAlign: "center", marginBottom: 24 },
});
