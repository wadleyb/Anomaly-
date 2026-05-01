import React from "react";
import { TouchableOpacity, Text } from "react-native";

export function SecondaryButton({ title, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 8,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#000",
        minWidth: 200,
      }}
    >
      <Text
        style={{
          color: "#000",
          fontSize: 18,
          fontWeight: "bold",
        }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}
