import { Stack, useRouter, usePathname } from "expo-router";
import { TouchableOpacity, Text, View, useWindowDimensions, Animated, } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import SplashScreenComponent from "./SplashScreen";
import { LinearGradient } from "expo-linear-gradient";
import "../global.css";

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const [isLoaded, setIsLoaded] = useState(false);
  const [showBackButton, setShowBackButton] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  const getTitle = () => {
    switch (pathname) {
      case "/search":
        return "Keşif";
      case "/quiz":
        return "Yarış";
      case "/profile":
        return "Profil";
      case "/info":
        return "Hakkında";
      default:
        return "";
    }
  };

  useEffect(() => {
    setShowBackButton(pathname !== "/");
  }, [pathname, forceUpdate]);

  if (!isLoaded) {
    return <SplashScreenComponent onFinish={() => setIsLoaded(true)} />;
  }

  return (
    <View className="flex-1">
      {showBackButton && (
        <View
          style={{
            position: "absolute",
            top: width * 0.12,
            left: 0,
            right: 0,
            zIndex: 50,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {showBackButton && (
            <TouchableOpacity
              onPress={() => {
                router.push("/");
                setForceUpdate((prev) => prev + 1);
              }}
              style={{
                position: "absolute",
                left: width * 0.03,
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#4B5563",
                paddingHorizontal: width * 0.04,
                paddingVertical: width * 0.02,
                borderRadius: 9999,
              }}
            >
              <Ionicons name="arrow-back" size={width * 0.06} color="#fff" />
              <Text
                style={{
                  color: "white",
                  fontSize: width * 0.06,
                  fontWeight: "bold",
                  marginLeft: width * 0.01,
                }}
              >
                Geri
              </Text>
            </TouchableOpacity>
          )}
          <LinearGradient
            colors={["#8FC7E7FF", "#C0A064FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: width * 0.02,
              paddingHorizontal: width * 0.04,
              borderRadius: 9999,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 4.65,
              elevation: 8,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: width * 0.06,
                fontWeight: "bold",
                textAlign: "center",
                letterSpacing: 1,
                textShadowColor: "rgba(0, 0, 0, 0.8)",
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 6,
              }}
            >
              {getTitle()}
            </Text>
          </LinearGradient>
        </View>

      )}
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}