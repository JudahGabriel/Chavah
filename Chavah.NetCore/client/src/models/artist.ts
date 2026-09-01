import type { Artist as ServerArtist } from "./server-interfaces";

export class Artist {
  name!: string;
  images!: string[];
  bio!: string;

  isSaving = false;

  constructor(serverObj?: ServerArtist) {
    if (!serverObj) {
      serverObj = Artist.createDefaultServerObj();
    }
    Object.assign(this, serverObj);
  }

  updateFrom(serverObj: ServerArtist) {
    Object.assign(this, serverObj);
  }

  static createDefaultServerObj(): ServerArtist {
    return {
      bio: "",
      images: [],
      name: "",
    };
  }
}
