import React from "react";
import { View, Text } from "react-native";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";

export function LoseModal({
  visible,
  score,
  bestScore,
  mode,
  onPlayAgain,
  onHome,
}) {
  if (!visible) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.05)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
      }}
    >
      <View
        style={{
          backgroundColor: "#F5F3EE",
          padding: 40,
          borderRadius: 8,
          alignItems: "center",
          minWidth: "80%",
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "#000",
            marginBottom: 20,
          }}
        >
          YOU MISSED IT
        </Text>

        <Text style={{ fontSize: 18, color: "#000", marginBottom: 8 }}>
          SCORE: {score}
        </Text>
        <Text style={{ fontSize: 16, color: "#666", marginBottom: 30 }}>
          BEST: {bestScore}
        </Text>

        <View style={{ gap: 15, width: "100%" }}>
          <PrimaryButton title="PLAY AGAIN" onPress={onPlayAgain} />
          <SecondaryButton title="HOME" onPress={onHome} />
        </View>
      </View>
    </View>
  );
}
