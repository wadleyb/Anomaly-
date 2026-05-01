import React from "react";
import { View } from "react-native";
import { clamp } from "@/utils/game/random";

export function TimerBar({ progress }) {
  return (
    <View
      style={{
        height: 6,
        backgroundColor: "#E0E0E0",
        marginHorizontal: 20,
        marginBottom: 40,
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: "100%",
          backgroundColor: "#000",
          width: `${clamp(progress, 0, 1) * 100}%`,
          borderRadius: 3,
        }}
      />
    </View>
  );
}
