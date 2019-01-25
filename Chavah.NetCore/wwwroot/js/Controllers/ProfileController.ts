namespace BitShuva.Chavah {
    export class ProfileController {

        static $inject = [
            "appNav",
            "accountApi",
            "userApi",
            "pushNotifications"
        ];

        user: User;
        profilePicUrl: string | null = null;
        registrationDateAgo: string;
        isSaving = false;
        isUploadingPhoto = false;
        hasSavedSuccessfully = false;
        deviceSupportsPushNotifications = false;
        isSubscribedPushNotifications = false;
        showPushNotificationsBlocked = false;
                
        constructor(
            private readonly appNav: AppNavService,
            private readonly accountApi: AccountService,
            private readonly userApi: UserApiService,
            private readonly pushNotifications: PushNotificationService) {

            // Make a copy of the user so that we can edit freely without committing.
            this.user = new User(this.accountApi.currentUser!);
            this.profilePicUrl = this.user.profilePicUrl;

            const registrationDate = moment(this.user.registrationDate);
            this.registrationDateAgo = `${registrationDate.fromNow()} (${registrationDate.format('dddd, MMMM Do YYYY, h:mm a')})`;
        }

        get isSavingOrUploading(): boolean {
            return this.isSaving || this.isUploadingPhoto;
        }

        $onInit() {
            this.loadPushNotificationState();
        }

        async loadPushNotificationState() {
            this.deviceSupportsPushNotifications = await this.pushNotifications.isSupported();
            this.isSubscribedPushNotifications = await this.pushNotifications.isSubscribed();

            // Show some UI if we're blocked.
            const state = await this.pushNotifications.getStatus();
            this.showPushNotificationsBlocked = state === "denied";
        }

        launchImagePicker() {
            $("#imagePicker").click();
        }

        async profilePicChanged(e: JQueryEventObject) {
            if (!this.isSaving) {
                const files = e.target["files"] as FileList;
                const file = files.item(0);
                if (file) {
                    // If we've got a file, launch the Crop Image modal and let them zoom/pan/crop
                    const cropResult: ICropImageResult | null | undefined = await this.appNav.cropImageModal(file).result;
                    if (cropResult && cropResult.image) {
                        // Immediately update the image on screen.
                        if (cropResult.imageBase64) {
                            this.profilePicUrl = cropResult.imageBase64;
                        }

                        // Now send it to the server.
                        this.isUploadingPhoto = true;
                        this.hasSavedSuccessfully = false;
                        try {
                            // Update the profile pic and the profile data.
                            const updatedProfilePic = await this.userApi.updateProfilePic(cropResult.image);
                            
                            this.profilePicUrl = updatedProfilePic;
                            this.hasSavedSuccessfully = true;
                        } finally {
                            this.isUploadingPhoto = false;
                        }
                    }
                }
            }
        }

        async subscribeToPushNotifications() {
            // Already subscribed? Punt.
            const existingSub = await this.pushNotifications.isSubscribed();
            if (existingSub) {
                return;
            }

            const permissionResult = await this.pushNotifications.askPermission();
            if (permissionResult === "granted") {
                this.isSaving = true;
                try {
                    await this.pushNotifications.subscribe();
                } finally {
                    this.isSaving = false;
                }
            }

            this.loadPushNotificationState();
        }

        async unsubscribeFromPushNotifications() {
            this.isSaving = true;
            try {
                await this.pushNotifications.unsubscribe();
            } finally {
                this.isSaving = false;
            }
            this.loadPushNotificationState();
        }

        async save() {
            if (!this.isSaving) {
                this.isSaving = true;
                this.hasSavedSuccessfully = false;
                try {
                    const updatedUser = await this.userApi.updateProfile(this.user);
                    this.hasSavedSuccessfully = true;
                    this.profileSaved(updatedUser);
                } finally {
                    this.isSaving = false;
                }
            }
        }

        profileSaved(updatedUser: Server.IUserViewModel) {
            if (this.accountApi.currentUser) {
                this.accountApi.currentUser.updateFrom(updatedUser);
            }
        }
    }

    App.controller("ProfileController", ProfileController);
}