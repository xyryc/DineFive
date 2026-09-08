import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEventListener } from "expo";
import * as SplashScreen from "expo-splash-screen";

interface AnimatedSplashScreenProps {
  /** Called when the video playback and fade-out transition have finished */
  onAnimationFinish: () => void;
  /** True when fonts and core auth state have loaded */
  isAppReady: boolean;
}

export function AnimatedSplashScreen({
  onAnimationFinish,
  isAppReady,
}: AnimatedSplashScreenProps) {
  const [playbackEnded, setPlaybackEnded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const finishTriggered = useRef(false);

  // Initialize the video player with splash.mp4 (9109.mp4)
  const player = useVideoPlayer(
    require("@/assets/videos/splash.mp4"),
    (p) => {
      p.loop = false;
      p.muted = true;
      p.volume = 0;
      p.audioMixingMode = "mixWithOthers";
      p.play();
    },
  );

  // Hide the native OS splash as soon as the in-app player mounts
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // Video plays FULL (6.00s). Trigger playback ended on native event
  useEventListener(player, "playToEnd", () => {
    setPlaybackEnded(true);
  });

  useEventListener(player, "statusChange", ({ status }) => {
    if (status === "error") {
      setPlaybackEnded(true);
    }
  });

  // Fallback timer at 6.1s (video length is exactly 6.00s) so it never hangs
  useEffect(() => {
    const timer = setTimeout(() => {
      setPlaybackEnded(true);
    }, 6100);

    return () => clearTimeout(timer);
  }, []);

  // Once full playback completes and the app is ready, smoothly cross-fade into the screen
  useEffect(() => {
    if (playbackEnded && isAppReady && !finishTriggered.current) {
      finishTriggered.current = true;
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onAnimationFinish();
      });
    }
  }, [playbackEnded, isAppReady, onAnimationFinish, fadeAnim]);

  // Hard safety timeout at 6.8s so the user is never blocked under any circumstances
  useEffect(() => {
    const hardTimeout = setTimeout(() => {
      if (!finishTriggered.current) {
        finishTriggered.current = true;
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          onAnimationFinish();
        });
      }
    }, 6800);

    return () => clearTimeout(hardTimeout);
  }, [fadeAnim, onAnimationFinish]);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.container,
        { opacity: fadeAnim },
      ]}
      pointerEvents={playbackEnded ? "none" : "auto"}
    >
      {/* Background holding card: pure white with centered DineFive branding.
          This ensures that when the video finishes its full 6-second stream,
          the screen stays pure white and NEVER exposes native player black shutter. */}
      <View style={[StyleSheet.absoluteFill, styles.centerContainer]}>
        <Image
          source={require("@/assets/images/icon.png")}
          style={styles.holdingLogo}
          resizeMode="contain"
        />
      </View>

      {/* Full-length 6.0-second video playback.
          Hides on playbackEnded to prevent the native decoder from showing a black surface. */}
      {!playbackEnded && (
        <VideoView
          player={player}
          style={[StyleSheet.absoluteFill, styles.video]}
          contentFit="contain"
          nativeControls={false}
          surfaceType="textureView"
          showsTimecodes={false}
          requiresLinearPlayback={true}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    zIndex: 99999,
  },
  centerContainer: {
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  holdingLogo: {
    width: 220,
    height: 220,
  },
  video: {
    backgroundColor: "#ffffff",
  },
});
