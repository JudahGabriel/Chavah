/// <reference types="vite/client"

interface ImportMetaEnv {
    /**
     * The URL of the apps.ms API. In development, this will be the localhost URL launched from Visual Studio.
     * In production, this will be the root URL.
     */
    readonly VITE_API_URL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}