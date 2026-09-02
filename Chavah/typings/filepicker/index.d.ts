interface FilepickerStatic {
    setKey(key: string);
    /* Pick files From the cloud direct to your site */
    pick(options: FilepickerOptions, onSuccess: (result: FilepickerInkBlob) => void, onError?: (fpError: any) => void);
    /* Pick files From the cloud direct to your site */
    pick(onSuccess: (result: FilepickerInkBlob) => void, onError?: (fpError: any) => void);
    /* To select multiple files at once, use the pickMultiple call. */
    pickMultiple(options: FilepickerMultipleFilePickOptions, onSuccess: (result: FilepickerInkBlob[]) => void, onError?: (fpError: any) => void);
    /* To select multiple files at once, use the pickMultiple call. */
    pickMultiple(onSuccess: (result: FilepickerInkBlob[]) => void, onError?: (fpError: any) => void);
    /* To take care of everything at once, you can send uploaded files directly to S3, Rackspace, Azure and Dropbox. Note that the URLs that are returned will point to copies that are stored, not the versions that exist in Google Drive, Dropbox, etc. */
    pickAndStore(options: FilepickerMultipleFilePickOptions, storageOptions: FilepickerStoreOptions, onSuccess: (result: FilepickerInkBlob) => void, onError: (fpError: any) => void);
}

interface FilepickerOptions {
    /*
     * Specify the type of file that the user is allowed to pick. For example, if you wanted images, specify image/* and users will only be able to select images to upload. Similarly, you could specify application/msword for only Word Documents.
     *
     * You can also specify an array of mimetypes to allow the user to select a file from any of the given types.
     */
    mimetype?: string;
    mimetypes?: string[];
    /*
     * Specify the type of file that the user is allowed to pick by extension. Don't use this option with mimetype(s) specified as well
     * 
     * You can also specify an array of extensions to allow the user to select a file from any of the given types.
     */
    extension?: string;
    extensions?: string[];
    /*
     * Where to load the Ink file picker UI into. Possible values are "window", "modal", or the id of an iframe in the current document. Defaults to "modal". Note that if the browser disables 3rd party cookies, the dialog will automatically fall back to being served in a new window.
     */
    container?: string;
    /*
     * Specify which services are displayed on the left panel, and in which order, by name.
     *
     * Be sure that the services you select are compatible with the mimetype(s) or extension(s) specified.
     * Currently, the Ink file picker supports the following services, and we're adding more all the time: BOX
     *
     *  COMPUTER
     *  DROPBOX
     *  EVERNOTE
     *  FACEBOOK
     *  FLICKR
     *  FTP
     *  GITHUB
     *  GOOGLE_DRIVE
     *  SKYDRIVE
     *  PICASA
     *  WEBDAV
     * 
     * Pick only: 
     *  GMAIL
     *  IMAGE_SEARCH
     *  INSTAGRAM
     *  URL
     *  VIDEO
     *  WEBCAM
     *
     * Export only:
     *  SEND_EMAIL
     */
    service?: string;
    services?: string[];

    /* 
     * Specifies which service to show upon opening. If not set, the user is shown their most recently used location, or otherwise the computer upload page. 
     */
    openTo?: string;
    /*
     * Limit file uploads to be at max maxSize bytes.
     */
    maxSize?: number;
    /* 
     * Useful when developing, makes it so the onSuccess callback is fired immediately with dummy data.
     */
    debug?: boolean;
    /*
     * If you have security enabled, you'll need to have a valid Ink file picker policy and signature in order to perform the requested call. This allows you to select who can and cannot perform certain actions on your site.
     */
    policy?: string;
    /*
     * If you have security enabled, you'll need to have a valid Ink file picker policy and signature in order to perform the requested call. This allows you to select who can and cannot perform certain actions on your site.
     */
    signature?: string;
    /*
     * The function to call if a file is picked successfully.
     *
     * We'll return an InkBlob as a JSON object with the following properties.
     *
     * url: The core Ink file url on which all other operations are based.
     * filename: The filename of the uploaded file.
     * mimetype: The mimetype of the uploaded file.
     * size: The size of the uploaded file in bytes, if available.
     * isWriteable: Whether the file can be written to using filepicker.write.
     * Note: the "key" parameter is deprecated and will be removed soon. If you want to store files immediately after picking, use the filepicker.pickAndStore call.
     */
    onSuccess?: (result: FilepickerInkBlob) => void;
    onError?: (result: any) => void;
}

