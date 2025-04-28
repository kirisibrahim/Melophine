import { MusicData } from "./fetchMusicData";
export const fetchFavoriteSongs = async (favoriteIds: number[]): Promise<MusicData[]> => {
    try {
      const fetchedSongs = await Promise.all(
        favoriteIds.map(async (trackId) => {
          const response = await fetch(`https://api.deezer.com/track/${trackId}`);
          const data = await response.json();
  
          // 🔥 Sadece ihtiyacımız olan verileri alalım, konsola gereksiz bilgi gitmesin
          return {
            trackId: data.id,
            trackName: data.title,
            artistName: data.artist?.name,
            artworkUrl100: data.album?.cover,
            previewUrl: data.preview,
          };
        })
      );
  
      return fetchedSongs;
    } catch (error) {
      console.error("Favori şarkıları çekme hatası:", error);
      return [];
    }
  };