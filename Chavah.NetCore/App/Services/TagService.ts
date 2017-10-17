namespace BitShuva.Chavah {
    export class TagService {

        static $inject = ["httpApi"];

        constructor(private httpApi: HttpApiService) {
        }

        getAll(): ng.IPromise<string[]> {
            return this.httpApi.query("/api/tags/getAll");
        }

        renameTag(oldTag: string, newTag: string): ng.IPromise<string> {
            var args = {
                oldTag: oldTag,
                newTag: newTag
            };
            return this.httpApi.postUriEncoded("/api/tags/rename", args);
        }

        deleteTag(tag: string): ng.IPromise<string> {
            var args = {
                tag: tag
            };
            return this.httpApi.postUriEncoded("/api/tags/delete", args);
        }

        searchTags(search: string): ng.IPromise<string[]> {
            var args = {
                search: search
            };
            return this.httpApi.query("/api/tags/searchTags", args);
        }
    }

    App.service("tagApi", TagService);
}