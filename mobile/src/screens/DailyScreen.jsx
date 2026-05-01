import React from "react";
import { View, Text, TouchableOpacity, Share, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useJourneyStore, dailyDayNumber } from "@/utils/game/journeyStore";

// Result/landing screen for the Daily Puzzle.
// If today's daily is not yet done, shows "PLAY" entry.
// If done, shows the share card with streak.
export function DailyScreen({ onNavigate }) {
  const insets = useSafeAreaInsets();
  const journey = useJourneyStore();
  const available = journey.isDailyAvailable();

  const onPlay = () => {
    if (typeof globalThis !== "undefined") {
      globalThis.__ANOMALY_DAILY__ = { active: true };
    }
    onNavigate("game");
  };

  const card = `ANOMALY · Day ${dailyDayNumber()}\n${(journey.lastDailyResults || []).join("")}\nStreak: 🔥 ${journey.dailyStreak}`;

  const onShare = async () => {
    try { await Share.share({ message: card }); } catch (e) {}
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, paddingHorizontal: 24 }}>
      <TouchableOpacity onPress={() => onNavigate("home")}>
        <Text style={{ color: "#666", fontSize: 13, letterSpacing: 1 }}>← BACK</Text>
      </TouchableOpacity>

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontWeight: "900", fontSize: 28, letterSpacing: 3 }}>DAILY</Text>
        <Text style={{ color: "#6b6963", fontSize: 12, marginTop: 6, letterSpacing: 1 }}>DAY #{dailyDayNumber()}</Text>
        <Text style={{ color: "#d4a93a", fontWeight: "800", marginTop: 12, letterSpacing: 1 }}>🔥 {journey.dailyStreak} day streak</Text>

        {available ? (
          <View style={{ marginTop: 32, alignItems: "center" }}>
            <Text style={{ color: "#333", fontSize: 14, marginBottom: 18, textAlign: "center" }}>
              5 puzzles. One try only. Same for everyone today.
            </Text>
            <TouchableOpacity onPress={onPlay} style={{ backgroundColor: "#d4a93a", paddingVertical: 16, paddingHorizontal: 40, borderRadius: 14 }}>
              <Text style={{ color: "#1a1208", fontWeight: "900", letterSpacing: 3 }}>PLAY DAILY</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ marginTop: 24, alignItems: "center" }}>
            <View style={{ backgroundColor: "#111", padding: 16, borderRadius: 14, marginVertical: 12 }}>
              <Text style={{ color: "#fff", fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }), fontSize: 14, lineHeight: 22 }}>{card}</Text>
            </View>
            <TouchableOpacity onPress={onShare} style={{ backgroundColor: "#111", paddingVertical: 14, paddingHorizontal: 36, borderRadius: 12, marginTop: 8 }}>
              <Text style={{ color: "#fff", fontWeight: "900", letterSpacing: 2 }}>SHARE</Text>
            </TouchableOpacity>
            <Text style={{ marginTop: 24, color: "#6b6963", fontSize: 12, textAlign: "center", maxWidth: 280 }}>
              Come back tomorrow for a new puzzle. Streak resets if you miss a day.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
