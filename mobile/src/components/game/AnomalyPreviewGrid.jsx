import React, { useEffect, useRef } from "react";
import { View, Animated, Easing } from "react-native";

export function AnomalyPreviewGrid() {
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const createPulseAnimation = () => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.06,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
    };

    const animation = createPulseAnimation();
    animation.start();

    return () => animation.stop();
  }, [scaleValue]);

  const renderShape = (index) => {
    const isAnomaly = index === 4; // Center position (0-indexed)

    if (isAnomaly) {
      return (
        <Animated.View
          key={index}
          style={{
            width: 32,
            height: 32,
            backgroundColor: "#000",
            transform: [{ scale: scaleValue }],
          }}
        />
      );
    }

    return (
      <View
        key={index}
        style={{
          width: 32,
          height: 32,
          backgroundColor: "#000",
          borderRadius: 16,
        }}
      />
    );
  };

  return (
    <View style={{ alignItems: "center" }}>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          width: 32 * 3 + 12 * 2, // 3 shapes + 2 gaps
          justifyContent: "space-between",
        }}
      >
        {Array.from({ length: 9 }, (_, index) => {
          const row = Math.floor(index / 3);
          const col = index % 3;

          return (
            <View
              key={index}
              style={{
                marginBottom: row < 2 ? 12 : 0, // Add gap between rows
              }}
            >
              {renderShape(index)}
            </View>
          );
        })}
      </View>
    </View>
  );
}
