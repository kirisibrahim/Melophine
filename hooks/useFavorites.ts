import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect } from "react";

const useFavorites = () => {
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    const fetchFavorites = async () => {
      const storedFavorites = await AsyncStorage.getItem("favorites");
      setFavorites(storedFavorites ? JSON.parse(storedFavorites) : []);
    };
    fetchFavorites();
  }, []);

  const toggleFavorite = async (trackId: number) => {
    let updatedFavorites = [...favorites];

    if (updatedFavorites.includes(trackId)) {
      updatedFavorites = updatedFavorites.filter((id) => id !== trackId);
    } else {
      updatedFavorites.push(trackId);
    }

    await AsyncStorage.setItem("favorites", JSON.stringify(updatedFavorites));
    setFavorites(updatedFavorites);
  };

  return { favorites, toggleFavorite };
};

export default useFavorites;