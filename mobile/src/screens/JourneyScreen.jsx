import React, { useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useJourneyStore, starsForLevel, MAX_LIVES } from "@/utils/game/journeyStore";
import { useGameStore } from "@/utils/game/store";

// Level-map screen: shows a vertical scrolling path of nodes.
// Each node = one level. Tap to start. Locked levels are non-interactive.
export function JourneyScreen({ onNavigate }) {
  const insets = useSafeAreaInsets();
  const journey = useJourneyStore();
  const resetForMode = useGameStore((s) => s.resetForMode);

  useEffect(() => {
    journey.regenLives();
    const i = setInterval(() => journey.regenLives(), 30000);
    return () => clearInterval(i);
  }, []);

  const totalToShow = Math.min(60, journey.journeyProgress + 10);

  const onTapLevel = (n) => {
    if (n > journey.journeyProgress + 1) return; // locked
    if (journey.lives <= 0) return; // out of lives
    // Configure game store for this journey level via FREEPLAY-style with custom level number
    resetForMode("FREEPLAY");
    // Pass level info via a global so GameScreen can read it (legacy-friendly)
    if (typeof globalThis !== "undefined") {
      globalThis.__ANOMALY_JOURNEY__ = {
        levelNumber: n,
        objective: pickObjectiveForLevel(n),
      };
    }
    onNavigate("game");
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 12, alignItems: "center" }}>
        <TouchableOpacity onPress={() => onNavigate("home")}>
          <Text style={{ color: "#666", fontSize: 13, letterSpacing: 1 }}>← BACK</Text>
        </TouchableOpacity>
        <View style={{ backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#111", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ color: "#dc2626" }}>♥</Text>
          <Text style={{ fontWeight: "800", letterSpacing: 1 }}>{journey.lives}/{MAX_LIVES}</Text>
        </View>
      </View>
      <View style={{ alignItems: "center", marginBottom: 8 }}>
        <Text style={{ fontWeight: "900", fontSize: 22, letterSpacing: 3 }}>JOURNEY</Text>
        <Text style={{ color: "#6b6963", fontSize: 12, marginTop: 4, letterSpacing: 1 }}>
          {journey.journeyProgress} / 500 · {Object.values(journey.journeyStars).reduce((a, b) => a + b, 0)} stars
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingVertical: 24, alignItems: "center" }} showsVerticalScrollIndicator={false}>
        {Array.from({ length: totalToShow }, (_, idx) => {
          const n = idx + 1;
          const completed = n <= journey.journeyProgress;
          const current = n === journey.journeyProgress + 1;
          const locked = n > journey.journeyProgress + 1;
          const stars = journey.journeyStars[n] || 0;
          const offset = ((n - 1) % 6) - 2.5;
          return (
            <View key={n} style={{ marginLeft: offset * 24, marginBottom: 18 }}>
              <TouchableOpacity
                disabled={locked}
                onPress={() => onTapLevel(n)}
                style={{
                  width: 64, height: 64, borderRadius: 32,
                  backgroundColor: completed ? "#111" : locked ? "#ebe7df" : "#fff",
                  borderWidth: 2.5,
                  borderColor: locked ? "#a09c95" : "#111",
                  alignItems: "center", justifyContent: "center",
                  ...(current ? { shadowColor: "#d4a93a", shadowOpacity: 0.6, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 6 } : {}),
                }}
              >
                <Text style={{ fontWeight: "900", fontSize: 18, color: completed ? "#fff" : locked ? "#a09c95" : "#111" }}>{n}</Text>
              </TouchableOpacity>
              {completed && (
                <Text style={{ textAlign: "center", color: "#d4a93a", fontSize: 11, marginTop: 2, letterSpacing: 1 }}>{starsForLevel(stars)}</Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function pickObjectiveForLevel(n) {
  const types = [
    { type: "find", label: "Find anomalies", target: 3 + Math.min(7, Math.floor(n / 3)) },
    { type: "perfect", label: "No mistakes", target: 4 + Math.floor(n / 4) },
    { type: "speed", label: "Speed find", target: 5 + Math.floor(n / 3) },
  ];
  return types[n % types.length];
}
