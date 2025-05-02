// createQuizQuestion.ts

import { fetchQuizSongs, MusicData } from "./fetchMusicData";

export interface QuizQuestion {
  question: string;
  previewUrl: string;
  correctAnswer: string;
  choices: string[];
}

// fisher-yates algoritması shuffle fonksiyonu
const shuffle = <T,>(array: T[]): T[] => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

/**
 * - Playlistden quiz sorularını çeker.
 * - Rastgele bir şarkıyı doğru cevap olarak seçer.
 * - Doğru şarkı dışındaki şarkılardan rastgele 3seçenek belirler.
 * - Şıkları karıştırarak QuizQuestion nesnesini döner.
 */
export const createQuizQuestion = async (): Promise<QuizQuestion | null> => {
  const songs: MusicData[] = await fetchQuizSongs();
  if (!songs || songs.length < 5) return null;

  // Rastgele doğru şarkıyı seç
  const correctSongIndex = Math.floor(Math.random() * songs.length);
  const correctSong = songs[correctSongIndex];

  // Doğru şarkıyı hariç tutarak 3 yanlış seçenek seçiyoruz
  const wrongSongs = songs.filter(song => song.trackId !== correctSong.trackId);
  if (wrongSongs.length < 3) return null;
  const selectedWrongSongs = shuffle(wrongSongs).slice(0, 3).map(song => song.trackName);

  // Tüm seçenekleri karıştırıyoruz
  const choices = shuffle([...selectedWrongSongs, correctSong.trackName]);

  return {
    question: "Çalan Şarkının İsmi?",
    previewUrl: correctSong.previewUrl,
    correctAnswer: correctSong.trackName,
    choices,
  };
};