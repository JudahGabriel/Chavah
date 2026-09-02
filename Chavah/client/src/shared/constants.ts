export enum RouteAccess { Anonymous, Authenticated, Admin }

export interface AppRoute {
  pattern: string;                 // URLPattern pathname, e.g. "/trending"
  access: RouteAccess;
  load: () => Promise<unknown>;    // dynamic import of the page module
  tag: string;                     // custom element tag to instantiate
  redirectTo?: string;             // if set, navigate here instead of rendering
}
