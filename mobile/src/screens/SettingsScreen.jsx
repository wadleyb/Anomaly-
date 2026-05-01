import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGameStore } from "@/utils/game/store";
import { useSoundStore } from "@/utils/game/soundStore";
import { TutorialModal } from "@/components/modals/TutorialModal";
import { PrivacyPolicyModal } from "@/components/modals/PrivacyPolicyModal";

export function SettingsScreen({ onNavigate }) {
  const insets = useSafeAreaInsets();
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const hapticsEnabled = useGameStore((s) => s.hapticsEnabled);
  const toggleSound = useGameStore((s) => s.toggleSound);
  const toggleHaptics = useGameStore((s) => s.toggleHaptics);

  const musicOn = useSoundStore((s) => s.musicOn);
  const setMusicOn = useSoundStore((s) => s.setMusicOn);

  const [showTutorial, setShowTutorial] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleSoundToggle = () => {
    console.log("Sound toggle pressed, current:", soundEnabled);
    toggleSound();
  };

  const handleHapticsToggle = () => {
    console.log("Haptics toggle pressed, current:", hapticsEnabled);
    toggleHaptics();
  };

  const handleMusicToggle = () => {
    setMusicOn(!musicOn);
  };

  const Switch = ({ on, onPress, label }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
        paddingHorizontal: 4,
        minHeight: 48, // Better touch target
      }}
    >
      <Text style={{ color: "#000", fontSize: 16, flex: 1 }}>{label}</Text>
      <View
        style={{
          width: 48,
          height: 28,
          borderRadius: 999,
          backgroundColor: on ? "#000" : "#DDD",
          padding: 3,
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            backgroundColor: on ? "#F5F3EE" : "#fff",
            alignSelf: on ? "flex-end" : "flex-start",
          }}
        />
      </View>
    </TouchableOpacity>
  );

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
        SETTINGS
      </Text>

      <View style={{ flex: 1 }}>
        <Switch label="Music" on={musicOn} onPress={handleMusicToggle} />
        <Switch label="Sound" on={soundEnabled} onPress={handleSoundToggle} />
        <Switch
          label="Haptics"
          on={hapticsEnabled}
          onPress={handleHapticsToggle}
        />

        {/* Tutorial Button */}
        <TouchableOpacity
          onPress={() => setShowTutorial(true)}
          style={{
            marginTop: 24,
            alignSelf: "flex-start",
            backgroundColor: "#000",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            Tutorial
          </Text>
        </TouchableOpacity>

        {/* Privacy Policy Button */}
        <TouchableOpacity
          onPress={() => setShowPrivacy(true)}
          style={{
            marginTop: 12,
            alignSelf: "flex-start",
            backgroundColor: "#000",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            Privacy Policy
          </Text>
        </TouchableOpacity>
      </View>

      {/* Back */}
      <TouchableOpacity
        onPress={() => onNavigate("home")}
        style={{ alignSelf: "center" }}
      >
        <Text style={{ color: "#666", fontSize: 16 }}>← Back</Text>
      </TouchableOpacity>

      {/* Modal */}
      <TutorialModal
        visible={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
      <PrivacyPolicyModal
        visible={showPrivacy}
        onClose={() => setShowPrivacy(false)}
      />
    </View>
  );
}
