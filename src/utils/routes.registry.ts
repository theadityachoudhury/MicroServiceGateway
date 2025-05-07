// src/utils/routes.registry.ts
export interface RouteInfo {
    authorized: boolean;
    service: string; // Which microservice to forward to
    pathRewrite?: string; // Optional path rewriting for proxying
}

const routesRegistry: { [key: string]: RouteInfo } = {
    // Auth service routes
    'POST/api/auth/sign-up': { authorized: false, service: 'auth' },
    'POST/api/auth/sign-in': { authorized: false, service: 'auth' },
    'POST/api/auth/refresh-token': { authorized: false, service: 'auth' },

    // Profile routes (auth service)
    'GET/api/auth/profile': { authorized: true, service: 'auth' },
    'GET/api/auth/client/profile': { authorized: true, service: 'auth' },
    'GET/api/auth/coach/profile': { authorized: true, service: 'auth' },
    'GET/api/auth/admin/profile': { authorized: true, service: 'auth' },
    'POST/api/auth/profile/image': { authorized: true, service: 'auth' },
    'PUT/api/auth/client/password': { authorized: true, service: 'auth' },
    'PUT/api/auth/coach/password': { authorized: true, service: 'auth' },

    // Gym service routes
    'GET/api/workouts/available': { authorized: false, service: 'gym' },
    'GET/api/workouts/workout-options': { authorized: false, service: 'gym' },
    'GET/api/workouts': { authorized: true, service: 'gym' },
    'POST/api/workouts': { authorized: true, service: 'gym' },
    'GET/api/coaches': { authorized: false, service: 'gym' },
    'GET/api/coaches/:coachId': { authorized: false, service: 'gym' },
    'GET/api/coaches/:coachId/time-slots': { authorized: false, service: 'gym' },

    // Booking service routes
    'GET/api/workouts/bookings': { authorized: true, service: 'booking' },
    'GET/api/workouts/:bookingId': { authorized: true, service: 'booking' },
    'GET/api/bookings/day': { authorized: true, service: 'booking' },
    
    // Feedback service routes
    'POST/api/feedback': { authorized: true, service: 'booking' },
    'GET/api/feedback/coach/:coachId': { authorized: true, service: 'booking' },
};

/**
 * Check if a given route is available in the registry
 * @param method HTTP method (GET, POST, etc)
 * @param path URL path
 * @returns Route information or null if not found
 */
const isRouteAvailable = (method: string, path: string): RouteInfo | null => {
    path = path.split('?')[0];
    if (path.length > 1 && path.endsWith('/')) {
        path = path.slice(0, -1);
    }

    const routeKey = `${method}${path}`;

    for (const key in routesRegistry) {
        const [keyMethod, ...keyPathParts] = key.split('/');
        const keyPath = '/' + keyPathParts.join('/');

        if (keyMethod !== method) continue;

        const pattern = '^' + keyPath
            .replace(/:[^/]+/g, '[^/]+')
            .replace(/\{[^/]+\}/g, '[^/]+')
            .replace(/\//g, '\\/') + '$';

        const regex = new RegExp(pattern);
        if (regex.test(path)) {
            return routesRegistry[key];
        }
    }

    return null;
};


export default isRouteAvailable;