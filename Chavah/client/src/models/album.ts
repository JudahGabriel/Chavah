import type { Album as ServerAlbum } from "./server-interfaces";

export class Album {
  artist!: string;
  name!: string;
  hebrewName!: string | null;
  albumArtUri!: string | null;
  id!: string;
  backgroundColor!: string;
  foregroundColor!: string;
  mutedColor!: string;
  textShadowColor!: string;
  isVariousArtists!: boolean;
  songCount!: number;

  isSaving = false;

  constructor(serverObj: ServerAlbum) {
    Object.assign(this, serverObj);
  }
}
