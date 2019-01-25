namespace BitShuva.Chavah {
    export class UserApiService {

        static $inject = ["httpApi"];

        constructor(private httpApi: HttpApiService) {
        }

        updateProfile(user: Server.IUserViewModel): ng.IPromise<Server.IUserViewModel> {
            return this.httpApi.post("/api/users/updateProfile", user);
        }
        
        updateProfilePic(file: Blob | string): ng.IPromise<string> {
            const url = "/api/users/uploadProfilePicture";
            const formData = new FormData();
            formData.append("file", file);
            return this.httpApi.postFormData(url, formData);
        }

        saveVolume(volume: number) {
            const args = {
                volume: volume
            };
            return this.httpApi.postUriEncoded("/api/users/saveVolume", args);
        }

        getProfilePicForEmailAddress(email: string): ng.IPromise<string | null> {
            const args = {
                email,
                v: "1.0"
            };
            return this.httpApi.query("/api/users/getProfilePicForEmailAddress", args);
        }
    }

    App.service("userApi", UserApiService);
}
