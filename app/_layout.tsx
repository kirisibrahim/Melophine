import { Stack, useRouter, usePathname } from "expo-router";
import { TouchableOpacity, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import SplashScreenComponent from "./SplashScreen"; // 🔥 SplashScreen bileşenini dışarı taşıdık!
import "../global.css";

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const [isLoaded, setIsLoaded] = useState(false);

  const getTitle = () => {
    switch (pathname) {
      case "/search":
        return "Keşif";
      case "/quiz":
        return "Yarış";
      case "/profile":
        return "Profil";
      default:
        return "";
    }
  };

  if (!isLoaded) {
    return <SplashScreenComponent onFinish={() => setIsLoaded(true)} />; // 🔥 Açılış animasyonu çalıştırılıyor!
  }

  return (
    <View className="flex-1">
      {pathname !== "/" && (
        <>
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-12 left-2 bg-gray-700 px-4 py-2 rounded-full flex-row items-center z-50"
          >
            <Ionicons name="arrow-back" size={width * 0.07} color="white" />
            <Text className="text-white text-lg font-bold">Geri</Text>
          </TouchableOpacity>
          <View className="absolute top-12 z-50 left-1/2 -translate-x-1/2">
            <Text className="text-white text-4xl font-bold tracking-wide shadow shadow-yellow-800">
              {getTitle()}
            </Text>
          </View>
        </>
      )}
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}