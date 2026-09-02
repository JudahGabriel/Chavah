import { httpApi } from "./http-api-service";
import { Album } from "../models/album";
import type {
  Album as ServerAlbum,
  AlbumWithNetLikeCount,
  PagedList,
} from "../models/server-interfaces";

/**
 * Album-related API calls. Ported from the AngularJS `AlbumApiService`; `$http`
 * becomes the fetch-based `httpApi`. Admin-only upload/submission/donation
 * methods are added by their respective page migrations.
 */
export class AlbumApiService {
  get(id: string): Promise<Album | null> {
    return httpApi.query("/api/albums/get", { id }, AlbumApiService.albumSelector);
  }

  getAll(skip: number, take: number, search: string | null): Promise<PagedList<Album>> {
    const args = { skip, take, search };
    return httpApi.query("/api/albums/getAll", args, AlbumApiService.albumPagedListSelector);
  }

  getByArtistAndAlbumName(artist: string, album: string): Promise<Album | null> {
    const args = { artist, album };
    return httpApi.query("/api/albums/getByArtistAlbum", args, AlbumApiService.albumSelector);
  }

  getAlbums(albumIds: string[]): Promise<Album[]> {
    const args = { albumIdsCsv: albumIds.join(",") };
    return httpApi.query("/api/albums/getAlbums", args, AlbumApiService.albumArraySelector);
  }

  getLikedAlbums(skip: number, take: number, search: string): Promise<PagedList<AlbumWithNetLikeCount>> {
    const args = { skip, take, search };
    return httpApi.query("/api/albums/getLikedAlbums", args);
  }

  save(album: Album): Promise<Album> {
    return httpApi.post("/api/albums/save", album, (a) => new Album(a));
  }

  changeArt(albumId: string, artUri: string): Promise<Album | null> {
    const args = { albumId, artUri };
    return httpApi.postUriEncoded("/api/albums/changeArt", args, AlbumApiService.albumSelector);
  }

  deleteAlbum(albumId: string): Promise<unknown> {
    return httpApi.postUriEncoded("/api/albums/delete", { albumId });
  }

  static albumSelector(serverObj: ServerAlbum | null): Album | null {
    return serverObj ? new Album(serverObj) : null;
  }

  static albumArraySelector(serverObjs: ServerAlbum[]): Album[] {
    return serverObjs.map((s) => AlbumApiService.albumSelector(s)!);
  }

  static albumPagedListSelector(serverObj: PagedList<ServerAlbum>): PagedList<Album> {
    return {
      items: AlbumApiService.albumArraySelector(serverObj.items),
      skip: serverObj.skip,
      take: serverObj.take,
      total: serverObj.total,
    };
  }
}

export const albumApi = new AlbumApiService();
