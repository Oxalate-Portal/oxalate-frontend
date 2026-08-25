import {act} from "react";
import {createRoot, type Root} from "react-dom/client";
import {SessionProvider} from "../session/SessionProvider";
import {useSession} from "../session/useSession";
import {authAPI, portalConfigurationAPI} from "../services";
import {ActionResultEnum, PortalConfigGroupEnum} from "../models";

function Probe() {
    const session = useSession();
    return <div>
        <output data-testid="state">{session.userSession?.language || "anonymous"}</output>
        <output data-testid="frontend">{session.getFrontendConfigurationValue("enabled-language")}</output>
        <output data-testid="portal">{session.getPortalConfigurationValue(PortalConfigGroupEnum.GENERAL, "welcome")}</output>
        <output data-testid="timezone">{session.getPortalTimezone()}</output>
        <button onClick={() => void session.loginUser({username: "user", password: "password"})}>login</button>
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
            {groupKey: "general", settingKey: "welcome", runtimeValue: null, valueType: "text", defaultValue: "Welcome"}
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
                .mockResolvedValueOnce([{groupKey: "general", settingKey: "welcome", runtimeValue: "Hi", valueType: "text", defaultValue: "Welcome"}] as never)
                .mockResolvedValueOnce("invalid" as never);
        await renderProvider();

        await act(async () => (container.querySelector("button") as HTMLButtonElement).click());
        expect(container.querySelector("[data-testid=state]")?.textContent).toBe("fi");
        expect(localStorage.getItem("user")).toContain('"language":"fi"');

        await act(async () => (container.querySelector("button:nth-of-type(2)") as HTMLButtonElement).click());
        expect(localStorage.getItem("user")).toBeNull();
        expect(ActionResultEnum.SUCCESS).toBeDefined();
    });
});
