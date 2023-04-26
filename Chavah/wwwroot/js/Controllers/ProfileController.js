var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var ProfileController = /** @class */ (function () {
            function ProfileController(appNav, accountApi, userApi, pushNotifications) {
                this.appNav = appNav;
                this.accountApi = accountApi;
                this.userApi = userApi;
                this.pushNotifications = pushNotifications;
                this.profilePicUrl = null;
                this.isSaving = false;
                this.isUploadingPhoto = false;
                this.hasSavedSuccessfully = false;
                this.deviceSupportsPushNotifications = false;
                this.isSubscribedPushNotifications = false;
                this.showPushNotificationsBlocked = false;
                // Make a copy of the user so that we can edit freely without committing.
                this.user = new Chavah.User(this.accountApi.currentUser);
                this.profilePicUrl = this.user.profilePicUrl;
                var registrationDate = moment(this.user.registrationDate);
                this.registrationDateAgo = registrationDate.fromNow() + " (" + registrationDate.format('dddd, MMMM Do YYYY, h:mm a') + ")";
            }
            Object.defineProperty(ProfileController.prototype, "isSavingOrUploading", {
                get: function () {
                    return this.isSaving || this.isUploadingPhoto;
                },
                enumerable: false,
                configurable: true
            });
            ProfileController.prototype.$onInit = function () {
                this.loadPushNotificationState();
            };
            ProfileController.prototype.loadPushNotificationState = function () {
                return __awaiter(this, void 0, void 0, function () {
                    var _a, _b, state;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                _a = this;
                                return [4 /*yield*/, this.pushNotifications.isSupported()];
                            case 1:
                                _a.deviceSupportsPushNotifications = _c.sent();
                                _b = this;
                                return [4 /*yield*/, this.pushNotifications.isSubscribed()];
                            case 2:
                                _b.isSubscribedPushNotifications = _c.sent();
                                return [4 /*yield*/, this.pushNotifications.getStatus()];
                            case 3:
                                state = _c.sent();
                                this.showPushNotificationsBlocked = state === "denied";
                                return [2 /*return*/];
                        }
                    });
                });
            };
            ProfileController.prototype.launchImagePicker = function () {
                $("#imagePicker").click();
            };
            ProfileController.prototype.profilePicChanged = function (e) {
                return __awaiter(this, void 0, void 0, function () {
                    var files, file, cropResult, updatedProfilePic;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (!!this.isSaving) return [3 /*break*/, 5];
                                files = e.target["files"];
                                file = files.item(0);
                                if (!file) return [3 /*break*/, 5];
                                return [4 /*yield*/, this.appNav.cropImageModal(file).result];
                            case 1:
                                cropResult = _a.sent();
                                if (!(cropResult && cropResult.image)) return [3 /*break*/, 5];
                                // Immediately update the image on screen.
                                if (cropResult.imageBase64) {
                                    this.profilePicUrl = cropResult.imageBase64;
                                }
                                // Now send it to the server.
                                this.isUploadingPhoto = true;
                                this.hasSavedSuccessfully = false;
                                _a.label = 2;
                            case 2:
                                _a.trys.push([2, , 4, 5]);
                                return [4 /*yield*/, this.userApi.updateProfilePic(cropResult.image)];
                            case 3:
                                updatedProfilePic = _a.sent();
                                this.profilePicUrl = updatedProfilePic;
                                this.hasSavedSuccessfully = true;
                                return [3 /*break*/, 5];
                            case 4:
                                this.isUploadingPhoto = false;
                                return [7 /*endfinally*/];
                            case 5: return [2 /*return*/];
                        }
                    });
                });
            };
            ProfileController.prototype.subscribeToPushNotifications = function () {
                return __awaiter(this, void 0, void 0, function () {
                    var existingSub, permissionResult;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.pushNotifications.isSubscribed()];
                            case 1:
                                existingSub = _a.sent();
                                if (existingSub) {
                                    return [2 /*return*/];
                                }
                                return [4 /*yield*/, this.pushNotifications.askPermission()];
                            case 2:
                                permissionResult = _a.sent();
                                if (!(permissionResult === "granted")) return [3 /*break*/, 6];
                                this.isSaving = true;
                                _a.label = 3;
                            case 3:
                                _a.trys.push([3, , 5, 6]);
                                return [4 /*yield*/, this.pushNotifications.subscribe()];
                            case 4:
                                _a.sent();
                                return [3 /*break*/, 6];
                            case 5:
                                this.isSaving = false;
                                return [7 /*endfinally*/];
                            case 6:
                                this.loadPushNotificationState();
                                return [2 /*return*/];
                        }
                    });
                });
            };
            ProfileController.prototype.unsubscribeFromPushNotifications = function () {
                return __awaiter(this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                this.isSaving = true;
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, , 3, 4]);
                                return [4 /*yield*/, this.pushNotifications.unsubscribe()];
                            case 2:
                                _a.sent();
                                return [3 /*break*/, 4];
                            case 3:
                                this.isSaving = false;
                                return [7 /*endfinally*/];
                            case 4:
                                this.loadPushNotificationState();
                                return [2 /*return*/];
                        }
                    });
                });
            };
            ProfileController.prototype.save = function () {
                return __awaiter(this, void 0, void 0, function () {
                    var updatedUser;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (!!this.isSaving) return [3 /*break*/, 4];
                                this.isSaving = true;
                                this.hasSavedSuccessfully = false;
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, , 3, 4]);
                                return [4 /*yield*/, this.userApi.updateProfile(this.user)];
                            case 2:
                                updatedUser = _a.sent();
                                this.hasSavedSuccessfully = true;
                                this.profileSaved(updatedUser);
                                return [3 /*break*/, 4];
                            case 3:
                                this.isSaving = false;
                                return [7 /*endfinally*/];
                            case 4: return [2 /*return*/];
                        }
                    });
                });
            };
            ProfileController.prototype.profileSaved = function (updatedUser) {
                if (this.accountApi.currentUser) {
                    this.accountApi.currentUser.updateFrom(updatedUser);
                }
            };
            ProfileController.$inject = [
                "appNav",
                "accountApi",
                "userApi",
                "pushNotifications"
            ];
            return ProfileController;
        }());
        Chavah.ProfileController = ProfileController;
        Chavah.App.controller("ProfileController", ProfileController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=ProfileController.js.map