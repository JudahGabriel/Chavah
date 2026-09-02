import { httpApi } from "./http-api-service";
import { Song } from "../models/song";
import type { SongEdit } from "../models/server-interfaces";

export class SongEditService {
  getSongEdit(songId: string): Promise<SongEdit> {
    return httpApi.query("/api/songEdits/get", { songId });
  }

  submit(song: Song): Promise<SongEdit> {
    return httpApi.post("/api/songEdits/editSong", song);
  }

  getPendingEdits(take: number): Promise<SongEdit[]> {
    return httpApi.query("/api/songEdits/getPendingEdits", { take });
  }

  approve(songEdit: SongEdit): Promise<SongEdit> {
    return httpApi.post("/api/songEdits/approve", songEdit);
  }

  reject(songEditId: string): Promise<SongEdit | null> {
    return httpApi.postUriEncoded("/api/songEdits/reject", { songEditId });
  }
}

export const songEditApi = new SongEditService();
