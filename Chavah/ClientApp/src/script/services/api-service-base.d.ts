export declare class ApiServiceBase {
    protected readonly apiUrl: string;
    protected getJson<T>(url: string, args?: Object): Promise<T>;
    protected getString(url: string, args?: Object): Promise<string>;
    protected post<T>(url: string, args?: Object): Promise<T>;
    protected postFormData(url: string, formData: FormData): Promise<void>;
    protected getResponse(url: string, args?: Object): Promise<Response>;
}
