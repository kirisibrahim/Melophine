import { useEffect, useState } from "react";
import { View, Text, Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";
import { Ionicons } from "@expo/vector-icons"
import { useWindowDimensions } from "react-native";

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreenComponent: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useState(new Animated.Value(1))[0]; // geçiş opaklığı
  const scaleAnim = useState(new Animated.Value(1))[0]; // text animasyon
  const { width} = useWindowDimensions();
  const gradientColors: readonly [string, string, ...string[]] = [
    "#fbc050", "#fb8c4a", "#eb4d63", "#6f43b4",
  ];
  useEffect(() => {
    SplashScreen.preventAutoHideAsync();
    //Text animasyon
    const loopingAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.1, duration: 300, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1.2, duration: 350, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1.15, duration: 250, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ])
    );
    loopingAnim.start();
    setTimeout(() => {
      // sayfa geçişi
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        SplashScreen.hideAsync();
        onFinish();
      });
    }, 3000); // açılış ekranı süresi
  }, [onFinish]);

  return (
    <Animated.View
      style={{ flex: 1, opacity: fadeAnim }}
      className="items-center justify-center"
    >
      <LinearGradient
        colors={gradientColors}
        style={{ position: "absolute", width: "100%", height: "100%" }}
      />
      <Animated.View
        style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
        className="flex items-center"
      >
        <Ionicons name="heart-circle" size={width * 0.3} color="red" />
        <Text className="text-white text-5xl font-extrabold tracking-wide shadow-2xl shadow-black mt-2 mb-2">
          Hoş Geldin!
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

export default SplashScreenComponent;