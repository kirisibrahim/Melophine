export interface MusicData {
  trackId: number;
  artworkUrl100: string;
  trackName: string;
  artistName: string;
  previewUrl: string;
}

interface DeezerSong {
  id: number;
  title: string;
  artist: { name: string };
  album: { cover: string };
  preview: string;
}

// 🔍 Kullanıcı Girdisine Bağlı Müzik Arama
export const fetchDeezerMusicData = async (searchTerm: string, page: number): Promise<MusicData[]> => {
  try {
    const response = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(searchTerm)}&index=${page * 50}&limit=50`);
    const data = await response.json();

    if (!data || !data.data || data.data.length === 0) {
      console.warn("Yeni veri bulunamadı, API sınırına ulaşıldı.");
      return []; // veri yoksa boş array
    }

    return data.data.map((song: DeezerSong) => ({
      trackId: song.id,
      artworkUrl100: song.album.cover,
      trackName: song.title,
      artistName: song.artist.name,
      previewUrl: song.preview
    }));
  } catch (error) {
    console.error("Deezer API hatası:", error);
    return []; // hata alırsak boş array
  }
};

// 🎵 Türkiye’de Popüler Şarkıları Çekme
export const fetchTopTurkishSongs = async (): Promise<MusicData[]> => {
  try {
    const response = await fetch("https://api.deezer.com/playlist/1116189071");
    const data = await response.json();

    return data.tracks.data.map((song: DeezerSong) => ({
      trackId: song.id,
      artworkUrl100: song.album.cover,
      trackName: song.title,
      artistName: song.artist.name,
      previewUrl: song.preview
    }));
  } catch (error) {
    console.error("Deezer API hatası:", error);
    return [];
  }
};