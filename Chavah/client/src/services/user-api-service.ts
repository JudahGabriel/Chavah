import { httpApi } from "./http-api-service";
import type { User as ServerUser, PagedList } from "../models/server-interfaces";
import type { User } from "../models/user";

/**
 * Wraps the `/api/users` endpoints. Ported from the original AngularJS
 * `UserApiService`.
 */
export class UserApiService {
  updateProfile(user: User): Promise<ServerUser> {
    return httpApi.post<ServerUser>("/api/users/updateProfile", user);
  }

  updateProfilePic(file: Blob | string): Promise<string> {
    const formData = new FormData();
    formData.append("photo", file);
    return httpApi.postFormData<string>("/api/users/uploadProfilePicture", formData);
  }

  saveVolume(volume: number): Promise<unknown> {
    return httpApi.postUriEncoded("/api/users/saveVolume", { volume });
  }

  getProfilePicForEmailAddress(email: string): Promise<string | null> {
    return httpApi.query<string | null>("/api/users/getProfilePicForEmailAddress", { email, v: "1.0" });
  }

  getRegistrations(fromDate: string): Promise<PagedList<ServerUser>> {
    return httpApi.query<PagedList<ServerUser>>("/api/users/getRegistrations", { fromDate });
  }
}

export const userApi = new UserApiService();
