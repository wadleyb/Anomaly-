import React, { useEffect, useRef, useState } from "react";
import { View, AppState } from "react-native";
import { StatusBar } from "expo-status-bar";
import { HomeScreen } from "@/screens/HomeScreen";
import { ModeSelectScreen } from "@/screens/ModeSelectScreen";
import { GameScreen } from "@/screens/GameScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";
import { JourneyScreen } from "@/screens/JourneyScreen";
import { DailyScreen } from "@/screens/DailyScreen";
import { useSoundStore } from "@/utils/game/soundStore";
import { useJourneyStore } from "@/utils/game/journeyStore";
import { initMusic, playMusic, pauseMusic } from "@/utils/audio/musicManager";

export default function Index() {
  return <AnomalyGame />;
}

function AnomalyGame() {
  const [currentScreen, setCurrentScreen] = useState("home"); // 'home' | 'journey' | 'daily' | 'modes' | 'game' | 'settings'
  const musicOn = useSoundStore((s) => s.musicOn);
  const hasInitializedRef = useRef(false);
  const hydrate = useJourneyStore((s) => s.hydrate);
  const hydrated = useJourneyStore((s) => s.hydrated);

  // Hydrate persistent journey/daily state on mount
  useEffect(() => { if (!hydrated) hydrate(); }, [hydrated]);

  // Initialize music once, and start when entering Home if enabled
  useEffect(() => {
    (async () => {
      if (!hasInitializedRef.current) {
        await initMusic();
        hasInitializedRef.current = true;
      }
      if (currentScreen === "home" && musicOn) {
        await playMusic();
      }
    })();
  }, [currentScreen, musicOn]);

  // AppState: pause on background, resume on active (if musicOn)
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") {
        pauseMusic();
      } else if (state === "active" && musicOn) {
        playMusic();
      }
    });
    return () => {
      try {
        sub.remove();
      } catch {}
    };
  }, [musicOn]);

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F3EE" }}>
      <StatusBar style="dark" />
      {currentScreen === "home" && <HomeScreen onNavigate={setCurrentScreen} />}
      {currentScreen === "journey" && (
        <JourneyScreen onNavigate={setCurrentScreen} />
      )}
      {currentScreen === "daily" && (
        <DailyScreen onNavigate={setCurrentScreen} />
      )}
      {currentScreen === "modes" && (
        <ModeSelectScreen onNavigate={setCurrentScreen} />
      )}
      {currentScreen === "game" && <GameScreen onNavigate={setCurrentScreen} />}
      {currentScreen === "settings" && (
        <SettingsScreen onNavigate={setCurrentScreen} />
      )}
    </View>
  );
}
