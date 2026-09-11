import Axios from "axios";
import MockAdapter from "axios-mock-adapter";
import {isSessionExpired, registerSessionExpiryInterceptor, shouldTerminateSession} from "../services/sessionExpiryInterceptor";

/**
 * OWASP A07:2025 / A10:2025.
 *
 * The application mirrors the session into `localStorage` for UX purposes. Without an axios response
 * interceptor an expired or revoked session left the UI believing the user was still signed in while every
 * request failed. These tests pin the decision logic and the Axios integration.
 */
describe("OWASP A07: client session termination logic", () => {
    const future = () => new Date(Date.now() + 60_000).toISOString();
    const past = () => new Date(Date.now() - 60_000).toISOString();

    beforeEach(() => {
        localStorage.clear();
        window.history.replaceState({}, "", "/login");
    });

    it("ends the session on 401 when a session is stored", () => {
        localStorage.setItem("user", JSON.stringify({id: 1, expiresAt: future()}));

        expect(shouldTerminateSession(401)).toBe(true);
    });

    it("does nothing on 401 when no session is stored", () => {
        expect(shouldTerminateSession(401)).toBe(false);
    });

    it("ends a live session on 403", () => {
        localStorage.setItem("user", JSON.stringify({id: 1, expiresAt: future()}));

        expect(shouldTerminateSession(403)).toBe(true);
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

    it("checks an expiry timestamp against the supplied current time", () => {
        localStorage.setItem("user", JSON.stringify({expiresAt: "2026-09-11T12:00:00.000Z"}));

        expect(isSessionExpired(Date.parse("2026-09-11T12:01:00.000Z"))).toBe(true);
        expect(isSessionExpired(Date.parse("2026-09-11T11:59:00.000Z"))).toBe(false);
    });

    it("passes successful Axios responses through unchanged", async () => {
        const axiosInstance = Axios.create();
        const mock = new MockAdapter(axiosInstance);
        registerSessionExpiryInterceptor(axiosInstance);
        mock.onGet("/public").reply(200, {ok: true});

        await expect(axiosInstance.get("/public")).resolves.toMatchObject({
            data: {ok: true}
        });

        mock.restore();
    });

    it("removes the stored session when an Axios request receives 403", async () => {
        localStorage.setItem("user", JSON.stringify({id: 1, expiresAt: future()}));
        const axiosInstance = Axios.create();
        const mock = new MockAdapter(axiosInstance);
        registerSessionExpiryInterceptor(axiosInstance);
        mock.onGet("/protected").reply(403);

        await expect(axiosInstance.get("/protected")).rejects.toMatchObject({
            response: {status: 403}
        });

        expect(localStorage.getItem("user")).toBeNull();
        mock.restore();
    });

});
