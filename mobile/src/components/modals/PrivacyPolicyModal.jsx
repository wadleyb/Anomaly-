import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";

export function PrivacyPolicyModal({ visible, onClose }) {
  const { width } = Dimensions.get("window");
  const modalPadding = 24;
  const cardWidth = Math.min(360, width - modalPadding * 2);

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
            Privacy Policy
          </Text>
        </View>

        {/* Content */}
        <ScrollView
          style={{ maxHeight: 400 }}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={true}
        >
          <Text
            style={{
              fontSize: 14,
              color: "#333",
              marginBottom: 16,
              lineHeight: 20,
            }}
          >
            <Text style={{ fontWeight: "600" }}>Last Updated:</Text> November
            30, 2025
          </Text>

          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: "#000",
              marginBottom: 8,
            }}
          >
            Data We Collect
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#333",
              marginBottom: 16,
              lineHeight: 20,
            }}
          >
            This app does not collect any personal information. The app
            functions entirely locally on your device.
          </Text>

          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: "#000",
              marginBottom: 8,
            }}
          >
            Local Storage
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#333",
              marginBottom: 16,
              lineHeight: 20,
            }}
          >
            The app stores your game preferences (sound, haptics, music
            settings) locally on your device. This data never leaves your
            device.
          </Text>

          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: "#000",
              marginBottom: 8,
            }}
          >
            No Third-Party Tracking
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#333",
              marginBottom: 16,
              lineHeight: 20,
            }}
          >
            We do not use any third-party analytics, advertising, or tracking
            tools. Your gameplay is completely private.
          </Text>

          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: "#000",
              marginBottom: 8,
            }}
          >
            Data Retention
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#333",
              marginBottom: 16,
              lineHeight: 20,
            }}
          >
            All data is stored locally. Deleting the app will remove all stored
            data from your device.
          </Text>

          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: "#000",
              marginBottom: 8,
            }}
          >
            Changes to This Policy
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#333",
              marginBottom: 16,
              lineHeight: 20,
            }}
          >
            We may update this privacy policy from time to time. Any changes
            will be reflected in the app.
          </Text>

          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: "#000",
              marginBottom: 8,
            }}
          >
            Contact
          </Text>
          <Text style={{ fontSize: 14, color: "#333", lineHeight: 20 }}>
            If you have questions about this privacy policy, please contact us
            through the App Store.
          </Text>
        </ScrollView>

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
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
