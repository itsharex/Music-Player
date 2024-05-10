import {
  BaseDirectory,
} from "@tauri-apps/plugin-fs";
import type { MusicStore, SongsConfig, Song, Playlist } from "~/types/types";
import Database from "@tauri-apps/plugin-sql";

export const useMusicStore = defineStore("musicStore", {
  state: () => ({
    songsConfig: {
      songs: {},
      playlists: {},
    },
    player: {
      audio: new Audio(),
      currentSongId: "",
      audioContext: null,
      sourceNode: null,
      eqFilters: []
    },
    lastUpdated: Date.now(),
    db: null,
  } as MusicStore),

  actions: {
    async init() {
      this.db = await Database.load("sqlite:data.db");
      const songs = await this.db.select<Song[]>("SELECT * FROM songs");
      songs.forEach(song => {
        this.songsConfig.songs[song.id] = song;
      });

      const playlists = await this.db.select<Playlist[]>("SELECT * FROM playlists");
      playlists.forEach(playlist => {
        this.songsConfig.playlists[playlist.id] = playlist;
      });

      this.player.audio.volume = 1;
      this.player.audio.preload = "auto";
    },
    async addSongData(song: Song) {
      await this.db.execute("INSERT INTO songs (id, title, artist, length, cover, date_added, last_played) VALUES (?, ?, ?, ?, ?, ?, ?)", [
        song.id, song.title, song.artist, song.length, song.cover, song.date_added, song.lastPlayed
      ]);
      this.songsConfig.songs[song.id] = song;
      this.lastUpdated = Date.now();
    },
    getSongsData(): SongsConfig {
      return this.songsConfig;
    },
    async setSongFromBuffer(buffer: any) {
      const blob = new Blob([buffer], { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      this.player.audio.currentTime = 0;
      this.player.audio.src = url;
      await this.player.audio.load();
      this.player.audio.addEventListener("error", (e) => {
        console.error("Error with audio element:", e);
      });
    },
    getAudio(): HTMLAudioElement {
      return this.player.audio;
    },
    getSongByID(id: string): Song | null {
      return this.songsConfig.songs[id] ?? null;
    },
    async updateLastPlayed(songId: string, lastPlayed: string) {
      await this.db.execute("UPDATE songs SET last_played = ? WHERE id = ?", [lastPlayed, songId]);
      if (this.songsConfig.songs[songId]) {
        this.songsConfig.songs[songId].lastPlayed = lastPlayed;
      }
    },
    async createPlaylist(playlist: Playlist) {
      await this.db.execute("INSERT INTO playlists (id, name, cover) VALUES (?, ?, ?)", [
        playlist.id, playlist.name, playlist.cover
      ]);
      this.songsConfig.playlists[playlist.id] = playlist;
    },
    getPlaylistByID(id: string): Playlist | null {
      return this.songsConfig.playlists[id] ?? null;
    },
    async addSongToPlaylist(playlistId: string, songId: string) {
      await this.db.execute("INSERT INTO playlist_songs (playlist_id, song_id) VALUES (?, ?)", [playlistId, songId]);
      if (this.songsConfig.playlists[playlistId] && this.songsConfig.songs[songId]) {
        this.songsConfig.playlists[playlistId].songs.push(songId);
      }
    },
    async renamePlaylist(playlistId: string, newName: string) {
      await this.db.execute("UPDATE playlists SET name = ? WHERE id = ?", [newName, playlistId]);
      if (this.songsConfig.playlists[playlistId]) {
        this.songsConfig.playlists[playlistId].name = newName;
      }
    },
    async updatePlaylistCover(playlistId: string, newCoverPath: string) {
      await this.db.execute("UPDATE playlists SET cover = ? WHERE id = ?", [newCoverPath, playlistId]);
      if (this.songsConfig.playlists[playlistId]) {
        this.songsConfig.playlists[playlistId].cover = newCoverPath;
      }
    },
  },
});