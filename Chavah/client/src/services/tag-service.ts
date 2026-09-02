import { httpApi } from "./http-api-service";

export class TagService {
  getAll(): Promise<string[]> {
    return httpApi.query("/api/tags/getAll");
  }

  renameTag(oldTag: string, newTag: string): Promise<string> {
    return httpApi.postUriEncoded("/api/tags/rename", { oldTag, newTag });
  }

  deleteTag(tag: string): Promise<string> {
    return httpApi.postUriEncoded("/api/tags/delete", { tag });
  }

  searchTags(search: string): Promise<string[]> {
    return httpApi.query("/api/tags/searchTags", { search });
  }
}

export const tagApi = new TagService();
