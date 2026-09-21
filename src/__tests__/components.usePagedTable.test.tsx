import {act, render, screen, waitFor} from "@testing-library/react";
import type {TablePaginationConfig} from "antd";
import type {SorterResult} from "antd/es/table/interface";
import {useEffect} from "react";
import {type PagedTableState, sorterFieldName, toPagedRequest, usePagedTable, type UsePagedTableOptions} from "../components";
import type {PagedRequest, PagedResponse} from "../models";

const mockMessage = {error: jest.fn(), success: jest.fn()};
const mockT = jest.fn((key: string, options?: Record<string, unknown>) => options ? `${key}:${JSON.stringify(options)}` : key);

jest.mock("react-i18next", () => ({useTranslation: () => ({t: mockT})}));
jest.mock("antd", () => {
    const actual = jest.requireActual("antd");
    return {
        ...actual,
        message: {...actual.message, useMessage: () => [mockMessage, <span key="holder">holder</span>]}
    };
});

interface Row {
    id: number;
    name: string;
}

function page(rows: Row[], total = rows.length, pageNumber = 0): PagedResponse<Row> {
    return {content: rows, page: pageNumber, size: 10, total_elements: total, total_pages: 1, first: pageNumber === 0, last: true, empty: rows.length === 0};
}

// The most recent hook state, published from an effect so that the test can drive the hook's callbacks.
const captured: { latest?: PagedTableState<Row> } = {};
const latestState = () => captured.latest!;

function Harness({fetcher, options}: { fetcher: (request: PagedRequest) => Promise<PagedResponse<Row>>; options?: UsePagedTableOptions }) {
    const state = usePagedTable<Row>(fetcher, options);

    useEffect(() => {
        captured.latest = state;
    });

    return (
        <div>
            {state.contextHolder}
            <span data-testid="loading">{String(state.loading)}</span>
            <span data-testid="error">{String(state.error)}</span>
            <span data-testid="rows">{state.dataSource.map((row) => row.name).join(",")}</span>
            <span data-testid="current">{String(state.pagination.current)}</span>
            <span data-testid="total">{String(state.pagination.total)}</span>
        </div>
    );
}

const sorter = (field: string | undefined, order: "ascend" | "descend" | undefined): SorterResult<Row> =>
    ({field, order, column: undefined, columnKey: field}) as SorterResult<Row>;

