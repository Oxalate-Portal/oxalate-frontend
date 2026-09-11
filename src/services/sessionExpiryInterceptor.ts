import type {AxiosError, AxiosInstance} from "axios";

const USER_KEY = "user";

/**
 * OWASP A07:2025 / A10:2025.
 *
 * Before this existed there was no axios response interceptor anywhere, so an expired or revoked session
 * produced a wall of failing requests while the UI still rendered as if the user were logged in. The
 * mirrored session in `localStorage` never expired on its own, which is both a confusing failure mode and a
 * way for a shared machine to keep showing another person's identity.
 *
 * The backend answers unauthenticated requests with 401 and can answer revoked or invalid sessions with 403.
 * When the frontend has a stored session, either response means that the session must be re-established.
 */
export function isSessionExpired(now: number = Date.now()): boolean {
    const rawSession = localStorage.getItem(USER_KEY);

    if (!rawSession) {
        return false;
    }

    try {
        const session = JSON.parse(rawSession) as { expiresAt?: string };

        if (!session?.expiresAt) {
            return false;
        }

        return new Date(session.expiresAt).getTime() < now;
    } catch {
        // A session we cannot parse is not a session we can trust
        return true;
    }
}

export function shouldTerminateSession(status: number | undefined): boolean {
    if (!localStorage.getItem(USER_KEY)) {
        return false;
    }

    if (status === 401) {
        return true;
    }

    return status === 403;
}

function terminateSession(): void {
    localStorage.removeItem(USER_KEY);

    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.assign("/login");
    }
}

/**
 * Registers the session handling response interceptor on an axios instance.
 */
export function registerSessionExpiryInterceptor(axiosInstance: AxiosInstance): void {
    axiosInstance.interceptors.response.use(
        (response) => response,
        (error: AxiosError) => {
            if (shouldTerminateSession(error.response?.status)) {
                terminateSession();
            }

            return Promise.reject(error);
        }
    );
}
