import { httpApi } from "./http-api-service";
import { Song } from "../models/song";
import { SongPick } from "../models/song-pick";
import type { IAudioErrorInfo } from "../models/audio-error-info";
import type { PagedList, Song as ServerSong } from "../models/server-interfaces";

/**
 * Song-related API calls. Ported from the AngularJS `SongApiService`; `$http`
 * becomes the fetch-based `httpApi`. The static converters that rehydrate raw
 * server DTOs into `Song` domain objects are preserved verbatim.
 */
export class SongApiService {
  chooseSong(): Promise<Song> {
    return httpApi.query("/api/songs/chooseSong", null, SongApiService.songConverter);
  }

  chooseSongBatch(): Promise<Song[]> {
    return httpApi.query("/api/songs/chooseSongBatch", null, SongApiService.songListConverter);
  }

  getSongById(id: string, songPickReason?: SongPick): Promise<Song | null> {
    const task = httpApi.query("/api/songs/getById", { songId: id }, SongApiService.songOrNullConverter);
    if (songPickReason != null) {
      task.then((song) => {
        if (song) {
          song.setSolePickReason(songPickReason);
        }
      });
    }
    return task;
  }

  getSongByArtistAndAlbum(artist: string, album: string): Promise<Song | null> {
    const url = "/api/songs/getByArtistAndAlbum";
    const args = { artist, album };
    return httpApi.query(url, args, SongApiService.songOrNullConverter);
  }

  getSongByAlbum(album: string): Promise<Song | null> {
    const url = "/api/songs/getByAlbum/";
    const args = { album };
    return httpApi.query(url, args, SongApiService.songOrNullConverter);
  }

  getSongByAlbumId(albumId: string): Promise<Song | null> {
    const url = "/api/songs/getByAlbumId/";
    const args = { albumId };
    return httpApi.query(url, args, SongApiService.songOrNullConverter);
  }

  getSongWithTag(tag: string): Promise<Song | null> {
    const url = "/api/songs/getByTag";
    const args = { tag };
    return httpApi.query(url, args, SongApiService.songOrNullConverter);
  }

  getSongByArtist(artist: string): Promise<Song | null> {
    const url = "/api/songs/getByArtist";
    const args = { artist };
    return httpApi.query(url, args, SongApiService.songOrNullConverter);
  }

  getSongByArtistId(artistId: string): Promise<Song | null> {
    const url = "/api/songs/getByArtistId/";
    const args = { artistId };
    return httpApi.query(url, args, SongApiService.songOrNullConverter);
  }

  getSongMatches(searchText: string): Promise<Song[]> {
    const url = "/api/songs/search";
    const args = { searchText };
    return httpApi.query(url, args, SongApiService.songListConverter);
  }

  getTrendingSongs(skip: number, take: number): Promise<PagedList<Song>> {
    const args = { skip, take };
    return httpApi.query("/api/songs/getTrending", args, SongApiService.songPagedListConverter);
  }

  getRandomPopular(count: number): Promise<Song[]> {
    const args = { count };
    return httpApi.query("/api/songs/getRandomPopular", args, SongApiService.songListConverter);
  }

  getPopular(skip: number, take: number): Promise<PagedList<Song>> {
    const args = { skip, take };
    return httpApi.query("/api/songs/getpopular", args, SongApiService.songPagedListConverter);
  }

  getRandomLikedSongs(count: number): Promise<Song[]> {
    const args = { count };
    return httpApi.query("/api/songs/getRandomLikedSongs", args, SongApiService.songListConverter);
  }

  getLikes(skip: number, take: number, search?: string): Promise<PagedList<Song>> {
    const args = { skip, take, search };
    return httpApi.query("/api/songs/getLikedSongs", args, SongApiService.songPagedListConverter);
  }

  getRecentPlays(count: number): Promise<Song[]> {
    const args = { count };
    return httpApi.query("/api/songs/getRecentPlays", args, SongApiService.songListConverter);
  }

  songCompleted(songId: string): Promise<any> {
    const args = { songId };
    return httpApi.postUriEncoded("/api/songs/songCompleted", args);
  }

  songFailed(error: IAudioErrorInfo): Promise<any> {
    return httpApi.postUriEncoded("/api/songs/recordAudioError", error);
  }

  getSongsAdmin(skip: number, take: number, search: string): Promise<PagedList<ServerSong>> {
    const args = { skip, take, search };
    return httpApi.query("/api/songs/getSongsAdmin", args);
  }

  deleteSong(song: Song): Promise<any> {
    return httpApi.post("/api/songs/deleteSong", song);
  }

  getRandomNewSongs(count: number): Promise<Song[]> {
    const args = { count };
    return httpApi.query("/api/songs/getRandomNewSongs", args, SongApiService.songListConverter);
  }

  getRandomNewSongForUser(): Promise<string | null> {
    return httpApi.query("/api/songs/GetRandomNewSongForUser", null);
  }

  public static songPagedListConverter(dto: PagedList<ServerSong>): PagedList<Song> {
    return {
      items: dto.items.map((s) => new Song(s)),
      skip: dto.skip,
      take: dto.take,
      total: dto.total,
    };
  }

  public static songListConverter(songs: ServerSong[]): Song[] {
    return songs.map((r) => SongApiService.songConverter(r));
  }

  public static songOrNullConverter(raw: ServerSong | null): Song | null {
    if (raw) {
      return SongApiService.songConverter(raw);
    }
    return null;
  }

  public static songConverter(raw: ServerSong): Song {
    return new Song(raw);
  }
}

export const songApi = new SongApiService();