describe("usePagedTable", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("fetches the first page with the defaults and exposes the page as table state", async () => {
        const fetcher = jest.fn().mockResolvedValue(page([{id: 1, name: "Ada"}], 42));

        render(<Harness fetcher={fetcher} options={{defaultSortBy: "name", defaultDirection: "DESC", defaultPageSize: 25}}/>);

        expect(screen.getByTestId("loading")).toHaveTextContent("true");
        await waitFor(() => expect(screen.getByTestId("rows")).toHaveTextContent("Ada"));
        expect(fetcher).toHaveBeenCalledTimes(1);
        expect(fetcher).toHaveBeenCalledWith({page: 0, size: 25, sort_by: "name", direction: "DESC"});
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
        expect(screen.getByTestId("total")).toHaveTextContent("42");
        expect(screen.getByTestId("current")).toHaveTextContent("1");
        expect(latestState().pagination.pageSize).toBe(25);
        expect(latestState().pagination.showSizeChanger).toBe(true);
        expect(latestState().pagination.pageSizeOptions).toEqual(["5", "10", "25", "50", "100"]);
        expect(latestState().error).toBe(false);
    });

    it("uses ASC when only a default sort column is given and no sort when none is given", async () => {
        const fetcher = jest.fn().mockResolvedValue(page([]));

        const {unmount} = render(<Harness fetcher={fetcher} options={{defaultSortBy: "id"}}/>);
        await waitFor(() => expect(fetcher).toHaveBeenCalledWith({page: 0, size: 10, sort_by: "id", direction: "ASC"}));
        unmount();

        render(<Harness fetcher={fetcher}/>);
        await waitFor(() => expect(fetcher).toHaveBeenLastCalledWith({page: 0, size: 10, sort_by: undefined, direction: undefined}));
    });

    it("maps the table change to the request: page is 0-based, sorter becomes sortBy/direction and filters become column searches", async () => {
        const fetcher = jest.fn().mockResolvedValue(page([{id: 1, name: "Ada"}], 30));
        render(<Harness fetcher={fetcher}/>);
        await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

        act(() => latestState().handleTableChange({current: 3, pageSize: 10}, {name: ["ignored"]}, sorter(undefined, undefined), {
            currentDataSource: [],
            action: "paginate"
        }));
        await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
        expect(fetcher).toHaveBeenLastCalledWith({
            page: 2,
            size: 10,
            sort_by: undefined,
            direction: undefined,
            search: "ignored",
            case_sensitive: false,
            filter_column: "name"
        });
        expect(screen.getByTestId("current")).toHaveTextContent("3");

        act(() => latestState().handleTableChange({current: 3, pageSize: 10}, {}, sorter("name", "descend"), {currentDataSource: [], action: "sort"}));
        await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(3));
        // Sorting returns to the first page
        expect(fetcher).toHaveBeenLastCalledWith({page: 0, size: 10, sort_by: "name", direction: "DESC"});

        act(() => latestState().handleTableChange({current: 2, pageSize: 10}, {}, [sorter("name", "ascend")], {currentDataSource: [], action: "sort"}));
        await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(4));
        expect(fetcher).toHaveBeenLastCalledWith({page: 0, size: 10, sort_by: "name", direction: "ASC"});

        act(() => latestState().handleTableChange({current: 2, pageSize: 10}, {}, sorter("name", "ascend"), {currentDataSource: [], action: "paginate"}));
        await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(5));
        expect(fetcher).toHaveBeenLastCalledWith({page: 1, size: 10, sort_by: "name", direction: "ASC"});

        // Changing the page size also returns to the first page
        act(() => latestState().handleTableChange({current: 2, pageSize: 50}, {}, sorter("name", "ascend"), {currentDataSource: [], action: "paginate"}));
        await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(6));
        expect(fetcher).toHaveBeenLastCalledWith({page: 0, size: 50, sort_by: "name", direction: "ASC"});

        // Clearing the sort drops sortBy and direction
        act(() => latestState().handleTableChange({current: 1, pageSize: 50}, {}, sorter("name", undefined), {currentDataSource: [], action: "sort"}));
        await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(7));
        expect(fetcher).toHaveBeenLastCalledWith({page: 0, size: 50, sort_by: undefined, direction: undefined});
    });

    it("sends the trimmed search text with the case sensitivity and returns to the first page", async () => {
        const fetcher = jest.fn().mockResolvedValue(page([{id: 1, name: "Ada"}], 30));
        render(<Harness fetcher={fetcher}/>);
        await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

        act(() => latestState().handleTableChange({current: 3, pageSize: 10}, {}, sorter(undefined, undefined), {currentDataSource: [], action: "paginate"}));
        await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));

        act(() => latestState().setSearch("  ada  "));
        await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(3));
        expect(fetcher).toHaveBeenLastCalledWith({page: 0, size: 10, sort_by: undefined, direction: undefined, search: "ada", case_sensitive: false});
        expect(latestState().search).toBe("  ada  ");

        act(() => latestState().setCaseSensitive(true));
        await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(4));
        expect(fetcher).toHaveBeenLastCalledWith({page: 0, size: 10, sort_by: undefined, direction: undefined, search: "ada", case_sensitive: true});
        expect(latestState().caseSensitive).toBe(true);

        // An empty search omits both the text and the flag
        act(() => latestState().setSearch(""));
        await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(5));
        expect(fetcher).toHaveBeenLastCalledWith({page: 0, size: 10, sort_by: undefined, direction: undefined});
    });

    it("reloads the current page on demand and when a dependency changes, and never fetches while disabled", async () => {
        const fetcher = jest.fn().mockResolvedValue(page([{id: 1, name: "Ada"}]));
        const {rerender} = render(<Harness fetcher={fetcher} options={{deps: [7], enabled: false}}/>);

        await act(async () => {
            await Promise.resolve();
        });
        expect(fetcher).not.toHaveBeenCalled();
        expect(screen.getByTestId("loading")).toHaveTextContent("false");

        rerender(<Harness fetcher={fetcher} options={{deps: [7], enabled: true}}/>);
        await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

        rerender(<Harness fetcher={fetcher} options={{deps: [8], enabled: true}}/>);
        await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));

        act(() => latestState().reload());
        await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(3));
        expect(fetcher).toHaveBeenLastCalledWith({page: 0, size: 10, sort_by: undefined, direction: undefined});
    });

    it("shows a translated message, logs a generic error and flags the error when the fetch fails", async () => {
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
        const failure = Object.assign(new Error("boom"), {response: {data: {token: "secret"}}});
        const fetcher = jest.fn().mockRejectedValueOnce(failure).mockResolvedValue(page([{id: 2, name: "Grace"}]));

        render(<Harness fetcher={fetcher}/>);

        await waitFor(() => expect(screen.getByTestId("error")).toHaveTextContent("true"));
        expect(mockMessage.error).toHaveBeenCalledWith("common.table.loadError");
        expect(consoleError).toHaveBeenCalledTimes(1);
        expect(consoleError.mock.calls[0]).toHaveLength(1);
        expect(String(consoleError.mock.calls[0][0])).not.toContain("secret");
        expect(screen.getByTestId("loading")).toHaveTextContent("false");

        act(() => latestState().reload());
        await waitFor(() => expect(screen.getByTestId("rows")).toHaveTextContent("Grace"));
        expect(screen.getByTestId("error")).toHaveTextContent("false");
        consoleError.mockRestore();
    });

    it("reports load errors through the screen's message API and renders no holder of its own when one is given", async () => {
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
        const screenMessageApi = {error: jest.fn(), success: jest.fn()} as unknown as NonNullable<UsePagedTableOptions["messageApi"]>;
        const fetcher = jest.fn().mockRejectedValue(new Error("boom"));

        render(<Harness fetcher={fetcher} options={{messageApi: screenMessageApi}}/>);

        await waitFor(() => expect(screen.getByTestId("error")).toHaveTextContent("true"));
        expect(screenMessageApi.error).toHaveBeenCalledWith("common.table.loadError");
        expect(mockMessage.error).not.toHaveBeenCalled();
        expect(screen.queryByText("holder")).toBeNull();
        consoleError.mockRestore();
    });

    it("ignores the response of a request that was superseded", async () => {
        let resolveFirst: (value: PagedResponse<Row>) => void = () => undefined;
        const fetcher = jest.fn()
            .mockImplementationOnce(() => new Promise<PagedResponse<Row>>((resolve) => {
                resolveFirst = resolve;
            }))
            .mockResolvedValue(page([{id: 2, name: "Second"}], 1, 1));

        render(<Harness fetcher={fetcher}/>);
        await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

        act(() => latestState().handleTableChange({current: 2, pageSize: 10}, {}, sorter(undefined, undefined), {currentDataSource: [], action: "paginate"}));
        await waitFor(() => expect(screen.getByTestId("rows")).toHaveTextContent("Second"));

        await act(async () => {
            resolveFirst(page([{id: 1, name: "Stale"}]));
            await Promise.resolve();
        });
        expect(screen.getByTestId("rows")).toHaveTextContent("Second");
    });

    it("renders the translated total with the visible range", async () => {
        const fetcher = jest.fn().mockResolvedValue(page([{id: 1, name: "Ada"}], 42));
        render(<Harness fetcher={fetcher}/>);
        await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

        const showTotal = (latestState().pagination as Required<TablePaginationConfig>).showTotal;
        expect(showTotal(42, [1, 10])).toBe('common.table.pagination.total:{"from":1,"to":10,"total":42}');
    });
});

describe("usePagedTable helpers", () => {
    it("derives the sortBy column from the sorter field or column key", () => {
        expect(sorterFieldName(undefined)).toBeUndefined();
        expect(sorterFieldName(sorter("name", "ascend"))).toBe("name");
        expect(sorterFieldName({field: ["organizer", "last_name"], order: "ascend"} as SorterResult<Row>)).toBe("organizer.last_name");
        expect(sorterFieldName({columnKey: "created", order: "ascend"} as SorterResult<Row>)).toBe("created");
        expect(sorterFieldName({order: "ascend"} as SorterResult<Row>)).toBeUndefined();
    });

    it("builds the request from the query and only sends the case flag with a search text", () => {
        expect(toPagedRequest({page: 1, size: 5, sortBy: "id", direction: "ASC", search: " x ", caseSensitive: true}))
            .toEqual({page: 1, size: 5, sort_by: "id", direction: "ASC", search: "x", case_sensitive: true});
        expect(toPagedRequest({page: 0, size: 5, search: "   ", caseSensitive: true}))
            .toEqual({page: 0, size: 5, sort_by: undefined, direction: undefined});
    });
});
