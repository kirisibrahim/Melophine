export const formatSongData = (song: any) => ({
    id: song.trackId,
    title: song.trackName,
    artist: song.artistName,
    album: song.collectionName,
    previewUrl: song.previewUrl,
    artwork: song.artworkUrl100,
  });