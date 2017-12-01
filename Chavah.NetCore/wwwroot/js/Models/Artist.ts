namespace BitShuva.Chavah {
    export class Artist implements Server.IArtist {
        name: string;
        images: string[];
        bio: string;

        isSaving = false;

        constructor(serverObj?: Server.IArtist) {
            if (!serverObj) {
                serverObj = Artist.createDefaultServerObj();
            }
            angular.merge(this, serverObj);
        }

        updateFrom(serverObj: Server.IArtist) {
            angular.merge(this, serverObj);
        }

        // tslint:disable-next-line:member-ordering
        static createDefaultServerObj(): Server.IArtist {
            return {
                bio: "",
                images: [],
                name: "",
            };
        }
    }
}
