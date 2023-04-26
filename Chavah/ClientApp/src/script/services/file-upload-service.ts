import { ApiServiceBase } from "./api-service-base";

export class FileUploadService extends ApiServiceBase {
    upload(files: FileList): Promise<void> {
        const form = new FormData();
        Array.from(files).forEach((file) => form.append(`files`, file));
        return super.postFormData("/uploads/upload", form);
    }
}