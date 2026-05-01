import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { useGameStore } from "@/utils/game/store";
import { AnomalyPreviewGrid } from "@/components/game/AnomalyPreviewGrid";

export function HomeScreen({ onNavigate }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top + 40,
        paddingBottom: insets.bottom + 20,
        paddingHorizontal: 40,
        alignItems: "center",
      }}
    >
      {/* --- TOP SECTION (Logo + Tagline) --- */}
      <View style={{ alignItems: "center" }}>
        <Image
          source={{
            uri: "https://ucarecdn.com/580bba49-e39c-4738-bec5-1a0ba44777cd/-/format/auto/",
          }}
          style={{
            width: 450,
            height: 160,
          }}
          contentFit="contain"
          transition={100}
        />

        <Text
          style={{
            fontSize: 16,
            color: "#666",
            textAlign: "center",
            marginTop: -10,
          }}
        >
          Spot the odd one out.
        </Text>
      </View>

      {/* --- PREVIEW GRID (fixed height + centered) --- */}
      <View
        style={{
          marginTop: 20,
          height: 120,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AnomalyPreviewGrid />
      </View>

      {/* --- SPACER (push buttons downward) --- */}
      <View style={{ flex: 1 }} />

      {/* --- BUTTONS --- */}
      <View style={{ alignItems: "center", gap: 20 }}>
        <PrimaryButton
          title="PLAY"
          onPress={() => {
            useGameStore.getState().resetForMode("FREEPLAY");
            onNavigate("game");
          }}
        />
        <SecondaryButton title="MODES" onPress={() => onNavigate("modes")} />
      </View>

      {/* --- FOOTER --- */}
      <TouchableOpacity
        onPress={() => onNavigate("settings")}
        style={{ marginTop: 40 }}
      >
        <Text style={{ color: "#666", fontSize: 16 }}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
}
