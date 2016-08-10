import durandalRouter = require("plugins/router");
import SimpleQueryCommand = require("commands/simpleQueryCommand");

class Admin {
    router: DurandalRootRouter;

    constructor() {
        this.router = durandalRouter.createChildRouter()
            .map([
                { route: 'admin', moduleId: 'viewmodels/adminSongs', title: 'Songs', nav: true },
                { route: 'admin/users', moduleId: 'viewmodels/adminUsers', title: 'Users', nav: true },
                { route: 'admin/artists', moduleId: 'viewmodels/adminArtists', title: 'Artists', nav: true },
                { route: 'admin/albums', moduleId: 'viewmodels/adminAlbums', title: 'Albums', nav: true },
                { route: 'admin/login', moduleId: 'viewmodels/adminLogin', title: 'Log In', nav: false },
            ])
            .buildNavigationModel();

        this.router.guardRoute = (instance: Object, instruction: DurandalRouteInstruction) => this.getValidRoute(instance, instruction);
    }

    activate(args) {
    }

    getValidRoute(instance: Object, instruction: DurandalRouteInstruction): any {
        if (instruction.fragment && instruction.fragment !== "admin/login") {
            var guardRouteResult = $.Deferred();
            new SimpleQueryCommand("/admin/isAdmin")
                .execute()
                .done(result => {
                    if (result.IsAdmin) {
                        guardRouteResult.resolve(true);
                    } else {
                        // If we're not an admin, redirect to admin login.
                        guardRouteResult.resolve("#admin/login"); 
                    }
                });
            return guardRouteResult;
        }

        return true;
    }
}

export = Admin;