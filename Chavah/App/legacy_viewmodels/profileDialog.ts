import Song = require("models/song");
import GetUserProfileCommand = require("commands/getUserProfileCommand");
import Dialog = require("plugins/dialog");

class ProfileDialog {

    userProfile = ko.observable<server.UserProfile>();
    isLoadingUser = ko.observable(true);
    totalRegisteredDaysText = ko.computed(() => this.computedDaysSinceRegistered());
    hoursMinutesListened = ko.computed(() => this.computHoursMinutesListened());

    constructor() {
        this.fetchUser()
            .then(u => this.userProfile(u));
    }

    fetchUser(): JQueryPromise<server.UserProfile> {
        this.isLoadingUser(true);
        return new GetUserProfileCommand()
            .execute()
            .always(() => this.isLoadingUser(false));
    }

    computedDaysSinceRegistered(): string {
        var user = this.userProfile();
        if (user) {
            return moment(user.RegistrationDate).fromNow(false);
        }

        return null;
    }

    computHoursMinutesListened(): string {
        var user = this.userProfile();
        if (user) {
            var averageSongLengthInMinutes = 3.7;
            var totalMinutesListened = averageSongLengthInMinutes * user.TotalPlays;
            var hoursListened = Math.floor(totalMinutesListened / 60);
            var minutesListened = Math.ceil(totalMinutesListened - (hoursListened * 60));
            if (hoursListened > 0) {
                return hoursListened + " hours and " + minutesListened + " minutes";
            } else {
                return minutesListened + " minutes";
            }
        }

        return null;
    }

    close() {
        Dialog.close(this);
    }
}

export = ProfileDialog;