interface FilepickerMultipleFilePickOptions extends FilepickerOptions {
    /* Specify the maximum number of files that the user can upload at a time. If the user tries to upload more than this, they will be presented with an error message. By default, there is no cap on the number of files. */
    maxFiles?: number;
    /* Indicate that users should be able to upload entires folders worth of files at a time.Due to browser support, this is currently only available on recent versions of Chrome and Safari. By default, this is of(false). Folder upload is a premium feature available only on the "Grow" and higher plans. */
    folders?: boolean;
}

interface FilepickerStoreOptions {
    /*
     * Where to store the file. The default is S3. Other options are 'azure', 'dropbox' and 'rackspace'. You must have configured your storage in the developer portal to enable this feature.
     *
     * Rackspace, Azure and Dropbox are only available on the Grow and higher plans.
     */
    location?: string;
    /*
     * The path to store the file at within the specified file store. For S3, this is the key where the file will be stored at. By default, Ink stores the file at the root at a unique id, followed by an underscore, followed by the filename, for example "3AB239102DB_myphoto.png".
     *
     * If the provided path ends in a '/', it will be treated as a folder, so if the provided path is "myfiles/" and the uploaded file is named "myphoto.png", the file will be stored at "myfiles/909DFAC9CB12_myphoto.png", for example.
     *
     * If the multiple option is set to be true, only paths that end in '/' are allowed.
     */
    path?: string;
    /*
     * The bucket or container in the specified file store where the file should end up. This is especially useful if you have different containers for testing and production and you want to use them both on the same filepicker app. If this parameter is omitted, the file is stored in the default container specified in your developer portal.
     *
     * Note that this parameter does not apply to the Dropbox file store.
     */
    container?: string;
    /*
     * Indicates that the file should be stored in a way that allows public access going directly to the underlying file store. For instance, if the file is stored on S3, this will allow the S3 url to be used directly. This has no impact on the ability of users to read from the Ink file URL. Defaults to 'private'.
     */
    access?: string;
}

interface FilepickerInkBlob {
    /* The most critical part of the file, the url points to where the file is stored and acts as a sort of "file path". The url is what is used when making the underlying GET and POST calls to Ink when you do a filepicker.read or filepicker.write call. */
    url: string;
    /* The name of the file, if available */
    filename: string;
    /* The mimetype of the file, if available. */
    mimetype: string;
    /* The size of the file in bytes, if available. We will attach this directly to the InkBlob when we have it, otherwise you can always get the size by calling filepicker.stat */
    size: number;
    /* If the file was stored in one of the file stores you specified or configured (S3, Rackspace, Azure, etc.), this parameter will tell you where in the file store this file was put. */
    key: string;
    /* If the file was stored in one of the file stores you specified or configured (S3, Rackspace, Azure, etc.), this parameter will tell you in which container this file was put. */
    container: string;
    /* This flag specifies whether the underlying file is writeable. In most cases this will be true, but if a user uploads a photo from facebook, for instance, the original file cannot be written to. In these cases, you should use the filepicker.exportFile call as a way to give the user the ability to save their content. */
    isWriteable: boolean;
    /* The path of the InkBlob indicates its position in the hierarchy of files uploaded when {folders:true} is set. In situations where the file was not uploaded as part of or along with a folder, path will not be defined. */
    path: string;
}

declare module "filepicker" {
    export = filepicker;
}

declare var filepicker: FilepickerStatic;