<template>
  <div class="search">
    <input type="text" v-model="searchTerm" @keyup.enter="searchSongs()" :disabled="isLoading"
      placeholder="Search for songs" />
    <ul v-if="searchResults.length > 0">
      <li v-for="(song, index) in searchResults" :key="song.trackId" :class="{ 'first-result': index === 0 }">
        <a @click.prevent="handleSongClick(song)" :href="song.youtubeLink || 'javascript:void(0);'" target="_blank">
          <img :src="song.artworkUrl100" alt="Cover image" />
          <div>{{ song.trackName }}</div>
          <div>{{ song.artistName }}</div>
        </a>
      </li>
    </ul>
  </div>
</template>

<script setup>
import DiscordRPC from "../lib/DiscordRPC";
import Search from "../lib/Search";
import Download from "../lib/Download";
import axios from 'axios';

const searchTerm = ref("");
const searchResults = ref([]);
const isLoading = ref(false);

const searchSongs = async () => {
  await DiscordRPC.update(
    "Searching...",
    searchTerm.value,
    "logo",
    "Vleer"
  );

  isLoading.value = true;

  if (searchTerm === "") {
    searchResults.value = [];
    isLoading.value = false;
    return;
  }

  try {
    const results = await Search.performSearch(searchTerm.value);
    searchResults.value = results;
  } catch (error) {
    console.error("An unexpected error occurred:", error);
    searchResults.value = [];
  } finally {
    isLoading.value = false;
  }
};

const fetchYoutubeLink = async (song) => {
  if (!song.youtubeLink) {
    try {
      const query = song.trackName + ' ' + song.artistName;
      const sanitizedQuery = query.replace(/&/g, '');
      const response = await axios.get(`https://wireway.ch/api/musicAPI/search/?q=${encodeURIComponent(sanitizedQuery)}`);
      if (response.data) {
        song.youtubeLink = "https://youtube.com" + response.data.items[0].url;
      }
    } catch (error) {
      console.error('Error fetching YouTube link:', error);
    }
  }
};

const handleSongClick = async (song) => {
  if (!song.youtubeLink) {
    await fetchYoutubeLink(song);
  }
  if (song.youtubeLink) {
    DiscordRPC.update(
      "Downloading",
      song.trackName,
      "logo",
      "Vleer"
    );
    downloadSong(song.youtubeLink)
  }
};

const downloadSong = async (url) => {
  try {
    if (!url) {
      console.error("URL is not defined.");
      return;
    }
    const match = url.match(/(?:\/watch\?v=)([^&]+)/);
    if (!match || match.length < 2) {
      console.error("Invalid YouTube URL.");
      return;
    }
    const videoId = match[1] + ".webm";
    await Download.downloadVideoAsMp3(url, videoId);
    DiscordRPC.clear()
  } catch (error) {
    console.error("Error:", error);
  }
};
</script>

<style lang="scss">
@import '~/assets/styles/pages/search.scss';
</style>
