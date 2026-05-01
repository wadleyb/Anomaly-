import React from "react";
import { TouchableOpacity, Text } from "react-native";

export function PrimaryButton({ title, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: "#000",
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 8,
        alignItems: "center",
        minWidth: 200,
      }}
    >
      <Text
        style={{
          color: "#F5F3EE",
          fontSize: 18,
          fontWeight: "bold",
        }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}
