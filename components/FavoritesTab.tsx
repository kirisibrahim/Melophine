import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, Pressable, Animated } from "react-native";
import useFavorites from "../hooks/useFavorites";
import { fetchFavoriteSongs } from "../utils/fetchFavoriteSongs";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { Dimensions } from "react-native";
import { MusicData } from "@/utils/fetchMusicData";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get("window");

const FavoritesTab = () => {
  const flatListRef = useRef(null);
  const { favorites, toggleFavorite } = useFavorites();
  const [favoriteSongs, setFavoriteSongs] = useState<MusicData[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const currentTrackData: MusicData | null = favoriteSongs.find((s) => s.previewUrl === currentTrack) || null;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0.9, duration: 100, useNativeDriver: true }),
        ])
      ).start();
    } else {
      shakeAnim.setValue(0);
    }
  }, [isPlaying]);



  useEffect(() => {
    const getFavorites = async () => {
      if (favorites.length > 0) {
        const songs = await fetchFavoriteSongs(favorites);
        setFavoriteSongs(songs);
      } else {
        setFavoriteSongs([]);
      }
    };

    getFavorites();
  }, [favorites]);

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
          const currentIndex = favoriteSongs.findIndex((s) => s.previewUrl === previewUrl);
          if (currentIndex !== -1 && currentIndex < favoriteSongs.length - 1) {
            // önceki sesi temizleyelim
            await newSound.unloadAsync();
            setSound(null);
            // Sonraki şarkıyı oynat
            await playPreview(favoriteSongs[currentIndex + 1].previewUrl);
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
    const currentIndex = favoriteSongs.findIndex((s) => s.previewUrl === currentTrack);
    if (currentIndex !== -1 && currentIndex < favoriteSongs.length - 1) {
      playPreview(favoriteSongs[currentIndex + 1].previewUrl);
    }
  };

  const handlePrevious = () => {
    const currentIndex = favoriteSongs.findIndex((s) => s.previewUrl === currentTrack);
    if (currentIndex > 0) {
      playPreview(favoriteSongs[currentIndex - 1].previewUrl);
    }
  };

  const handlePlayPause = async () => {
    if (!currentTrack) return;
    await playPreview(currentTrack);
  };

  return (
    <View className="px-3 flex-1">
      <View className="flex-row items-center justify-center mb-2 rounded-lg">
      <Animated.View style={{ transform: [{ translateX: shakeAnim }, {rotateY:"180deg"}] }}>
          <MaterialCommunityIcons name="speaker-wireless" size={width*0.08} color="#000000" />
        </Animated.View>
        <Text className="text-xl font-bold text-center mr-2 ml-2" style={{color:"#FFFFFF"}}>Favori Şarkılarım</Text>
        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <MaterialCommunityIcons name="speaker-wireless" size={width*0.08} color="#000000" />
        </Animated.View>
      </View>
      {favoriteSongs.length > 0 ? (
        <FlatList
          ref={flatListRef}
          data={favoriteSongs}
          keyExtractor={(item, index) => `${item.trackId}-${index}`}
          contentContainerStyle={{ paddingBottom: 100}}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => playPreview(item.previewUrl)}
              className="py-2 px-2 rounded-lg flex-row items-center justify-between active:scale-[0.99] mb-2"
              style={{ backgroundColor: "#D6C1A6" }}
            >
              <View className="flex-row items-center flex-1">
                <Image source={{ uri: item.artworkUrl100 }} className="rounded-lg shadow-md" style={{ width: width * 0.15, height: width * 0.15 }} />
                <View className="ml-2 mr-2">
                  <Text className="text-black font-bold md:text-xl lg:text-2xl w-60 truncate">{item.trackName}</Text>
                  <Text className="text-black md:text-lg w-60 truncate">{item.artistName}</Text>
                </View>
              </View>

              <TouchableOpacity onPress={() => toggleFavorite(item.trackId)}>
                <MaterialCommunityIcons name={favorites.includes(item.trackId) ? "heart" : "heart-outline"} size={width * 0.1} color="#800000" />
              </TouchableOpacity>

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
        <Text className="text-gray-400 text-center mt-4">Henüz favori şarkınız yok.</Text>
      )}
      {currentTrackData && (
        <View className="absolute bottom-0 left-0 right-0 px-2 pb-10 pt-4 flex-row items-center justify-between"
          style={{ backgroundColor: "#ED9277" }}
        >
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
          <TouchableOpacity onPress={() => toggleFavorite(currentTrackData.trackId)}>
            <MaterialCommunityIcons
              name={favorites.includes(currentTrackData.trackId) ? "heart" : "heart-outline"}
              size={width * 0.1}
              color="#800000"
            />
          </TouchableOpacity>
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
    </View>
  );
};

export default FavoritesTab;