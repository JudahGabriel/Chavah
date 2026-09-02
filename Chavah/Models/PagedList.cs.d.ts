declare module server {
	interface pagedList {
		total: number;
		items: any[];
		skip: number;
		take: number;
	}
}
