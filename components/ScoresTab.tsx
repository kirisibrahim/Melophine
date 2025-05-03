import { useState, useEffect, useRef } from "react";
import { View, Text, Animated, Dimensions, Alert, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Progress from "react-native-progress";
import { LinearGradient } from "expo-linear-gradient";
import { ColorValue } from "react-native";

const ScoresTab = () => {
    const { width } = Dimensions.get("window");
    const [totals, setTotals] = useState({ score: 0, correctCount: 0, wrongCount: 0 });
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const fetchTotals = async () => {
            try {
                const storedTotals = await AsyncStorage.getItem("quizTotals");
                if (storedTotals) {
                    setTotals(JSON.parse(storedTotals));
                }
            } catch (error) {
                console.error("Skorları çekme hatası:", error);
            }
        };

        fetchTotals();

        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    }, []);

    const successRate = (
        totals.correctCount + totals.wrongCount > 0
            ? totals.correctCount / (totals.correctCount + totals.wrongCount)
            : 0
    );

    const clearQuizTotals = async (setTotals: Function) => {
        try {
            await AsyncStorage.removeItem("quizTotals"); // Depolanan veriyi temizle
            setTotals({ score: 0, correctCount: 0, wrongCount: 0 }); // Ekrandaki bilgileri sıfırla
        } catch (error) {
            console.error("Verileri sıfırlama hatası:", error);
        }
    };

    const confirmResetQuiz = (setTotals: Function) => {
        Alert.alert(
            "Verileri Sıfırla",
            "Tüm quiz istatistiklerini sıfırlamak istediğinizden emin misiniz?",
            [
                { text: "İptal", style: "cancel" },
                { text: "Evet", onPress: () => clearQuizTotals(setTotals) },
            ]
        );
    };

    return (
        <View className="flex-1 items-center justify-center">
            {[
                { title: "Toplam Doğru", value: totals.correctCount, gradient: ["#9868CFFF", "#593286FF"], textColor: "#000000FF" },
                { title: "Toplam Yanlış", value: totals.wrongCount, gradient: ["#F1504EFF", "#A3182AFF"], textColor: "#FFFF00" },
                { title: "Toplam Skor", value: totals.score, gradient: ["#AD7326FF", "#E0D85CFF"], textColor: "#C00505FF" },
            ].map(({ title, value, gradient, textColor }, index) => (

                <Animated.View
                    key={index}
                    style={{
                        width: width * 0.9,
                        marginBottom: width * 0.03,
                        opacity: fadeAnim,
                        transform: [{ scale: fadeAnim }],
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.4,
                        shadowRadius: 6,
                        elevation: 8,
                    }}
                >
                    <LinearGradient colors={gradient as [ColorValue, ColorValue]} start={{ x: 0.3, y: 0 }} end={{ x: 0.8, y: 1 }} style={{
                        padding: width * 0.03, borderRadius: width * 0.07, width: "100%", alignItems: "center"
                    }}>
                        <Text className="text-white font-bold text-2xl">{title}</Text>
                        <Text className="font-extrabold text-5xl" style={{ color: textColor }}>{value}</Text>
                    </LinearGradient>
                </Animated.View>
            ))}
            <Animated.View
                style={{
                    width: width * 0.9,
                    marginBottom: width * 0.15,
                    opacity: fadeAnim,
                    transform: [{ scale: fadeAnim }],
                    shadowColor: "#00FF00",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.5,
                    shadowRadius: 6,
                    elevation: 8,
                }}
            >
                <LinearGradient colors={["#0F2027", "#203A43"] as [ColorValue, ColorValue]} style={{
                    padding: width * 0.03, borderRadius: width * 0.08, width: "100%", alignItems: "center"
                }}>
                    <Text className="text-white font-bold text-2xl">Başarı Oranı</Text>
                    <Progress.Circle
                        progress={successRate}
                        color="#00FF00"
                        size={width * 0.3}
                        thickness={width * 0.03}
                        showsText
                        formatText={(value) => (
                            <Text className="text-3xl font-bold text-[#00FF00]">{Math.round(value * 100)}%</Text>
                        )}
                    />
                </LinearGradient>
            </Animated.View>
            <Animated.View style={{opacity: fadeAnim,transform: [{ scale: fadeAnim }]}} className="mb-6">
                <TouchableOpacity onPress={() => confirmResetQuiz(setTotals)}
                    style={{
                        backgroundColor: "red",
                        paddingVertical: width*0.05,
                        paddingHorizontal: width*0.1,
                        borderRadius: width * 0.05,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4.65,
                        elevation: 8,
                    }}
                >
                    <Text className="text-white text-xl font-bold">Verileri Sıfırla</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

export default ScoresTab;