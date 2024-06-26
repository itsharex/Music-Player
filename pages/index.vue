<template>
  <div>
    <li v-for="song in songs" :key="song.id" class="song-item">
      <img :src="song.cover" :alt="song.title" class="song-cover">
      <div class="song-info">
        <h2>{{ song.title }}</h2>
        <p>{{ song.artist }}</p>
        <p>{{ song.length }}</p>
        <p>{{ song.date_added }}</p>
      </div>
      <!-- Directly call playSong on click, passing the current song as an argument -->
      <button @click="playSong(song)">Play</button>
    </li>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { readSongs } from '~/lib/Config.ts';
import Player from '~/lib/Player.ts';

const songs = ref([]);
const player = new Player();

onMounted(async () => {
  try {
    const songsConfig = await readSongs();
    songs.value = Object.entries(songsConfig.songs).map(([id, song]) => ({
      ...song,
      length: formatDuration(song.length),
      date_added: formatDate(song.date_added),
    }));
  } catch (error) {
    console.error("Error during mounted hook:", error);
  }
});

function formatDuration(duration) {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${day < 10 ? '0' : ''}${day}.${month < 10 ? '0' : ''}${month}.${year}`;
}

const playSong = (song) => {
  player.setSong(song.id);
  player.play()
};
</script>

<style lang="scss">
@import '~/assets/styles/pages/index.scss';

.song-item {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.song-cover {
  width: 100px;
  height: 100px;
  object-fit: cover;
  margin-right: 20px;
}

.song-info h2 {
  margin: 0;
  font-size: 20px;
}

.song-info p {
  margin: 5px 0;
  font-size: 16px;
}
</style>