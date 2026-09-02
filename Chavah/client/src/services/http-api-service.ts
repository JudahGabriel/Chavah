import { appNav } from "./app-nav-service";
import { BehaviorSubject } from "../shared/reactive-store";

/**
 * Thin wrapper over `fetch` that replaces the original AngularJS `HttpApiService`
 * (which used `$http`/`$q`). Keeps the same method surface — `query`, `post`,
 * `postUriEncoded`, `postFormData` — each accepting an optional `selector` that
 * transforms the raw JSON response, plus a `showProgress` flag.
 *
 * On a 401 response the user's sign-in cookie is stale, so we route to sign-in,
 * mirroring the original behavior.
 */
export class HttpApiService {
  apiBaseUrl = "";

  /** Number of in-flight requests that opted into progress display. */
  readonly activeRequests = new BehaviorSubject<number>(0);

  query<T>(
    relativeUrl: string,
    args: any = null,
    selector?: (rawResult: any) => T,
    showProgress = true,
  ): Promise<T> {
    const url = this.apiBaseUrl + relativeUrl + this.toQueryString(args);
    return this.request<T>(url, { method: "GET" }, selector, showProgress, `Error loading ${relativeUrl}.`);
  }

  post<T>(relativeUrl: string, args: any, selector?: (rawResult: any) => T, showProgress = true): Promise<T> {
    const url = `${this.apiBaseUrl}${relativeUrl}`;
    const init: RequestInit = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: args == null ? undefined : JSON.stringify(args),
    };
    return this.request<T>(url, init, selector, showProgress, `Error saving ${relativeUrl}.`);
  }

  postUriEncoded<T>(
    relativeUrl: string,
    args: any,
    selector?: (rawResult: any) => T,
    showProgress = true,
  ): Promise<T> {
    const url = `${this.apiBaseUrl}${relativeUrl}?${this.encodeArgs(args)}`;
    return this.request<T>(url, { method: "POST" }, selector, showProgress, `Error saving ${relativeUrl}.`);
  }

  postFormData<T>(relativeUrl: string, formData: FormData, selector?: (rawResult: any) => T): Promise<T> {
    const questionMarkOrAmpersand = relativeUrl.indexOf("?") !== -1 ? "&" : "?";
    const url = `${this.apiBaseUrl}${relativeUrl}${questionMarkOrAmpersand}`;
    // Note: do NOT set Content-Type; the browser sets the multipart boundary.
    return this.request<T>(url, { method: "POST", body: formData }, selector, true, `Error saving ${relativeUrl}.`);
  }

  private async request<T>(
    url: string,
    init: RequestInit,
    selector: ((rawResult: any) => T) | undefined,
    showProgress: boolean,
    errorMessage: string,
  ): Promise<T> {
    if (showProgress) {
      this.beginProgress();
    }

    try {
      const response = await fetch(url, { credentials: "include", ...init });
      if (!response.ok) {
        this.onAjaxError(response.status, errorMessage);
        throw new Error(`${errorMessage} Server responded with ${response.status}.`);
      }

      const data = await this.parseBody(response);
      return selector ? selector(data) : (data as T);
    } finally {
      if (showProgress) {
        this.endProgress();
      }
    }
  }

  private async parseBody(response: Response): Promise<any> {
    const text = await response.text();
    if (!text) {
      return null;
    }
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  private toQueryString(args: any): string {
    if (!args) {
      return "";
    }
    const params = new URLSearchParams();
    for (const key of Object.keys(args)) {
      const value = args[key];
      if (value === null || value === undefined) {
        continue;
      }
      if (Array.isArray(value)) {
        for (const entry of value) {
          params.append(key, String(entry));
        }
      } else {
        params.append(key, String(value));
      }
    }
    const query = params.toString();
    return query ? `?${query}` : "";
  }

  private encodeArgs(args: any): string {
    const params = new URLSearchParams();
    if (args) {
      for (const key of Object.keys(args)) {
        const value = args[key];
        params.append(key, value == null ? "" : String(value));
      }
    }
    return params.toString();
  }

  private onAjaxError(status: number, _errorMessage: string): void {
    // If we got 401 unauthorized, our sign-in cookie is probably stale or invalid. Go to sign in.
    if (status === 401) {
      appNav.signIn();
    }
  }

  private beginProgress(): void {
    this.activeRequests.next(this.activeRequests.getValue() + 1);
  }

  private endProgress(): void {
    this.activeRequests.next(Math.max(0, this.activeRequests.getValue() - 1));
  }
}

export const httpApi = new HttpApiService();
