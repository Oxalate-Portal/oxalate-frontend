import {AbstractAPI} from "../services";
import MockAdapter from "axios-mock-adapter";

interface TestRequest {
    id: number;
    name: string;
}

interface TestResponse {
    id: number;
    name: string;
}

class TestAPI extends AbstractAPI<TestRequest, TestResponse> {
}

describe("AbstractAPI", () => {
    let api: TestAPI;
    let mock: MockAdapter;
    const globalWithApi = globalThis as { __OXALATE_API_URL__?: string };
    const originalGlobalApiUrl = globalWithApi.__OXALATE_API_URL__;

    beforeEach(() => {
        api = new TestAPI("/test");
        mock = new MockAdapter(api["axiosInstance"]);
    });

    afterEach(() => {
        mock.reset();
        globalWithApi.__OXALATE_API_URL__ = originalGlobalApiUrl;
    });

    describe("findAll", () => {
        it("should use updated runtime API base URL for requests", async () => {
            globalWithApi.__OXALATE_API_URL__ = "http://localhost:9999/api";
            mock.onGet("").reply(200, []);

            await api.findAll();

            expect(mock.history.get[0]?.baseURL).toBe("http://localhost:9999/api/test");
        });

        it("should retrieve all items", async () => {
            const mockData: TestResponse[] = [
                {id: 1, name: "Item 1"},
                {id: 2, name: "Item 2"}
            ];

            mock.onGet("").reply(200, mockData);

            const result = await api.findAll();

            expect(result).toEqual(mockData);
        });

        it("should retrieve items with params", async () => {
            const mockData: TestResponse[] = [{id: 1, name: "Filtered Item"}];
            const params = {search: "test"};

            mock.onGet("", {params}).reply(200, mockData);

            const result = await api.findAll(params);

            expect(result).toEqual(mockData);
        });
    });

    describe("findPaged", () => {
        const page = {
            content: [{id: 1, name: "Item 1", created_at: "2026-01-01T10:00:00Z"}],
            page: 0,
            size: 10,
            total_elements: 1,
            total_pages: 1,
            first: true,
            last: true,
            empty: false
        };

        it("sends the request fields as query parameters and omits undefined and empty values", async () => {
            mock.onGet("").reply(200, page);

            const result = await api.findPaged({page: 2, size: 25, sort_by: "name", direction: "DESC", search: "  ", case_sensitive: undefined});

            expect(mock.history.get[0]?.params).toEqual({page: 2, size: 25, sort_by: "name", direction: "DESC"});
            expect(result.total_elements).toBe(1);
            expect(result.last).toBe(true);
            expect(result.content[0]).toEqual(expect.objectContaining({id: 1, name: "Item 1"}));
        });

        it("adds the search, case sensitivity and extra parameters and hits the given path", async () => {
            mock.onGet("/past").reply(200, page);

            await api.findPaged({page: 0, size: 10, search: "dive", case_sensitive: true}, {event_id: 12, creatorId: undefined}, "/past");

            expect(mock.history.get[0]?.url).toBe("/past");
            expect(mock.history.get[0]?.params).toEqual({page: 0, size: 10, search: "dive", case_sensitive: true, event_id: 12});
        });

        it("converts the temporal fields of every item of the page", async () => {
            mock.onGet("").reply(200, page);

            const result = await api.findPaged({page: 0, size: 10});
            const item = result.content[0] as unknown as { created_at: { isValid?: () => boolean } };

            expect(typeof item.created_at.isValid).toBe("function");
        });

        it("rejects when the request fails", async () => {
            mock.onGet("").reply(500);

            await expect(api.findPaged({page: 0, size: 10})).rejects.toBeDefined();
        });
    });

    describe("findById", () => {
        it("should retrieve an item by id", async () => {
            const mockData: TestResponse = {id: 1, name: "Item 1"};

            mock.onGet("/1").reply(200, mockData);

            const result = await api.findById(1, null);

            expect(result).toEqual(mockData);
        });

        it("should retrieve an item with additional parameters", async () => {
            const mockData: TestResponse = {id: 1, name: "Item 1"};

            mock.onGet("/1?extra=param").reply(200, mockData);

            const result = await api.findById(1, "extra=param");

            expect(result).toEqual(mockData);
        });
    });

    describe("create", () => {
        it("should create a new item", async () => {
            const requestData: TestRequest = {id: 1, name: "New Item"};
            const responseData: TestResponse = {id: 1, name: "New Item"};

            mock.onPost("", requestData).reply(200, responseData);

            const result = await api.create(requestData);

            expect(result).toEqual(responseData);
        });
    });

    describe("update", () => {
        it("should update an existing item", async () => {
            const requestData: TestRequest = {id: 1, name: "Updated Item"};
            const responseData: TestResponse = {id: 1, name: "Updated Item"};

            mock.onPut("", requestData).reply(200, responseData);

            const result = await api.update(requestData);

            expect(result).toEqual(responseData);
        });
    });

    describe("delete", () => {
        it("should delete an item", async () => {
            mock.onDelete("/1").reply(204);

            await api.delete(1);

            expect(mock.history.delete).toHaveLength(1);
        });
    });
});

