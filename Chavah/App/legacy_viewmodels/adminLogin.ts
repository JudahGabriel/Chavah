import Router = require("plugins/router");
import Song = require("models/song");

class AdminLogin {

    isSignInFailed = ko.observable(false);

    activate() {
        var result = $.Deferred();
        require(["https://login.persona.org/include.js"], persona => {
            result.resolve();

            navigator.id.watch({
                loggedInUser: "judahgabriel@gmail.com",
                onlogin: (assertion: string) => this.signedIn(assertion),
                onlogout: () => this.signedOut()
            });
        });

        return result;
    }

    signIn() {
        this.isSignInFailed(false);
        navigator.id.request({
            siteName: 'Chavah',
            oncancel: function () { }
        });
    }

    signedIn(personaAssertion: string) {
        // A user has logged in through Persona! Here you need to:
        // 1. Send the assertion to your backend for verification and to create a session.
        // 2. Update your UI.
        var args = {
            type: 'POST',
            url: '/admin/personalogin',
            data: { assertion: personaAssertion }
        };
        $.ajax(args)
            .fail((xhr: JQueryXHR) => this.signInFailed(xhr))
            .done((result: any) => this.signInSuccessful(result));
    }

    signedOut() {
        // A user has logged out! Here you need to:
        // Tear down the user's session by redirecting the user or making a call to your backend.
        // Also, make sure loggedInUser will get set to null on the next page load.
        // (That's a literal JavaScript null. Not false, 0, or undefined. null.)
        $.ajax({
            type: 'POST',
            url: '/admin/logout',
            success: function (res, status, xhr) { window.location.reload(); }
        });
    }

    signInSuccessful(result: any) {
        this.isSignInFailed(false);
        //Router.navigate("admin");
        window.location.href = "/#admin";
    }

    signInFailed(xhr: JQueryXHR) {
        navigator.id.logout();
        this.isSignInFailed(true);
    }
}

export = AdminLogin;