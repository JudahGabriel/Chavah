declare module server {
	interface PagedList {
		Total: number;
		Items: any[];
		Skip: number;
		Take: number;
	}
}
