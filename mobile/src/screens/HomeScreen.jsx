import React, { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { useGameStore } from "@/utils/game/store";
import { AnomalyPreviewGrid } from "@/components/game/AnomalyPreviewGrid";
import { useJourneyStore, dailyDayNumber, MAX_LIVES } from "@/utils/game/journeyStore";

// New home screen — surfaces JOURNEY (main mode) and DAILY (retention) as
// primary cards, with classic MODES tucked underneath.
export function HomeScreen({ onNavigate }) {
  const insets = useSafeAreaInsets();
  const journey = useJourneyStore();

  useEffect(() => {
    if (!journey.hydrated) journey.hydrate();
    else journey.regenLives();
  }, [journey.hydrated]);

  const dailyAvailable = journey.isDailyAvailable();
  const nextLevel = journey.journeyProgress + 1;

  return (
    <View style={{ flex: 1, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16, paddingHorizontal: 24, alignItems: "center" }}>
      {/* Top bar: lives + best */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%", marginBottom: 8 }}>
        <View style={{ backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#111", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ color: "#dc2626" }}>♥</Text>
          <Text style={{ fontWeight: "800", letterSpacing: 1 }}>{journey.lives}/{MAX_LIVES}</Text>
        </View>
        <TouchableOpacity onPress={() => onNavigate("settings")}>
          <Text style={{ color: "#666", fontSize: 18 }}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* Logo */}
      <Image
        source={{ uri: "https://ucarecdn.com/580bba49-e39c-4738-bec5-1a0ba44777cd/-/format/auto/" }}
        style={{ width: 320, height: 110 }}
        contentFit="contain"
        transition={100}
      />
      <Text style={{ fontSize: 12, color: "#666", textAlign: "center", letterSpacing: 2, marginTop: -2 }}>SPOT THE ODD ONE OUT</Text>

      <View style={{ marginTop: 12, height: 90 }}><AnomalyPreviewGrid /></View>

      {/* Cards */}
      <View style={{ width: "100%", marginTop: 14, gap: 10 }}>
        {/* JOURNEY full-width primary */}
        <TouchableOpacity
          onPress={() => onNavigate("journey")}
          style={{ backgroundColor: "#111", borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}
        >
          <Text style={{ fontSize: 28 }}>🗺️</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#fff", fontWeight: "900", letterSpacing: 2, fontSize: 14 }}>JOURNEY</Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 }}>
              Level {nextLevel} · {journey.journeyProgress} completed
            </Text>
          </View>
          <Text style={{ color: "#fff", fontSize: 18 }}>▸</Text>
        </TouchableOpacity>

        {/* Row: Daily + Modes */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={() => onNavigate("daily")}
            style={{ flex: 1, backgroundColor: "#fff", borderWidth: 2, borderColor: dailyAvailable ? "#d4a93a" : "#111", borderRadius: 16, padding: 14 }}
          >
            <Text style={{ fontSize: 20 }}>{dailyAvailable ? "⭐" : "✓"}</Text>
            <Text style={{ fontWeight: "900", letterSpacing: 2, fontSize: 13, marginTop: 4 }}>DAILY</Text>
            <Text style={{ fontSize: 11, color: "#6b6963", marginTop: 2 }}>
              {dailyAvailable ? `Day #${dailyDayNumber()}` : "Done — see you tomorrow"}
            </Text>
            <Text style={{ fontSize: 11, color: "#d4a93a", marginTop: 4, fontWeight: "700" }}>🔥 {journey.dailyStreak}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onNavigate("modes")}
            style={{ flex: 1, backgroundColor: "#fff", borderWidth: 2, borderColor: "#111", borderRadius: 16, padding: 14 }}
          >
            <Text style={{ fontSize: 20 }}>⚡</Text>
            <Text style={{ fontWeight: "900", letterSpacing: 2, fontSize: 13, marginTop: 4 }}>MODES</Text>
            <Text style={{ fontSize: 11, color: "#6b6963", marginTop: 2 }}>Zen · Survival · Speed · Words</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1 }} />

      <Text style={{ color: "#a09c95", fontSize: 11, letterSpacing: 1.5 }}>
        TOP COMBO ×{journey.topCombo}
      </Text>
    </View>
  );
}
