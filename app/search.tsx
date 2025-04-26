import { useState, useEffect, useRef, useCallback } from "react";
import {
  Keyboard, KeyboardAvoidingView, View, TextInput, Pressable,
  FlatList, Text, Image, Platform, ActivityIndicator, TouchableOpacity, useWindowDimensions, Animated,
  Easing
} from "react-native";
import { fetchDeezerMusicData, MusicData } from "../utils/fetchMusicData";
import { getRandomTurkishSong } from "../utils/getRandomSong";
import { Audio } from "expo-av";
import * as Animatable from "react-native-animatable";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Toast, { BaseToast, ToastConfigParams } from "react-native-toast-message";
import { useFocusEffect } from "@react-navigation/native";
import LottieView from "lottie-react-native";

const SearchScreen = () => {
  const { width, height } = useWindowDimensions();
  const [searchTerm, setSearchTerm] = useState("");
  const [songs, setSongs] = useState<MusicData[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [turkishSong, setTurkishSong] = useState<MusicData | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [hasMoreData, setHasMoreData] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const currentTrackData: MusicData | null = songs.find((s) => s.previewUrl === currentTrack) || null;
  const [showAnim, setShowAnim] = useState(true); // Rastegele şarkı öncesi zar animasyonu state
  const [animKey, setAnimKey] = useState(Date.now()); // her ekrana focuslandığında lottieyi tekrar oynatabilmek için key
  const lottieRef = useRef<any>(null); // animasyon iin key
  const [lottieMounted, setLottieMounted] = useState(false); // animasyon mountu etmek için onlaoyut callback
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -10, // Yukarı çıkma
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0, // Aşağı dönme
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim.x, {
        toValue: 360, // 🔄 Sürekli 360 derece dönme
        duration: 2000, // Daha uzun süre = daha akıcı geçiş
        easing: Easing.linear, // 🚀 Doğrudan çizgisel dönüş
        useNativeDriver: true,
      })
    ).start();

  }, []);
  // Ekran focus olduğunda animasyonu yeniden mount etmek için
  useFocusEffect(
    useCallback(() => {
      setShowAnim(false);
      const timer = setTimeout(() => {
        setAnimKey(Date.now());
        setShowAnim(true);
      }, 150);
      return () => clearTimeout(timer);
    }, [])
  );
  // LottieView mount edildiyse  reset/play çağrısını
  useEffect(() => {
    if (showAnim && lottieMounted && lottieRef.current) {
      (lottieRef.current as any).reset();
      (lottieRef.current as any).play();
    }
  }, [lottieMounted, showAnim, animKey]);

  useFocusEffect(
    useCallback(() => {
      const stopMusic = async () => {
        if (sound && isPlaying) {
          await sound.pauseAsync(); // anasayfaya döersek çalmayı durdur.
          setIsPlaying(false);
        }
      };

      return () => {
        stopMusic(); // Sayfa odağı kaybolduğunda müziği durdur
      };
    }, [sound, isPlaying])
  );

  const fetchMoreSongs = async () => {
    if (loading || !hasMoreData) return;

    setLoading(true);
    const newSongs = await fetchDeezerMusicData(searchTerm, page);

    if (newSongs.length > 0) {
      const uniqueSongs = Array.from(new Set([...songs, ...newSongs])); // aynı şarkıları tekrar eklemesini engelledik.
      setSongs(uniqueSongs);
      setPage(page + 1);
    } else {
      setHasMoreData(false); // yüklemeyi durduk tekrar istek atmayalım
    }

    setLoading(false);
  };

  // toast stilleri
  const toastConfig = {
    error: ({ text1, text2 }: ToastConfigParams<any>) => (
      <BaseToast
        style={{ borderLeftColor: "red", backgroundColor: "#1E1E1E" }}
        text1Style={{ fontSize: 16, fontWeight: "bold", color: "#FFD700" }}
        text2Style={{ fontSize: 14, color: "#FFF" }}
        text1={text1 ?? "Hata oluştu"}
        text2={text2 ?? ""}
      />
    ),

    success: ({ text1, text2 }: ToastConfigParams<any>) => (
      <BaseToast
        style={{ borderLeftColor: "green", backgroundColor: "#0F4F1F" }}
        text1Style={{ fontSize: 16, fontWeight: "bold", color: "#A4FF78" }}
        text2Style={{ fontSize: 14, color: "#FFF" }}
        text1={text1 ?? "Başarılı"}
        text2={text2 ?? ""}
      />
    ),

    info: ({ text1, text2 }: ToastConfigParams<any>) => (
      <BaseToast
        style={{ borderLeftColor: "blue", backgroundColor: "#0E315A" }}
        text1Style={{ fontSize: 16, fontWeight: "bold", color: "#63B2FF" }}
        text2Style={{ fontSize: 14, color: "#FFF" }}
        text1={text1 ?? "Bilgilendirme"}
        text2={text2 ?? ""}
      />
    ),
  };

  useEffect(() => {
    getRandomTurkishSong().then(setTurkishSong);
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      Toast.show({
        type: "error",
        text1: "Eksik Bilgi",
        text2: "Lütfen bir arama terimi giriniz!",
        position: "top",
        topOffset: 90,
        visibilityTime: 3000,
      });
      return;
    }

    Keyboard.dismiss();
    try {
      const results = await fetchDeezerMusicData(searchTerm, 0); // Yeni aramada sayfa sıfırlanıyor

      if (results.length === 0) {
        Toast.show({
          type: "info",
          text1: "Sonuç Bulunamadı!",
          text2: "Aramanıza uygun bir şarkı bulunamadı!",
          position: "top",
          topOffset: 90,
          visibilityTime: 3000,
        });
      } else {
        setSongs(results);
        setPage(0);
        setHasMoreData(true);

        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true }); //Arama sonrası en üste kaydır
        }, 300);
      }
    } catch (error) {
      console.error("API hatası:", error);
      Toast.show({
        type: "error",
        text1: "Bağlantı Hatası",
        text2: "Müzik getirilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin!",
        position: "top",
        topOffset: 90,
        visibilityTime: 3000,
      });
    }
  };

  const playPreview = async (previewUrl?: string) => {
    if (!previewUrl) return;

    try {
      // Aynı şarkıda toggle yapıyoruz
      if (sound && currentTrack === previewUrl) {
        const status = await sound.getStatusAsync();
        if ("isLoaded" in status && status.isLoaded) {
          if (status.isPlaying) {
            // Duraklattık ama currentTrack sıfırlanmadı
            await sound.pauseAsync();
            setIsPlaying(false);
          } else {
            await sound.playAsync();
            setIsPlaying(true);
            // currentTrack zaten mevcut
          }
        }
        return;
      }

      // Eğer farklı bir şarkıya geçiliyorsa:
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
        // currentTrack sıfırlamıyoruz
      }

      const { sound: newSound } = await Audio.Sound.createAsync({ uri: previewUrl });
      setSound(newSound);
      setCurrentTrack(previewUrl);
      setIsPlaying(true);
      await newSound.playAsync();

      // Şarkı tamamlandığında otomatik sıradaki şarkıya geçiş
      newSound.setOnPlaybackStatusUpdate(async (status) => {
        if ("didJustFinish" in status && status.didJustFinish) {
          const currentIndex = songs.findIndex((s) => s.previewUrl === previewUrl);
          if (currentIndex !== -1 && currentIndex < songs.length - 1) {
            // önceki sesi temizleyelim
            await newSound.unloadAsync();
            setSound(null);
            // Sonraki şarkıyı oynat
            await playPreview(songs[currentIndex + 1].previewUrl);
          } else {
            setIsPlaying(false);
            // Burada currentTrack sıfırlamıyoruz mini player son şarkıyı gösterip, oynat butonuyla devam ettirilebilsin.
            await newSound.unloadAsync();
            setSound(null);
          }
        }
      });
    } catch (error) {
      console.error("Ses oynatma hatası:", error);
    }
  };

  const handleNext = () => {
    const currentIndex = songs.findIndex((s) => s.previewUrl === currentTrack);
    if (currentIndex !== -1 && currentIndex < songs.length - 1) {
      playPreview(songs[currentIndex + 1].previewUrl);
    }
  };

  const handlePrevious = () => {
    const currentIndex = songs.findIndex((s) => s.previewUrl === currentTrack);
    if (currentIndex > 0) {
      playPreview(songs[currentIndex - 1].previewUrl);
    }
  };

  const handlePlayPause = async () => {
    if (!currentTrack) return;
    await playPreview(currentTrack);
  };
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-gray-900 px-3 pt-28 md:px-8 lg:px-16">
      <View className="items-center">
        <View className="w-full flex-row items-center bg-gray-800 bg-opacity-80 rounded-full px-2 py-2 shadow-md border border-yellow-400">
          <TextInput
            className="flex-1 text-white px-2"
            placeholder="Bir arama terimi girin..."
            placeholderTextColor="#D9E997"
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity
            className="bg-yellow-400 p-2 rounded-full shadow-xl"
            activeOpacity={0.3}
            onPress={handleSearch}
          >
            <Ionicons name="search" size={width * 0.06} color="#121212" />
          </TouchableOpacity>
        </View>
      </View>
      {turkishSong && (
        <View className="items-center">
          {showAnim ? (
            <LottieView
              ref={lottieRef}
              key={animKey}
              source={require("../assets/lottie/dice.json")}
              autoPlay={false} // Manuel kontrol için autoPlay kapalı.
              loop={false}
              onAnimationFinish={() => setShowAnim(false)}
              onLayout={() => {
                setLottieMounted(true);
              }}
              style={{ width: width * 0.22, height: width * 0.22 }}
            />
          ) : (
            <View className="relative p-2 rounded-lg mt-4 flex-row items-center space-x-4 shadow-lg overflow-hidden">
              <Animatable.View
                animation={{
                  0: { backgroundColor: "#EDD8A7" },
                  0.25: { backgroundColor: "#E4C57D" },
                  0.5: { backgroundColor: "#DBB353" },
                  0.75: { backgroundColor: "#E4C57D" },
                  1: { backgroundColor: "#EDD8A7" },
                }}
                duration={2000}
                iterationCount="infinite"
                easing="ease-in-out"
                className="absolute inset-0 rounded-lg"
              />
              <Image source={{ uri: turkishSong.artworkUrl100 }} className="rounded-lg" style={{ width: width * 0.15, height: width * 0.15 }} />
              <View className="flex-1 ml-2">
                <Text className="text-black text-lg font-bold">{turkishSong.trackName}</Text>
                <Text className="text-red-600">{turkishSong.artistName}</Text>
              </View>
              <Pressable
                onPress={() => playPreview(turkishSong.previewUrl)}
                className="bg-orange-600 px-2 py-2 rounded-lg shadow-xl flex-row items-center justify-center active:scale-95"
              >
                <Ionicons name={(currentTrack === turkishSong.previewUrl && isPlaying) ? "pause" : "play"} size={width * 0.06} color="#ffff" />
                <Text className="text-white text-lg font-semibold ml-2">{(currentTrack === turkishSong.previewUrl && isPlaying) ? "Durdur" : "Dinle"}</Text>
              </Pressable>
            </View>
          )}

        </View>
      )}
      {songs.length > 0 ? (
        <FlatList
          ref={flatListRef}
          data={songs}
          keyExtractor={(item, index) => `${item.trackId}-${index}`} //TrackIdye index ekleyerek her şarkıyı benzersiz hale getirdik. apiden benzer veriler geldiğinde çakışmalar yaşanıyorr.
          onEndReached={hasMoreData ? fetchMoreSongs : null}
          onEndReachedThreshold={0.8} //   %80 te tekrar yükleme tetiklenecek
          ListFooterComponent={loading ? <ActivityIndicator size="large" color="#FACC15" /> : null}
          contentContainerStyle={{ paddingBottom: 20, paddingTop: 20 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => playPreview(item.previewUrl)}
              className="bg-gray-600 py-2 px-2 rounded-lg shadow-lg flex-row items-center justify-between active:scale-[0.99] mb-3"
            >
              <View className="flex-row items-center">
                <Image source={{ uri: item.artworkUrl100 }} className="rounded-lg shadow-md" style={{ width: width * 0.15, height: width * 0.15 }} />
                <View className="ml-2 mr-2">
                  <Text className="text-white font-bold md:text-xl lg:text-2xl w-60 truncate">{item.trackName}</Text>
                  <Text className="text-[#CEF6B8] md:text-lg w-60 truncate">{item.artistName}</Text>
                </View>
              </View>
              {item.previewUrl && (
                <Pressable onPress={() => playPreview(item.previewUrl)} className="bg-green-400 rounded-full shadow-lg flex-row items-center justify-center active:scale-95">
                  <MaterialCommunityIcons
                    name={(currentTrack === item.previewUrl && isPlaying) ? "motion-pause" : "motion-play"}
                    size={width * 0.1}
                    color="#000000"
                  />
                </Pressable>
              )}
            </Pressable>
          )}
        />
      ) : (
        <View className="flex items-center justify-center pt-40">
          <View className="flex flex-row items-center justify-center mb-2 ">
            <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
              <MaterialCommunityIcons name="account-arrow-up-outline" size={width * 0.12} color="white" />
            </Animated.View>
            <Text className="text-yellow-300 text-xl text-center ml-2">Benden sana bir keşif müziği</Text>
          </View>
          <LottieView
            source={require("../assets/lottie/eqanimation.json")}
            autoPlay
            loop
            style={{ width: width * 1, height: width * 0.12 }}
          />
          <View className="flex flex-row items-center justify-center mt-2">
            <Animated.View
              style={{
                transform: [
                  { rotate: rotateAnim.x.interpolate({ inputRange: [0, 360], outputRange: ["0deg", "360deg"] }) },
                ],
              }}
            >
              <MaterialCommunityIcons name="search-web" size={width * 0.12} color="white" />
            </Animated.View>
            <Text className="text-yellow-300 text-xl text-center ml-2">Daha fazla keşfetmek için ara</Text>
          </View>
        </View>
      )}
      {currentTrackData && (
        <View className="absolute bottom-0 left-0 right-0 bg-[#808000]/95 px-2 pb-10 pt-4 flex-row items-center justify-between">
          <Image
            source={{ uri: currentTrackData.artworkUrl100 }}
            className="rounded-full"
            style={{ width: width * 0.16, height: width * 0.16 }}
          />
          <View className="flex-1 ml-2">
            <Text className="text-black text-2xl font-bold" numberOfLines={1}>
              {currentTrackData.trackName}
            </Text>
            <Text className="text-white text-lg" numberOfLines={1}>
              {currentTrackData.artistName}
            </Text>
          </View>
          <TouchableOpacity onPress={handlePrevious}>
            <MaterialCommunityIcons name="skip-previous-circle" size={width * 0.1} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePlayPause}>
            <MaterialCommunityIcons
              name={isPlaying ? "motion-pause" : "motion-play"}
              size={width * 0.12}
              color="#000000"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNext}>
            <MaterialCommunityIcons name="skip-next-circle" size={width * 0.1} color="white" />
          </TouchableOpacity>
        </View>
      )}
      <Toast config={toastConfig} />
    </KeyboardAvoidingView>
  );
};

export default SearchScreen;