import {AbstractAPI} from "../services/AbstractAPI";
import {authAPI, downloadAPI, emailNotificationSubscriptionAPI, fileTransferAPI, portalConfigurationAPI} from "../services";
import MockAdapter from "axios-mock-adapter";

interface AxiosBackedService {
    axiosInstance: {
        defaults: {
            baseURL?: string;
        };
    };
}

class TestAPI extends AbstractAPI<{ id: number }, { id: number }> {
}

describe("service API base URLs", () => {
    const globalWithApi = globalThis as { __OXALATE_API_URL__?: string };
    const originalGlobalApiUrl = globalWithApi.__OXALATE_API_URL__;

    afterEach(() => {
        globalWithApi.__OXALATE_API_URL__ = originalGlobalApiUrl;
    });

    it("constructs service URLs from VITE_APP_API_URL", () => {
        const expectedBaseUrl = process.env.VITE_APP_API_URL ?? "";
        const services: AxiosBackedService[] = [
            authAPI as unknown as AxiosBackedService,
            downloadAPI as unknown as AxiosBackedService,
            emailNotificationSubscriptionAPI as unknown as AxiosBackedService,
            fileTransferAPI as unknown as AxiosBackedService,
            portalConfigurationAPI as unknown as AxiosBackedService,
            new TestAPI("/test") as unknown as AxiosBackedService
        ];

        services.forEach((service) => {
            expect(service.axiosInstance.defaults.baseURL).toBeDefined();
            expect(service.axiosInstance.defaults.baseURL?.startsWith(expectedBaseUrl)).toBe(true);
        });
    });

    it("updates base URL dynamically when runtime API URL changes", async () => {
        const mock = new MockAdapter((portalConfigurationAPI as unknown as AxiosBackedService).axiosInstance as never);
        globalWithApi.__OXALATE_API_URL__ = "http://localhost:9999/api";
        mock.onGet("/frontend").reply(200, []);

        await portalConfigurationAPI.getFrontendConfiguration();

        expect((portalConfigurationAPI as unknown as AxiosBackedService).axiosInstance.defaults.baseURL)
            .toBe("http://localhost:9999/api/configurations");

        mock.restore();
    });
});


