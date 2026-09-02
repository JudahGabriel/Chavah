export interface MediaFileUpload {
  name: string;
  id: string | null;
  cdnId: string | null;
  url: string | null;
  file: File;
  error: string | null;
  status: "queued" | "uploading" | "failed" | "completed";
}
