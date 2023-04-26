namespace BitShuva.Chavah {
    export class Artist implements Server.Artist {
        name: string;
        images: string[];
        bio: string;

        isSaving = false;

        constructor(serverObj?: Server.Artist) {
            if (!serverObj) {
                serverObj = Artist.createDefaultServerObj();
            }
            angular.merge(this, serverObj);
        }

        updateFrom(serverObj: Server.Artist) {
            angular.merge(this, serverObj);
        }

        // tslint:disable-next-line:member-ordering
        static createDefaultServerObj(): Server.Artist {
            return {
                bio: "",
                images: [],
                name: "",
            };
        }
    }
}
