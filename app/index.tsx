import { useRouter, useFocusEffect } from "expo-router";
import { View, Text, TouchableOpacity, ImageBackground, Animated, Easing } from "react-native";
import { useEffect, useState } from "react";
import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useWindowDimensions } from "react-native";
import LottieView from "lottie-react-native";

const HomeScreen = () => {
  const router = useRouter();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [translateYAnim] = useState(new Animated.Value(-200));
  const { width } = useWindowDimensions();

  useFocusEffect(
    React.useCallback(() => {
      fadeAnim.setValue(0.8);
      translateYAnim.setValue(-200);

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(translateYAnim, {
            toValue: 0,
            duration: 800,
            easing: Easing.out(Easing.exp),
            useNativeDriver: true,
          }),
        ]).start();
      }, -500);
    }, [])
  );

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <ImageBackground
        source={require("../assets/images/musicbg.jpg")}
        className="flex-1 items-center justify-center px-4"
        resizeMode="cover"
      >
        <TouchableOpacity
          className="bg-[#FF6600]/80 absolute top-20 right-2 rounded-full shadow-lg flex-row items-center justify-center"
          onPress={() => router.push("/profile")}
        >
          <LottieView
            source={require("../assets/lottie/profile.json")}
            autoPlay
            loop
            style={{ width: width * 0.18, height: width * 0.18 }}
          />
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-[#FF0000]/80 absolute top-20 left-2 rounded-full shadow-lg flex-row items-center justify-center"
          onPress={() => router.push("/info")}
        >
          <LottieView
            source={require("../assets/lottie/question.json")}
            autoPlay
            loop
            style={{ width: width * 0.18, height: width * 0.18 }}
          />
        </TouchableOpacity>
        <Animated.View style={{ transform: [{ translateY: translateYAnim }] }}>
          <LottieView
            source={require("../assets/lottie/astronaut2.json")}
            autoPlay
            loop
            style={{ width: width * 0.7, height: width * 0.7 }}
          />
        </Animated.View>
        <Animated.View style={{ transform: [{ translateY: translateYAnim }] }}>
          <TouchableOpacity
            className="bg-[#DC143C]/80 px-6 py-4 rounded-lg shadow-lg flex-row items-center justify-center mb-4"
            onPress={() => router.push("/search")}
          >
            <MaterialCommunityIcons name="music-box-multiple-outline" size={width * 0.1} color="white" />
            <Text className="text-white text-2xl font-bold ml-2">Keşfet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-[#FFBF00]/80 px-6 py-4 rounded-lg shadow-lg flex-row items-center justify-center"
            onPress={() => router.push("/quiz")}
          >
            <MaterialCommunityIcons name="ear-hearing" size={width * 0.1} color="white" />
            <Text className="text-white text-2xl font-bold ml-2">Quiz</Text>
          </TouchableOpacity>
        </Animated.View>
      </ImageBackground>
    </Animated.View>
  );
};

export default HomeScreen;