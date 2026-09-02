import { httpApi } from "./http-api-service";
import type { LogLevel, LogSort, PagedList, StructuredLog } from "../models/server-interfaces";

/**
 * Log-related API calls. Ported from the AngularJS `LogService`; used by the
 * admin log editor page.
 */
export class LogService {
  getAll(
    skip: number,
    take: number,
    level: LogLevel | null,
    sort: LogSort,
  ): Promise<PagedList<StructuredLog>> {
    const args = { skip, take, level, sort };
    return httpApi.query("/api/logs/getAll", args);
  }

  deleteLog(id: string): Promise<unknown> {
    return httpApi.postUriEncoded("/api/logs/delete", { id });
  }
}

export const logApi = new LogService();
