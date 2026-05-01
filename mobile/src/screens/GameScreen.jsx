import React, { useEffect, useRef, useCallback } from "react";
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGameStore } from "@/utils/game/store";
import { TimerBar } from "@/components/game/TimerBar";
import { AnomalyCanvas } from "@/components/game/AnomalyCanvas";
import { LoseModal } from "@/components/modals/LoseModal";
import WordGrid from "@/components/game/WordGrid";

export function GameScreen({ onNavigate }) {
  const insets = useSafeAreaInsets();
  const gameState = useGameStore();
  const timerRef = useRef(null);

  useEffect(() => {
    if (gameState.isPlaying) {
      timerRef.current = setInterval(() => {
        gameState.tickTimer(50); // ~20fps for smoother performance
      }, 50);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState.isPlaying]);

  const renderHearts = () => {
    if (gameState.mode !== "SURVIVAL") return null;
    const filled = "♥".repeat(gameState.lives);
    const empty = "♡".repeat(Math.max(0, gameState.maxLives - gameState.lives));
    return (
      <Text style={{ color: "#666", fontSize: 12 }}>
        {filled}
        {empty}
      </Text>
    );
  };

  // Stable wrapper ensures a plain JS function is passed through runOnJS
  const handleCellPress = useCallback(
    (index) => {
      try {
        gameState.handleTap(index);
      } catch (e) {
        console.error("handleTap error", e);
      }
    },
    [gameState],
  );

  const isWordLevel =
    gameState.currentLevel?.levelType === "WORD" || gameState.mode === "WORDS";

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top + 20,
        paddingBottom: insets.bottom + 20,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          marginBottom: 20,
        }}
      >
        <Text style={{ color: "#666", fontSize: 12 }}>
          MODE: {gameState.mode}
        </Text>
        {renderHearts()}
      </View>

      {/* Timer */}
      <TimerBar
        progress={
          gameState.maxTimer > 0 ? gameState.timer / gameState.maxTimer : 0
        }
      />

      {/* Game Area */}
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        {isWordLevel ? (
          <WordGrid
            level={gameState.currentLevel}
            onCellPress={handleCellPress}
          />
        ) : (
          <AnomalyCanvas
            level={gameState.currentLevel}
            onCellPress={handleCellPress}
          />
        )}
      </View>

      {/* Score */}
      <Text
        style={{
          textAlign: "center",
          fontSize: 18,
          fontWeight: "bold",
          color: "#000",
          marginBottom: 20,
        }}
      >
        SCORE {gameState.score}
      </Text>

      {/* Lose Modal - only show when game is over AND not showing feedback */}
      {gameState.isGameOver && !gameState.isShowingFeedback && (
        <LoseModal
          visible={gameState.isGameOver && !gameState.isShowingFeedback}
          score={gameState.score}
          bestScore={gameState.bestScore}
          mode={gameState.mode}
          onPlayAgain={() => {
            gameState.resetForMode(gameState.mode);
          }}
          onHome={() => onNavigate("home")}
        />
      )}
    </View>
  );
}
