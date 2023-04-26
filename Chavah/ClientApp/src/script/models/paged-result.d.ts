export declare class PagedResult<T> {
    readonly skip: number;
    readonly take: number;
    readonly results: T[];
    readonly totalCount: number;
    constructor(skip: number, take: number, results: T[], totalCount: number);
}
