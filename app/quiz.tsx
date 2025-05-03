import React, { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, Easing, Dimensions } from "react-native";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { createQuizQuestion, QuizQuestion } from "../utils/createQuizQuestion";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import ConfettiCannon from "react-native-confetti-cannon";
type Phase = "preparation" | "question" | "result";
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answerSubmittedRef = useRef(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const animatedStroke = useRef(new Animated.Value(1)).current;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const [icon, setIcon] = useState<"volume-high" | "volume-mute">("volume-high");
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null); //seçilen vcevap
  const feedbackAnimation = useRef(new Animated.Value(0)).current;
  const readyTextPosition = useRef(new Animated.Value(- width)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const preparationCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    Animated.timing(resultOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const getScoreColor = (score: number) => {
    return score >= 11 ? "green" : score >= 7 ? "yellow" : "red";
  };

  const getMessage = (score: number) => {
    return score >= 11 ? "Muhteşemsin!" : score >= 7 ? "Gayet iyi!" : "Daha iyi olabilir!";
  };

  useEffect(() => {
    if (feedback) {
      feedbackAnimation.setValue(0);
      Animated.parallel([
        Animated.timing(feedbackAnimation, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(feedbackAnimation, {
          toValue: 1,
          speed: 6, //
          bounciness: 10,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [feedback]);

  useEffect(() => {
    if (phase === "question") {
      setIcon("volume-high");

      const timer = setTimeout(() => {
        setIcon("volume-mute");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [phase, currentQuestionIndex]);

  useEffect(() => {
    if (phase === "question") { // animasyon kaybı yaşamamak için sorun ekranında başlatıyoruz
      const adjustedTimer = 10;
      animatedStroke.setValue(1);
      Animated.timing(animatedStroke, {
        toValue: 0,
        duration: adjustedTimer * 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [phase, currentQuestionIndex]);

  const strokeDashoffset = animatedStroke.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  useEffect(() => {
    // Soruların toplam sayısının sıfır olup olmadığını kontrol et
    if (quizQuestions.length === 0) {
      progressAnim.setValue(0); // Eğer sıfırsasa başlangıçta genişliği sıfır yap
      return;
    }
    const newWidth = ((currentQuestionIndex + 1) / quizQuestions.length) * width;
    Animated.timing(progressAnim, {
      toValue: newWidth,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [currentQuestionIndex, quizQuestions]);

  const startSpinAnimation = () => {
    rotation.setValue(0);
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  useEffect(() => {
    if (phase === "preparation") {
      startSpinAnimation();
    }
  }, [phase]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
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
      if (preparationCountdownRef.current) {
        clearInterval(preparationCountdownRef.current);
        preparationCountdownRef.current = null;
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


  useEffect(() => {
    if (phase === "preparation" && isFocused) {
      if (preparationCountdownRef.current) {
        clearInterval(preparationCountdownRef.current);
      }

      preparationCountdownRef.current = setInterval(() => {
        setPreparationCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(preparationCountdownRef.current!);
            preparationCountdownRef.current = null;

            if (phase === "preparation" && isFocused) {
              startQuiz();
            }

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (preparationCountdownRef.current) {
        clearInterval(preparationCountdownRef.current);
        preparationCountdownRef.current = null;
      }
    };
  }, [phase, isFocused]);


  useEffect(() => {
    if (phase !== "preparation") {
      if (preparationCountdownRef.current) {
        clearInterval(preparationCountdownRef.current);
        preparationCountdownRef.current = null;
      }
    }
  }, [phase]);


  useEffect(() => {
    setTimeout(() => {
      Animated.timing(readyTextPosition, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        Animated.sequence([
          Animated.timing(shakeAnimation, { toValue: 7, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnimation, { toValue: -7, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
      });
    }, 3000);
  }, []);

  // tamamlanınca kaydett
  useEffect(() => {
    if (phase === "result") {
      updateQuizTotals(score, correctCount, wrongCount);
    }
  }, [phase]);

  // quizi başlat 5 soru oluştur
  const startQuiz = async () => {
    const questions: QuizQuestion[] = [];
    for (let i = 0; i < 5; i++) {
      const q = await createQuizQuestion();
      if (q) questions.push(q);
    }
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
    // Cevap işlendiyse iki kere çağrılmasını engelle
    if (answerSubmittedRef.current) return;
    answerSubmittedRef.current = true; // kilit işlemi
    setUserAnswered(true);

    // Zamanlayıcı/timeout temizliği
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
      // Cevap verilmediğinde de (selectedAnswer === null) veya yanlış cevapta
      setScore((prev) => prev - 1);
      setWrongCount((prev) => prev + 1);
      setFeedback("wrong");
    }

    // Sonraki soruya geçişte 1500ms gecikme veriliyor
    setTimeout(() => {
      nextQuestion();
    }, 1500);
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

  const playSound = async (isCorrect: boolean) => {
    const sound = new Audio.Sound();
    try {
      await sound.loadAsync(
        isCorrect
          ? require("../assets/sounds/correct.wav")
          : require("../assets/sounds/wrong.wav")
      );

      // Oynatma tamamlandığında ses kaynağını serbest bırakmak için callback ekliyoruz.
      sound.setOnPlaybackStatusUpdate((status) => {
        if ("didJustFinish" in status && status.didJustFinish) {
          sound.unloadAsync();
        }
      });

      await sound.playAsync(); // Sesi çal!
    } catch (error) {
      console.error("Ses oynatma hatası:", error);
    }
  };


  //**************************************************************************************
  // asyncstore detaylı kaydetme

  // const saveQuizResult = async () => {
  //   const result = {
  //     timestamp: Date.now(),
  //     score,
  //     correctCount,
  //     wrongCount,
  //   };
  //   try {
  //     const existingResults = await AsyncStorage.getItem("quizResults");
  //     const parsedResults = existingResults ? JSON.parse(existingResults) : [];
  //     parsedResults.push(result);
  //     await AsyncStorage.setItem("quizResults", JSON.stringify(parsedResults));
  //     console.log("Quiz sonucu başarıyla kaydedildi.");
  //   } catch (error) {
  //     console.error("Quiz sonucu kaydedilemedi:", error);
  //   }
  // };

  // asyncstore detaylı kaydetme verileri temizleme

  // useEffect(() => {
  //   clearQuizResults(); 
  // }, []);

  // const clearQuizResults = async () => {
  //   try {
  //     await AsyncStorage.removeItem("quizResults"); 
  //     console.log("Tüm quiz sonuçları başarıyla silindi.");
  //   } catch (error) {
  //     console.error("Quiz sonuçları silinemedi:", error);
  //   }
  // };
  // ************************************************************************************

  // asyncstore tek veri kaydetme (daha az alan kapla, özet göster)
  const updateQuizTotals = async (newScore: number, newCorrectCount: number, newWrongCount: number) => {
    try {
      const storedTotals = await AsyncStorage.getItem("quizTotals");
      const totals = storedTotals ? JSON.parse(storedTotals) : { score: 0, correctCount: 0, wrongCount: 0 };

      const updatedTotals = {
        score: totals.score + newScore,
        correctCount: totals.correctCount + newCorrectCount,
        wrongCount: totals.wrongCount + newWrongCount,
      };

      await AsyncStorage.setItem("quizTotals", JSON.stringify(updatedTotals));
    } catch (error) {
      console.error("Toplam skorları güncelleme hatası:", error);
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
    startSpinAnimation();
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
      <View className="bg-[#BE8CCFFF] flex-1 justify-center items-center">
        <Animated.View className="flex-row items-center mb-2" style={{
          transform: [
            { translateY: readyTextPosition },
            { translateX: shakeAnimation },
          ],
        }}>
          <MaterialCommunityIcons name="rocket-launch" size={width * 0.1} color="#61FD5CFF" />
          <Text className="text-3xl font-bold text-white mr-1 ml-1">Hazır Ol</Text>
          <MaterialCommunityIcons name="rocket-launch" size={width * 0.1} color="#61FD5CFF" />
        </Animated.View>
        <View style={{ width: width * 0.7, height: width * 0.7, position: 'relative' }}>
          <Animated.View
            style={{
              width: width * 0.7,
              height: width * 0.7,
              borderRadius: (width * 0.7) / 2,
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
          <View
            className="bg-[#BE8CCFFF] justify-center items-center"
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              width: width * 0.7 - 20,
              height: width * 0.7 - 20,
              borderRadius: (width * 0.7 - 20) / 2,
            }}
          >
            <Text className="text-6xl font-bold text-[#ffffff]">
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
      <View className="flex-1 pt-28 px-3 bg-[#EDF3CCFF]">
        <Text className="text-center text-xl font-bold mb-4">
          Soru {currentQuestionIndex + 1}/{quizQuestions.length}
        </Text>
        <View className="w-full h-3 bg-gray-300 rounded-full overflow-hidden mb-4">
          <Animated.View
            style={{
              width: progressAnim, // Değişken genişlik
              height: '100%',
              backgroundColor: progressAnim.interpolate({
                inputRange: [0, width],
                outputRange: ['#FF0000', '#0000FF'],
              }),
              borderRadius: 9999,
            }}
          />
        </View>
        <Text className="font-bold text-3xl text-center mb-4">
          {currentQuestion.question}
        </Text>
        <View className="flex items-center justify-center mb-4">
          <Svg viewBox="0 0 120 120" style={{ width: width * 0.5, height: width * 0.5 }}>
            {/* Arka plan çemberi */}
            <Circle cx="60" cy="60" r={radius} strokeWidth="10" fill="transparent" />
            <AnimatedCircle
              cx="60"
              cy="60"
              r={radius}
              stroke="#FF0000"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </Svg>
          <View style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Text style={{ fontSize: width * 0.1, fontWeight: "bold", color: "#FFA500" }}>
              {questionTimer}
            </Text>
            <MaterialCommunityIcons name={icon} size={width * 0.1} color="#0000FF" />
          </View>
        </View>
        {currentQuestion.choices.map((choice, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => { handleAnswer(choice); setSelectedChoice(choice); playSound(choice === currentQuestion.correctAnswer); }}
            disabled={feedback !== null}
            style={{
              backgroundColor: feedback
                ? selectedChoice === choice
                  ? choice === currentQuestion.correctAnswer
                    ? "green"
                    : "red"
                  : "#32064C"
                : "#32064C",
              paddingVertical: width * 0.05,
              paddingHorizontal: width * 0.05,
              borderRadius: width * 0.1,
              marginBottom: width * 0.04,
            }}
          >
            <Text className="text-[#EDF3CCFF] font-bold text-center">
              {choice}
            </Text>
          </TouchableOpacity>
        ))}
        {feedback && (
          <Animated.View
            style={{
              opacity: feedbackAnimation,
              transform: [
                { scale: feedbackAnimation },
                { translateY: feedbackAnimation.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
              ],
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialCommunityIcons
              name={feedback === "correct" ? "check-circle" : "close-circle"}
              size={width * 0.25}
              color={feedback === "correct" ? "green" : "red"}
            />
          </Animated.View>
        )}
      </View>
    );
  }
  // sonuç ekranı
  if (phase === "result") {
    return (
      <LinearGradient colors={["#004777", "#A30000"]} style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ConfettiCannon
          count={200}
          origin={{ x: width / 2, y: 0 }}
          autoStart={true}
          fadeOut={true}
        />
        <Animated.Text className="font-bold text-4xl mb-6 text-white" style={{ opacity: resultOpacity }}>
          Quiz Tamamlandı!
        </Animated.Text>
        <Text className="text-5xl mb-6" style={{ color: getScoreColor(score) }}>
          {getMessage(score)}
        </Text>
        <Text className="text-3xl mb-4 text-white" >Doğru Sayısı: {correctCount}</Text>
        <Text className="text-3xl mb-6 text-white" >Yanlış Sayısı: {wrongCount}</Text>
        <Text className="text-5xl" style={{ color: getScoreColor(score) }}>Toplam Skor: {score}</Text>
        <TouchableOpacity
          onPress={resetQuiz}
          style={{
            backgroundColor: "orange",
            paddingVertical: 10,
            paddingHorizontal: 10,
            borderRadius: width * 0.05,
            marginTop: width * 0.2,
          }}
        >
          <Text className="text-white text-3xl">Tekrar Oyna</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }
  return null;
};

export default QuizScreen;