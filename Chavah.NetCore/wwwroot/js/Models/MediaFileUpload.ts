namespace BitShuva.Chavah {
    export interface MediaFileUpload {
        /**
         * The name of the media file. The name of a song, for example.
         */
        name: string;

        /**
         * The database ID of the temp file. This will be null if the media file hasn't been uploaded yet.
         */
        id: string | null;

        /**
         * The CDN ID of the uploaded asset. This will be null if the media file hasn't been uploaded, or if an error occurred during upload.
         */
        cdnId: string | null;

        /**
         * The URL of the uploaded asset. This will be null if the media file hasn't been uploaded.
         */
        url: string | null;

        /**
         * The file to upload.
         */
        file: File;

        /**
         * The message for the error that occurred during upload. This will be null if the media file hasn't been uploaded, or if no error occurred during uploaded.
         */
        error: string | null;

        /**
         * Whether the file is uploading.
         */
        status: "queued" | "uploading" | "failed" | "completed";
    }
}
