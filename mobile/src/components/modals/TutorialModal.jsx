import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { AnomalyPreviewGrid } from "../game/AnomalyPreviewGrid";
import { Infinity, Zap, Heart } from "lucide-react-native";
// ADD: use Skia + our ShapeRenderer to draw original tutorial grids
import { Canvas, Group } from "@shopify/react-native-skia";
import { ShapeRenderer } from "../game/ShapeRenderer";

// Local, tiny renderer for static tutorial examples
function TutorialGridPreview({
  gridSize = 4,
  pattern = "rowAlt",
  label = "",
  anomalyIndex,
}) {
  const canvas = 140; // match previous image size
  const cellSize = canvas / gridSize;

  const baseShape = {
    type: "circle",
    size: Math.min(cellSize * 0.6, 24),
    rotation: 0,
    strokeWidth: 2,
    variant: "filled",
  };

  const secondaryType = "square"; // clear contrast with circle
  const anomalyType = "triangle"; // distinct anomaly

  const shapes = useMemo(() => {
    const total = gridSize * gridSize;
    const arr = new Array(total).fill(null);

    for (let i = 0; i < total; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      let type = baseShape.type;

      if (pattern === "rowAlt") {
        type = row % 2 === 0 ? baseShape.type : secondaryType;
      } else if (pattern === "checker") {
        type = (row + col) % 2 === 0 ? baseShape.type : secondaryType;
      } else if (pattern === "colAlt") {
        type = col % 2 === 0 ? baseShape.type : secondaryType;
      }

      arr[i] = { ...baseShape, type };
    }

    const idx =
      typeof anomalyIndex === "number"
        ? anomalyIndex
        : Math.floor(total / 2) - Math.ceil(gridSize / 2);
    arr[idx] = { ...baseShape, type: anomalyType };

    return arr;
  }, [gridSize, pattern]);

  return (
    <View style={{ alignItems: "center" }}>
      {label ? (
        <Text
          style={{
            fontSize: 12,
            color: "#888",
            marginBottom: 6,
            fontWeight: "500",
          }}
        >
          {label}
        </Text>
      ) : null}
      <View
        style={{
          width: canvas,
          height: canvas,
          backgroundColor: "#fff",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <Canvas style={{ flex: 1 }}>
          {shapes.map((shape, i) => {
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            const cx = col * cellSize + cellSize / 2;
            const cy = row * cellSize + cellSize / 2;
            return (
              <Group key={i}>
                <ShapeRenderer shape={shape} x={cx} y={cy} />
              </Group>
            );
          })}
        </Canvas>
      </View>
    </View>
  );
}

export function TutorialModal({ visible, onClose }) {
  const { width } = Dimensions.get("window");
  const modalPadding = 24;
  const cardWidth = Math.min(360, width - modalPadding * 2);
  const [page, setPage] = useState(0);

  if (!visible) return null;

  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
        alignItems: "center",
        justifyContent: "center",
        padding: modalPadding,
      }}
    >
      <View
        style={{
          width: cardWidth,
          maxWidth: 420,
          backgroundColor: "#fff",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <View
          style={{ padding: 16, borderBottomWidth: 1, borderColor: "#eee" }}
        >
          <Text
            style={{ fontSize: 18, fontWeight: "600", textAlign: "center" }}
          >
            How to Play
          </Text>
        </View>

        {/* Slides */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            const w = e.nativeEvent.layoutMeasurement.width;
            const p = Math.round(x / w);
            if (p !== page) setPage(p);
          }}
          scrollEventThrottle={16}
          style={{ width: cardWidth, height: 360 }}
          contentContainerStyle={{ alignItems: "center" }}
        >
          {/* Slide 1: Concept */}
          <View style={{ width: cardWidth, padding: 20, alignItems: "center" }}>
            <Text
              style={{
                fontSize: 16,
                color: "#111",
                textAlign: "center",
                marginBottom: 14,
              }}
            >
              Spot the odd one out.
            </Text>
            <AnomalyPreviewGrid />
            <Text
              style={{
                fontSize: 13,
                color: "#666",
                textAlign: "center",
                marginTop: 12,
              }}
            >
              Find the square among the circles. Tap it!
            </Text>
          </View>

          {/* Slide 2: Original illustrations using our assets */}
          <View style={{ width: cardWidth, padding: 20, alignItems: "center" }}>
            <Text
              style={{
                fontSize: 16,
                color: "#111",
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              It gets trickier.
            </Text>

            {/* Grids side by side */}
            <View style={{ flexDirection: "row", gap: 16, marginBottom: 12 }}>
              <TutorialGridPreview
                gridSize={4}
                pattern="rowAlt"
                label="4×4 Grid"
              />
              <TutorialGridPreview
                gridSize={5}
                pattern="checker"
                label="5×5 Grid"
              />
            </View>

            <Text
              style={{
                fontSize: 13,
                color: "#666",
                textAlign: "center",
              }}
            >
              New sizes, rotations, and shapes. One anomaly per grid.
            </Text>
          </View>

          {/* Slide 3: Modes */}
          <View style={{ width: cardWidth, padding: 20, alignItems: "center" }}>
            <Text
              style={{
                fontSize: 18,
                color: "#111",
                textAlign: "center",
                marginBottom: 20,
                fontWeight: "600",
              }}
            >
              Game Modes
            </Text>
            <View style={{ width: cardWidth - 40, gap: 16 }}>
              {/* Freeplay */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "#F3F4F6",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Infinity size={20} color="#000" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: "#000",
                      marginBottom: 2,
                    }}
                  >
                    Freeplay
                  </Text>
                  <Text style={{ fontSize: 13, color: "#666" }}>
                    Endless play. One life.
                  </Text>
                </View>
              </View>

              {/* Speed */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "#F3F4F6",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Zap size={20} color="#000" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: "#000",
                      marginBottom: 2,
                    }}
                  >
                    Speed
                  </Text>
                  <Text style={{ fontSize: 13, color: "#666" }}>
                    Start with 5s. Gain +0.5s per correct tap!
                  </Text>
                </View>
              </View>

              {/* Survival */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "#F3F4F6",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Heart size={20} color="#000" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: "#000",
                      marginBottom: 2,
                    }}
                  >
                    Survival
                  </Text>
                  <Text style={{ fontSize: 13, color: "#666" }}>
                    3 hearts. Timer or wrong tap loses a heart.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Dots */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 10,
          }}
        >
          {[0, 1, 2].map((i) => (
            <View
              key={`dot-${i}`}
              style={{
                width: 8,
                height: 8,
                borderRadius: 99,
                backgroundColor: page === i ? "#000" : "#DDD",
              }}
            />
          ))}
        </View>

        {/* Footer */}
        <View
          style={{
            padding: 12,
            borderTopWidth: 1,
            borderColor: "#eee",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: "#000",
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 10,
              minWidth: 120,
            }}
          >
            <Text
              style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}
            >
              Got it
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
