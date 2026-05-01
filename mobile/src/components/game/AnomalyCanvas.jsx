import React from "react";
import { View, Dimensions, Pressable } from "react-native";
import { Canvas, Group, Rect } from "@shopify/react-native-skia";
import { ShapeRenderer } from "./ShapeRenderer";
import { useGameStore } from "@/utils/game/store";

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function AnomalyCanvas({ level, onCellPress }) {
  const { width } = Dimensions.get("window");
  const canvasSize = Math.max(20, width - 60); // ensure non-zero size
  const gameState = useGameStore();

  // SAFETY: guard against missing level or shapes
  const gridSize = Math.max(1, level?.gridSize || 3);
  const shapes = Array.isArray(level?.shapes) ? level.shapes : [];
  const anomalyIndex =
    typeof level?.anomalyIndex === "number" ? level.anomalyIndex : -1;

  const cellSize = canvasSize / gridSize;

  const renderFeedbackHighlight = (index) => {
    if (!gameState?.isShowingFeedback) return null;

    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    const x = col * cellSize;
    const y = row * cellSize;

    let color = null;
    if (index === gameState.wrongTapIndex) {
      color = "#FF4444"; // Red for wrong tap
    } else if (index === anomalyIndex) {
      color = "#44FF44"; // Green for correct anomaly
    }

    if (!color) return null;

    return (
      <Rect
        key={`feedback-${index}`}
        x={x || 0}
        y={y || 0}
        width={cellSize || 1}
        height={cellSize || 1}
        color={color}
        opacity={0.6}
      />
    );
  };

  return (
    <View
      style={{
        width: canvasSize,
        height: canvasSize,
        backgroundColor: "#F5F3EE",
        position: "relative",
      }}
      pointerEvents={shapes.length ? "auto" : "none"}
    >
      {/* Drawing layer */}
      <Canvas style={{ flex: 1 }}>
        {/* Render feedback highlights first (behind shapes) */}
        {gameState?.isShowingFeedback &&
          shapes.map((_, index) => renderFeedbackHighlight(index))}

        {/* Render shapes on top */}
        {shapes.map((shape, index) => {
          if (!shape) return null; // guard against undefined

          const row = Math.floor(index / gridSize);
          const col = index % gridSize;
          const centerX = col * cellSize + cellSize / 2;
          const centerY = row * cellSize + cellSize / 2;

          // Prevent offsets from crossing into neighboring cells
          const sz = shape.size || 28;
          const maxOffsetX = Math.max(0, cellSize / 2 - sz / 2 - 2);
          const maxOffsetY = Math.max(0, cellSize / 2 - sz / 2 - 2);
          const safeOffsetX = clamp(
            shape.offsetX || 0,
            -maxOffsetX,
            maxOffsetX,
          );
          const safeOffsetY = clamp(
            shape.offsetY || 0,
            -maxOffsetY,
            maxOffsetY,
          );

          return (
            <Group key={`shape-${index}`}>
              <ShapeRenderer
                shape={shape}
                x={centerX + safeOffsetX || 0}
                y={centerY + safeOffsetY || 0}
              />
            </Group>
          );
        })}
      </Canvas>

      {/* Touch overlay (JS thread). Reliable in production and avoids worklet -> state calls */}
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: canvasSize,
          height: canvasSize,
        }}
        pointerEvents={shapes.length ? "auto" : "none"}
      >
        {shapes.map((_, index) => {
          const row = Math.floor(index / gridSize);
          const col = index % gridSize;
          const left = col * cellSize;
          const top = row * cellSize;

          return (
            <Pressable
              key={`hit-${index}`}
              accessibilityRole="button"
              accessibilityLabel={`grid-cell-${index}`}
              onPress={() => {
                try {
                  if (typeof onCellPress === "function") {
                    onCellPress(index);
                  }
                } catch (e) {
                  // log but never crash
                  console.error("onCellPress error", e);
                }
              }}
              style={{
                position: "absolute",
                left,
                top,
                width: cellSize,
                height: cellSize,
                // transparent hitbox; keep it fully interactive
                backgroundColor: "transparent",
              }}
            />
          );
        })}
      </View>
    </View>
  );
}
