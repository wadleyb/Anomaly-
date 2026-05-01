import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGameStore } from "@/utils/game/store";

export function ModeSelectScreen({ onNavigate }) {
  const insets = useSafeAreaInsets();
  const resetForMode = useGameStore((state) => state.resetForMode);

  const modes = [
    {
      key: "FREEPLAY",
      title: "FREEPLAY",
      subtitle: "Endless puzzles. One mistake = game over.",
    },
    {
      key: "SURVIVAL",
      title: "SURVIVAL",
      subtitle: "You have 3 lives. Lose them all to end the run.",
    },
    {
      key: "SPEED",
      title: "SPEED",
      subtitle: "Beat the clock. Correct taps add time.",
    },
    // ADD: Words mode button under Speed
    {
      key: "WORDS",
      title: "WORDS",
      subtitle: "Find the odd word in the grid.",
    },
  ];

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top + 40,
        paddingBottom: insets.bottom + 20,
        paddingHorizontal: 40,
      }}
    >
      <Text
        style={{
          fontSize: 32,
          fontWeight: "bold",
          color: "#000",
          textAlign: "center",
          marginBottom: 40,
        }}
      >
        MODES
      </Text>

      <View style={{ flex: 1, justifyContent: "center", gap: 30 }}>
        {modes.map((mode) => (
          <TouchableOpacity
            key={mode.key}
            onPress={() => {
              resetForMode(mode.key);
              onNavigate("game");
            }}
            style={{
              backgroundColor: "#000",
              padding: 20,
              borderRadius: 8,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "#F5F3EE",
                fontSize: 20,
                fontWeight: "bold",
                marginBottom: 8,
              }}
            >
              {mode.title}
            </Text>
            <Text
              style={{
                color: "#F5F3EE",
                fontSize: 14,
                textAlign: "center",
                opacity: 0.8,
              }}
            >
              {mode.subtitle}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={() => onNavigate("home")}
        style={{ alignSelf: "center" }}
      >
        <Text style={{ color: "#666", fontSize: 16 }}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
}
