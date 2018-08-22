namespace BitShuva.Chavah {
    export enum RouteAccess {
        Anonymous, // Everyone can access, even if not signed in
        Authenticated, // All authenticated users can access
        Admin, // Only admins can access
    }
}
