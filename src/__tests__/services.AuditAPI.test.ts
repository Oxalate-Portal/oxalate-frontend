import {auditAPI} from "../services";
import MockAdapter from "axios-mock-adapter";

describe("AuditAPI", () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(auditAPI["axiosInstance"]);
    });

    afterEach(() => {
        mock.reset();
    });

    it("should collect all audit entries through the pages", async () => {
        mock.onGet("").reply(200, {
            content: [{id: 1, action: "CREATE"}, {id: 2, action: "UPDATE"}],
            page: 0, size: 200, total_elements: 2, total_pages: 1, first: true, last: true, empty: false
        });

        const result = await auditAPI.findAll();
        expect(result).toEqual([{id: 1, action: "CREATE"}, {id: 2, action: "UPDATE"}]);
        expect(mock.history.get).toHaveLength(1);
    });

    it("should find audit entry by id", async () => {
        const mockResponse = {id: 1, action: "CREATE", timestamp: "2024-01-01"};
        mock.onGet("/1").reply(200, mockResponse);

        const result = await auditAPI.findById(1, null);
        expect(result).toEqual(mockResponse);
    });

    it("should find a page of audit entries searched on the chosen column", async () => {
        const mockResponse = {
            content: [{id: 1, user_name: "ada", created_at: "2024-01-01T10:00:00Z"}],
            page: 1, size: 10, total_elements: 11, total_pages: 2, first: false, last: true, empty: false
        };
        mock.onGet("").reply(200, mockResponse);

        const result = await auditAPI.findPagedAudits({
            page: 1,
            size: 10,
            sort_by: "created_at",
            direction: "DESC",
            search: "ada",
            case_sensitive: true
        }, "user_name");

        expect(mock.history.get[0]?.params).toEqual({
            page: 1, size: 10, sort_by: "created_at", direction: "DESC", search: "ada", case_sensitive: true, filter_column: "user_name"
        });
        expect(result.total_elements).toBe(11);
        expect(result.content[0]).toEqual(expect.objectContaining({id: 1, user_name: "ada"}));
    });

    it("should omit the filter column when none is chosen and page a single user's audit entries", async () => {
        mock.onGet("").reply(200, {content: [], page: 0, size: 10, total_elements: 0, total_pages: 0, first: true, last: true, empty: true});
        mock.onGet("/7").reply(200, {content: [{id: 3}], page: 0, size: 10, total_elements: 1, total_pages: 1, first: true, last: true, empty: false});

        await auditAPI.findPagedAudits({page: 0, size: 10});
        const userPage = await auditAPI.findPagedByUserId(7, {page: 0, size: 10, sort_by: "created_at", direction: "DESC"});

        expect(mock.history.get[0]?.params).toEqual({page: 0, size: 10});
        expect(mock.history.get[1]?.url).toBe("/7");
        expect(mock.history.get[1]?.params).toEqual({page: 0, size: 10, sort_by: "created_at", direction: "DESC"});
        expect(userPage.content).toEqual([{id: 3}]);
    });
});

