import {isSessionExpired, shouldTerminateSession} from "../services/sessionExpiryInterceptor";

/**
 * OWASP A07:2025 / A10:2025.
 *
 * The application mirrors the session into `localStorage` for UX purposes. Without an axios response
 * interceptor an expired or revoked session left the UI believing the user was still signed in while every
 * request failed. These tests pin the decision logic: a 401 always ends the session, a 403 only does so when
 * the stored session has genuinely expired, because 403 is also the ordinary "you lack this permission"
 * answer and must not log people out mid-session.
 */
describe("OWASP A07: client session termination logic", () => {
    const future = () => new Date(Date.now() + 60_000).toISOString();
    const past = () => new Date(Date.now() - 60_000).toISOString();

    beforeEach(() => localStorage.clear());

    it("ends the session on 401 when a session is stored", () => {
        localStorage.setItem("user", JSON.stringify({id: 1, expiresAt: future()}));

        expect(shouldTerminateSession(401)).toBe(true);
    });

    it("does nothing on 401 when no session is stored", () => {
        expect(shouldTerminateSession(401)).toBe(false);
    });

    it("does not end a live session on a permission denial", () => {
        localStorage.setItem("user", JSON.stringify({id: 1, expiresAt: future()}));

        expect(shouldTerminateSession(403)).toBe(false);
    });

    it("ends an expired session on 403", () => {
        localStorage.setItem("user", JSON.stringify({id: 1, expiresAt: past()}));

        expect(shouldTerminateSession(403)).toBe(true);
    });

    it("ignores successful and unrelated statuses", () => {
        localStorage.setItem("user", JSON.stringify({id: 1, expiresAt: past()}));

        expect(shouldTerminateSession(200)).toBe(false);
        expect(shouldTerminateSession(404)).toBe(false);
        expect(shouldTerminateSession(500)).toBe(false);
        expect(shouldTerminateSession(undefined)).toBe(false);
    });

    it("treats an unparseable stored session as expired", () => {
        localStorage.setItem("user", "{not json");

        expect(isSessionExpired()).toBe(true);
    });

    it("treats a session without an expiry as live", () => {
        localStorage.setItem("user", JSON.stringify({id: 1}));

        expect(isSessionExpired()).toBe(false);
    });

    it("reports no expiry when nothing is stored", () => {
        expect(isSessionExpired()).toBe(false);
    });
});
