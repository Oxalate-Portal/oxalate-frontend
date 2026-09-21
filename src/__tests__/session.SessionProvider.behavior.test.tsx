import {act} from "react";
import {createRoot, type Root} from "react-dom/client";
import {SessionProvider, useSession} from "../session";
import {authAPI, portalConfigurationAPI} from "../services";
import {ActionResultEnum, PortalConfigGroupEnum} from "../models";

function Probe() {
    const session = useSession();
    return <div>
        <output data-testid="state">{session.userSession?.language || "anonymous"}</output>
        <output data-testid="frontend">{session.getFrontendConfigurationValue("enabled-language")}</output>
        <output data-testid="portal">{session.getPortalConfigurationValue(PortalConfigGroupEnum.GENERAL, "welcome")}</output>
        <output data-testid="enum">{session.getPortalConfigurationValue(PortalConfigGroupEnum.GENERAL, "mode")}</output>
        <output data-testid="portal-count">{session.getPortalConfiguration().length}</output>
        <output data-testid="timezone">{session.getPortalTimezone()}</output>
        <button onClick={() => void session.loginUser({username: "user", password: "password", recaptcha_token: null})}>login</button>
        <button onClick={() => session.logoutUser()}>logout</button>
        <button onClick={() => session.setSessionLanguage("sv")}>language</button>
        <button onClick={() => session.refreshUserSession({language: "fi"} as never)}>refresh</button>
    </div>;
}

describe("SessionProvider interactions", () => {
    let root: Root;
    let container: HTMLDivElement;

    beforeEach(() => {
        localStorage.clear();
        jest.restoreAllMocks();
        container = document.createElement("div");
        document.body.appendChild(container);
        jest.spyOn(portalConfigurationAPI, "getFrontendConfiguration").mockResolvedValue([
            {key: "enabled-language", value: "en,fi,sv"},
            {key: "org-name", value: "Test Portal"},
            {key: "timezone", value: "Europe/Helsinki"}
        ] as never);
        jest.spyOn(portalConfigurationAPI, "findAllPortalConfigurations").mockResolvedValue([
            {group_key: "general", setting_key: "welcome", runtime_value: null, value_type: "text", default_value: "Welcome"}
        ] as never);
    });

    afterEach(() => {
        act(() => root?.unmount());
        container.remove();
    });

    async function renderProvider() {
        await act(async () => {
            root = createRoot(container);
            root.render(<SessionProvider><Probe/></SessionProvider>);
            await Promise.resolve();
            await Promise.resolve();
        });
    }

    it("loads supported language and portal settings and updates language", async () => {
        localStorage.setItem("user", JSON.stringify({language: "en", roles: []}));
        await renderProvider();
        expect(container.querySelector("[data-testid=frontend]")?.textContent).toBe("en,fi,sv");
        expect(container.querySelector("[data-testid=portal]")?.textContent).toBe("Welcome");
        expect(container.querySelector("[data-testid=timezone]")?.textContent).toBe("Europe/Helsinki");

        await act(async () => (container.querySelector("button:nth-of-type(3)") as HTMLButtonElement).click());
        expect(localStorage.getItem("language")).toBe("sv");
    });

    it("returns login failure when authentication fails", async () => {
        jest.spyOn(authAPI, "login").mockRejectedValue(new Error("invalid credentials"));
        await renderProvider();
        await act(async () => (container.querySelector("button") as HTMLButtonElement).click());
        expect(container.querySelector("[data-testid=state]")?.textContent).toBe("anonymous");
    });

    it("logs in, refreshes and logs out while reporting configuration failures", async () => {
        jest.spyOn(authAPI, "login").mockResolvedValue({language: "fi", roles: []} as never);
        jest.spyOn(authAPI, "logout").mockResolvedValue(undefined as never);
        jest.spyOn(portalConfigurationAPI, "findAllPortalConfigurations")
            .mockResolvedValueOnce([{group_key: "general", setting_key: "welcome", runtime_value: "Hi", value_type: "text", default_value: "Welcome"}] as never)
                .mockResolvedValueOnce("invalid" as never);
        await renderProvider();

        await act(async () => (container.querySelector("button") as HTMLButtonElement).click());
        expect(container.querySelector("[data-testid=state]")?.textContent).toBe("fi");
        expect(localStorage.getItem("user")).toContain('"language":"fi"');

        await act(async () => (container.querySelector("button:nth-of-type(2)") as HTMLButtonElement).click());
        expect(localStorage.getItem("user")).toBeNull();
        expect(ActionResultEnum.SUCCESS).toBeDefined();
    });

    it("uses stored language and enum defaults and handles initialization failures", async () => {
        localStorage.setItem("language", "sv");
        localStorage.setItem("user", JSON.stringify({language: "sv", roles: []}));
        jest.spyOn(portalConfigurationAPI, "getFrontendConfiguration").mockResolvedValue([
            {key: "default-language", value: "fi"},
            {key: "org-name", value: "Configured Portal"},
            {key: "timezone", value: "UTC"}
        ] as never);
        jest.spyOn(portalConfigurationAPI, "findAllPortalConfigurations").mockRejectedValue(new Error("portal unavailable"));
        const warning = jest.spyOn(console, "warn").mockImplementation(() => undefined);
        await renderProvider();
        expect(container.querySelector("[data-testid=enum]")?.textContent).toBe("");
        expect(container.querySelector("[data-testid=portal-count]")?.textContent).toBe("0");
        expect(localStorage.getItem("language")).toBe("sv");
        expect(warning).toHaveBeenCalledWith("Failed to fetch portal configurations during initialization");
    });

    it("reports login configuration failure and clears session when logout fails", async () => {
        jest.spyOn(authAPI, "login").mockResolvedValue({language: "fi", roles: []} as never);
        jest.spyOn(authAPI, "logout").mockRejectedValue(new Error("logout unavailable"));
        jest.spyOn(portalConfigurationAPI, "findAllPortalConfigurations").mockResolvedValue("invalid" as never);
        const error = jest.spyOn(console, "error").mockImplementation(() => undefined);
        await renderProvider();

        await act(async () => (container.querySelector("button") as HTMLButtonElement).click());
        expect(localStorage.getItem("user")).toContain('"language":"fi"');
        await act(async () => (container.querySelector("button:nth-of-type(2)") as HTMLButtonElement).click());
        expect(localStorage.getItem("user")).toBeNull();
        expect(error).toHaveBeenCalledWith("Failed to log out user", expect.any(Error));
    });
});
