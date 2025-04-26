export interface MusicData {
  trackId: number;
  artworkUrl100: string;
  trackName: string;
  artistName: string;
  previewUrl: string; // 🔥 Deezer ses önizleme URL'si!
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
      return []; // 📌 Eğer veri yoksa boş array döndürerek döngüyü durduralım!
    }

    return data.data.map((song: DeezerSong) => ({
      trackId: song.id,
      artworkUrl100: song.album.cover,
      trackName: song.title,
      artistName: song.artist.name,
      previewUrl: song.preview // 🎵 30 sn'lik müzik önizlemesi
    }));
  } catch (error) {
    console.error("Deezer API hatası:", error);
    return []; // 📌 Eğer hata alırsak yine boş array döndürerek döngüyü keselim!
  }
};

// 🎵 Türkiye’de Popüler Şarkıları Çekme
export const fetchTopTurkishSongs = async (): Promise<MusicData[]> => {
  try {
    const response = await fetch("https://api.deezer.com/playlist/1116189071"); // 🔥 Türkiye’nin popüler müzik listesi
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