import React from "react";
import { View, Text, Pressable, Dimensions } from "react-native";
import { useGameStore } from "@/utils/game/store";

export default function WordGrid({ level, onCellPress }) {
  const { width } = Dimensions.get("window");
  const size = Math.max(20, width - 60); // keep same visual footprint as shapes
  const game = useGameStore();

  const rows = Math.max(1, level?.rows || 2);
  const cols = Math.max(1, level?.cols || 2);
  const words = Array.isArray(level?.words) ? level.words : [];
  const anomalyIndex =
    typeof level?.anomalyIndex === "number" ? level.anomalyIndex : -1;

  const cellW = size / cols;
  const cellH = size / rows;

  // scale font with grid density, keep it bold and readable
  const base = 28;
  const density = Math.max(rows, cols);
  const fontSize = Math.max(
    14,
    Math.min(base, Math.floor(base - (density - 2) * 4)),
  );

  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: "#F5F3EE",
        position: "relative",
      }}
    >
      {/* Cells */}
      {words.map((word, index) => {
        const r = Math.floor(index / cols);
        const c = index % cols;
        const left = c * cellW;
        const top = r * cellH;

        // feedback highlights
        let bg = "transparent";
        if (game?.isShowingFeedback) {
          if (index === game.wrongTapIndex)
            bg = "rgba(255,68,68,0.6)"; // red
          else if (index === anomalyIndex) bg = "rgba(68,255,68,0.6)"; // green
        }

        return (
          <Pressable
            key={`word-${index}`}
            onPress={() => {
              try {
                if (typeof onCellPress === "function") onCellPress(index);
              } catch (e) {
                console.error("WordGrid onCellPress error", e);
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={`word-cell-${index}`}
            style={{
              position: "absolute",
              left,
              top,
              width: cellW,
              height: cellH,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 4, // a bit tighter to give words more room
              backgroundColor: bg,
            }}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.35}
              ellipsizeMode="clip" // never show ...
              style={{
                fontSize,
                fontWeight: "800",
                color: "#111",
                textTransform: "capitalize",
                includeFontPadding: false,
                textAlign: "center",
              }}
            >
              {String(word || "").trim()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
