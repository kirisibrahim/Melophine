import { fetchTopTurkishSongs } from "./fetchMusicData";

export const getRandomTurkishSong = async () => {
  const songs = await fetchTopTurkishSongs(); // 🔥 Türkiye’ye özel popüler şarkılar çekiliyor
  if (songs.length === 0) return null;

  return songs[Math.floor(Math.random() * songs.length)]; // 🎵 Rastgele bir Türkçe şarkı seç
};