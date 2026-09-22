import {act} from "react";
import {createRoot, type Root} from "react-dom/client";
import {readStoredSession, SessionProvider, useSession} from "../session";
import {portalConfigurationAPI} from "../services";

function FrontendConfigProbe() {
    const {getFrontendConfigurationValue, organizationName, portalTimezone, sessionLanguage} = useSession();

    return (
        <div>
            <div data-testid="enabled-language">{getFrontendConfigurationValue("enabled-language") || "missing"}</div>
            <div data-testid="session-language">{sessionLanguage}</div>
            <div data-testid="organization-name">{organizationName}</div>
            <div data-testid="portal-timezone">{portalTimezone}</div>
        </div>
    );
}

describe("SessionProvider", () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        localStorage.clear();
        jest.restoreAllMocks();
        container = document.createElement("div");
        document.body.appendChild(container);
    });

    afterEach(() => {
        act(() => {
            root?.unmount();
        });
        container.remove();
    });

    it("keeps rendering when frontend configuration payload is not an array", async () => {
        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

        jest.spyOn(portalConfigurationAPI, "getFrontendConfiguration")
            .mockResolvedValue("malformed frontend configuration response" as unknown as { key: string, value: string }[]);

        await act(async () => {
            root = createRoot(container);
            root.render(
                <SessionProvider>
                    <FrontendConfigProbe/>
                </SessionProvider>
            );
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(container.querySelector('[data-testid="enabled-language"]')?.textContent).toBe("missing");
        expect(container.querySelector('[data-testid="session-language"]')?.textContent).toBe("en");
        expect(container.querySelector('[data-testid="organization-name"]')?.textContent).toBe("Oxalate Portal");
        expect(container.querySelector('[data-testid="portal-timezone"]')?.textContent).toBe("UTC");
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            "Expected frontend configurations to be an array but received:",
            "malformed frontend configuration response"
        );
    });
});


describe("readStoredSession", () => {
    it("returns the parsed session when it uses the current snake_case shape", () => {
        const session = readStoredSession(JSON.stringify({id: 1, expires_at: "2030-01-01T00:00:00Z", approved_terms: true, roles: []}));
        expect(session?.expires_at).toBe("2030-01-01T00:00:00Z");
    });

    it("discards a session stored before the snake_case wire format", () => {
        expect(readStoredSession(JSON.stringify({id: 1, expiresAt: "2030-01-01T00:00:00Z", approvedTerms: true}))).toBeNull();
        expect(readStoredSession(JSON.stringify({id: 1, accessToken: "x"}))).toBeNull();
    });

    it("discards missing, malformed or non-object values", () => {
        expect(readStoredSession(null)).toBeNull();
        expect(readStoredSession("{not json")).toBeNull();
        expect(readStoredSession("42")).toBeNull();
        expect(readStoredSession("null")).toBeNull();
    });
});
