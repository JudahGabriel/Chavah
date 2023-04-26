export class PagedResult<T> {
    constructor(
        public readonly skip: number,
        public readonly take: number,
        public readonly results: T[],
        public readonly totalCount: number) {
    }
}