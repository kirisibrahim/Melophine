import React, { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, Easing, Dimensions } from "react-native";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { createQuizQuestion, QuizQuestion } from "../utils/createQuizQuestion";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
type Phase = "preparation" | "question" | "result";

const QuizScreen = () => {
  const isFocused = useIsFocused();
  const [phase, setPhase] = useState<Phase>("preparation");
  const [preparationCountdown, setPreparationCountdown] = useState(3);
  const [questionTimer, setQuestionTimer] = useState(10);
  const { width } = Dimensions.get('window');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [userAnswered, setUserAnswered] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const audioRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const soundStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const iconScale = useRef(new Animated.Value(1)).current;
  const answerSubmittedRef = useRef(false);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconScale, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(iconScale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);


  const rotation = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [rotation]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Ekran odağından çıkınca tüm ses ve zamanlayıcıları temizle
  useEffect(() => {
    if (!isFocused) {
      if (audioRef.current) {
        audioRef.current.stopAsync();
        audioRef.current.unloadAsync();
        audioRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (soundStopTimeoutRef.current) {
        clearTimeout(soundStopTimeoutRef.current);
        soundStopTimeoutRef.current = null;
      }
    }
  }, [isFocused]);

  // Bileşen unmount olurken de cleanup yap
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.stopAsync();
        audioRef.current.unloadAsync();
        audioRef.current = null;
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (soundStopTimeoutRef.current) clearTimeout(soundStopTimeoutRef.current);
    };
  }, []);

  // geri sayım
  useEffect(() => {
    if (phase === "preparation") {
      const prepInterval = setInterval(() => {
        setPreparationCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(prepInterval);
            startQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(prepInterval);
    }
  }, [phase]);

  // tamamlanınca kaydett
  useEffect(() => {
    if (phase === "result") {
      saveQuizResult();
    }
  }, [phase]);

  // quizi başlat 5 soru oluştur
  const startQuiz = async () => {
    const questions: QuizQuestion[] = [];
    for (let i = 0; i < 5; i++) {
      const q = await createQuizQuestion();
      if (q) questions.push(q);
    }
    console.log("Oluşturulan soru sayısı:", questions.length);
    if (questions.length < 5) {
      console.warn("Yeterli soru oluşturulamadı.");
    }
    setQuizQuestions(questions);
    setPhase("question");
    setCurrentQuestionIndex(0);
    // useEffect ile currentQuestionIndex değişince yeni ses oynatılacak.
  };

  // currentQuestionIndex değiştiğinde yeni soruyu çalmayı tetikleyen useEffect
  useEffect(() => {
    if (phase === "question" && quizQuestions.length > 0) {
      // Önce mevcut sesi ve zamanlayıcıları temizleyelim
      if (audioRef.current) {
        audioRef.current.stopAsync();
        audioRef.current.unloadAsync();
        audioRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (soundStopTimeoutRef.current) {
        clearTimeout(soundStopTimeoutRef.current);
        soundStopTimeoutRef.current = null;
      }
      // yeni  soru 
      const currentQuestion = quizQuestions[currentQuestionIndex];
      if (currentQuestion) {
        playCurrentQuestion(currentQuestion.previewUrl);
        startQuestionTimer();
      }
    }
  }, [currentQuestionIndex, phase, quizQuestions]);

  //5 sn sonra oto timeout
  const playCurrentQuestion = async (previewUrl: string) => {
    try {
      if (audioRef.current) {
        await audioRef.current.unloadAsync();
        audioRef.current = null;
      }
      if (soundStopTimeoutRef.current) {
        clearTimeout(soundStopTimeoutRef.current);
        soundStopTimeoutRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync({ uri: previewUrl });
      audioRef.current = sound;
      await sound.playAsync();
      soundStopTimeoutRef.current = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.stopAsync();
        }
      }, 5000);
    } catch (error) {
      console.error("Ses oynatma hatası:", error);
    }
  };

  // 5 sn çal 5 sn bekle toplan 10 sn süre
  const startQuestionTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setQuestionTimer(10);
    timerRef.current = setInterval(() => {
      setQuestionTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          if (!userAnswered) {
            handleAnswer(null);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Cevap işlemi
  const handleAnswer = (selectedAnswer: string | null) => {
    // cevap işlendiyse iki kere çağrılmasını engelle
    if (answerSubmittedRef.current) return;
    answerSubmittedRef.current = true; //kilit işlemi
    setUserAnswered(true);
  
    // zamanlayıcı/timeout temizliği
    if (soundStopTimeoutRef.current) {
      clearTimeout(soundStopTimeoutRef.current);
      soundStopTimeoutRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.stopAsync();
      audioRef.current.unloadAsync();
      audioRef.current = null;
    }
  
    const currentQuestion = quizQuestions[currentQuestionIndex];
    if (!currentQuestion) {
      console.warn("Hata: Geçerli soru undefined.");
      nextQuestion(); 
      return;
    }
  
    if (selectedAnswer === currentQuestion.correctAnswer) {
      setScore((prev) => prev + 3);
      setCorrectCount((prev) => prev + 1);
      setFeedback("correct");
    } else {
      setScore((prev) => prev - 1);
      setWrongCount((prev) => prev + 1);
      setFeedback("wrong");
    }
  
    // sonraki soruda gecikme veridk
    setTimeout(() => {
      nextQuestion();
    }, 1000);
  };
  

  // sıradaki soru currentQuestionIndex güncelle
  const nextQuestion = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (soundStopTimeoutRef.current) {
      clearTimeout(soundStopTimeoutRef.current);
      soundStopTimeoutRef.current = null;
    }
    answerSubmittedRef.current = false;
  
    if (currentQuestionIndex + 1 < quizQuestions.length) {
      setUserAnswered(false);
      setFeedback(null);
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setPhase("result");
    }
  };

  // asyncstore kaydet
  const saveQuizResult = async () => {
    const result = {
      timestamp: Date.now(),
      score,
      correctCount,
      wrongCount,
    };
    try {
      const existingResults = await AsyncStorage.getItem("quizResults");
      const parsedResults = existingResults ? JSON.parse(existingResults) : [];
      parsedResults.push(result);
      await AsyncStorage.setItem("quizResults", JSON.stringify(parsedResults));
      console.log("Quiz sonucu başarıyla kaydedildi.");
    } catch (error) {
      console.error("Quiz sonucu kaydedilemedi:", error);
    }
  };

  // bütün stateleri ve referansları sıfırla tekrar oyna
  const resetQuiz = () => {
    setPhase("preparation");
    setPreparationCountdown(3);
    setCurrentQuestionIndex(0);
    setScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setQuizQuestions([]);
    setUserAnswered(false);
    setFeedback(null);
    if (timerRef.current) clearInterval(timerRef.current);
    if (soundStopTimeoutRef.current) clearTimeout(soundStopTimeoutRef.current);
    if (audioRef.current) {
      audioRef.current.stopAsync();
      audioRef.current.unloadAsync();
      audioRef.current = null;
    }
  };
  // hazır ol ekranı
  if (phase === "preparation") {
    return (
      <View className="bg-[#D9E997] flex-1 justify-center items-center">
      <View className="flex-row items-center mb-4">
      <Animated.View style={{ transform: [{ scale: iconScale }]}}>
          <Ionicons name="timer-outline" size={width*0.1} color="#000000" />
        </Animated.View>
        <Text className="text-3xl font-bold text-black mr-2 ml-2">Hazır Ol</Text>
        <Animated.View style={{ transform: [{ scale: iconScale }]}}>
          <Ionicons name="timer-outline" size={width*0.1} color="#000000" />
        </Animated.View>
      </View>
      <View style={{ width: width * 0.5, height: width * 0.5, position: 'relative' }}>
        {/* Dönen dış daire */}
        <Animated.View
          style={{
            width: width * 0.5,
            height: width * 0.5,
            borderRadius: (width * 0.5) / 2,
            transform: [{ rotate: spin }],
            overflow: 'hidden',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <LinearGradient
            colors={['#004777', '#F7B801', '#A30000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        </Animated.View>
        {/* Sabit kalan, dönen dış daireden bağımsız iç görünüm */}
        <View
          className="bg-[#D9E997] justify-center items-center"
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            width: width * 0.5 - 20,
            height: width * 0.5 - 20,
            borderRadius: (width * 0.5 - 20) / 2,
          }}
        >
          <Text className="text-6xl font-bold text-white">
            {preparationCountdown}
          </Text>
        </View>
      </View>
    </View>

    );
  }
  // quiz ekranı
  if (phase === "question") {
    if (quizQuestions.length === 0) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text>Yükleniyor...</Text>
        </View>
      );
    }
    const currentQuestion = quizQuestions[currentQuestionIndex];
    if (!currentQuestion) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text>Bir hata oluştu. Lütfen tekrar deneyin.</Text>
        </View>
      );
    }
    return (
      <View className="pt-28" style={{ flex: 1, padding: 16 }}>
        <Text style={{ fontSize: 18, marginBottom: 4 }}>
          Soru {currentQuestionIndex + 1}/{quizQuestions.length}
        </Text>
        <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 12 }}>
          {currentQuestion.question}
        </Text>
        <Text style={{ marginBottom: 12 }}>Kalan Süre: {questionTimer} sn</Text>
        {currentQuestion.choices.map((choice, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleAnswer(choice)}
            style={{
              backgroundColor: "#3b82f6",
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>
              {choice}
            </Text>
          </TouchableOpacity>
        ))}
        {feedback && (
          <Text
            style={{
              fontSize: 24,
              textAlign: "center",
              color: feedback === "correct" ? "green" : "red",
            }}
          >
            {feedback === "correct" ? "Doğru!" : "Yanlış!"}
          </Text>
        )}
      </View>
    );
  }
  // sonuç ekranı
  if (phase === "result") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 16 }}>
        <Text style={{ fontSize: 32, fontWeight: "bold", marginBottom: 16 }}>
          Quiz Tamamlandı!
        </Text>
        <Text style={{ fontSize: 20, marginBottom: 8 }}>Doğru Sayısı: {correctCount}</Text>
        <Text style={{ fontSize: 20, marginBottom: 8 }}>Yanlış Sayısı: {wrongCount}</Text>
        <Text style={{ fontSize: 20, marginBottom: 8 }}>Toplam Skor: {score}</Text>
        <TouchableOpacity
          onPress={resetQuiz}
          style={{
            backgroundColor: "green",
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 8,
            marginTop: 16,
          }}
        >
          <Text style={{ color: "white", fontSize: 18 }}>Tekrar Oyna</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return null;
};

export default QuizScreen;