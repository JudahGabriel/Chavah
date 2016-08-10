import Router = require("plugins/router");
import App = require("durandal/app");

class shell {
    latestBlogPostTitle = ko.observable<string>();
    latestBlogPostHref = ko.observable<string>();  
    isEmbedded = false;  
    isSignedIn = ko.observable(false).subscribeTo("SignedInUserChanged", false, (signedInUser) => !!signedInUser);
    isProcessingSignIn = ko.observable(false).subscribeTo("SignedInUserChanging", false, () => true);
    signedInUserName = ko.observable("").subscribeTo("SignedInUserChanged");

    activate() {
        this.isEmbedded = $(".embedded-ui").length > 0;
        var homeRoute = { route: '', title: 'Chavah Messianic Radio', moduleId: 'viewmodels/home', nav: true };
        var embedRoute = { route: '', title: 'Chavah Messianic Radio', moduleId: 'viewmodels/embed', nav: false };
        var mainRoute = this.isEmbedded ? embedRoute : homeRoute;
        var downtimeRoute = { route: '', title: 'Chavah Messianic Radio', moduleId: 'viewmodels/downtime', nav: true };
        var adminRoute = { route: 'admin*details', title: 'Chavah Admin', moduleId: 'viewmodels/admin', nav: true };
        var aboutRoute = { route: 'about', title: 'About', moduleId: 'viewmodels/about', nav: true };
        var thanksRoute = { route: 'thanksforsharing', title: 'Thanks!', moduleId: 'viewmodels/thanksForSharing', nav: true };
        Router.map([mainRoute, adminRoute, aboutRoute, thanksRoute]).buildNavigationModel();
        //Router.map([downtimeRoute, adminRoute]).buildNavigationModel();

        Router.isNavigating.subscribe(isNavigating => {
            if (isNavigating) {
                NProgress.start();
            } else {
                NProgress.done();
            }
        });

        this.signedInUserName.subscribe(() => this.isProcessingSignIn(false));
        var signedInUserName = window["chavah.signedInUserName"];
        if (signedInUserName) {
            ko.postbox.publish("SignedInUserChanged", signedInUserName);
        }

        return Router.activate();
    }

    attached() {
        if (!this.isEmbedded) {
            $.get("/durandal/getLatestBlogPost", (result) => {
                this.latestBlogPostTitle(result.Title);
                this.latestBlogPostHref(result.Uri);
            });
        }

        $("body").tooltip({
            selector: ".use-bootstrap-tooltip",
            container: "body",
            html: true,
            trigger: 'hover',
            delay: { show: 500, hide: 100  }
        });
    }

    signIn() {
        navigator.id.request({
            siteName: "Chavah Messianic Radio",
            oncancel: () => { }
        });
    }

    signOut() {
        navigator.id.logout();
    }

    showProfile() {
        require(["viewmodels/profileDialog"], (ProfileDialog: any) => {
            var profileViewModel = new ProfileDialog();
            App.showDialog(profileViewModel);
        });
    }
}

export = shell;