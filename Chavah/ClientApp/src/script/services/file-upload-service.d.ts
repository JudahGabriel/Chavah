import { ApiServiceBase } from "./api-service-base";
export declare class FileUploadService extends ApiServiceBase {
    upload(files: FileList): Promise<void>;
}
