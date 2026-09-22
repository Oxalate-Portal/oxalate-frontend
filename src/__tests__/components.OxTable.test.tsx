import {act, fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {Tag} from "antd";
import type {MessageInstance} from "antd/es/message/interface";
import dayjs from "dayjs";
import {createRef} from "react";
import {
    applyColumnFilters,
    CLIENT_PAGE_SIZE,
    columnFilterKind,
    compareCellValues,
    fetchAllPages,
    isActionColumn,
    isNarrowScreen,
    matchesFilterValue,
    matchesSearchText,
    type OxColumnsType,
    OxTable,
    type OxTableHandle,
    type PagedTableState,
    reduceToSingleFilter,
    renderCollapsedValue,
    splitColumnsForMobile
} from "../components";
import type {PagedResponse} from "../models";

const mockUseBreakpoint = jest.fn();

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string, options?: Record<string, unknown>) => options && "column" in options ? `${key}:${String(options.column)}` : key
    })
}));

jest.mock("antd", () => {
    const actual = jest.requireActual("antd");
    return {
        ...actual,
        Grid: {
            ...actual.Grid,
            useBreakpoint: () => mockUseBreakpoint()
        }
    };
});

interface Row {
    id: number;
    name: string;
    depth: number;
    nested: { city: string };
    active: boolean;
}

const rows: Row[] = [
    {id: 1, name: "Team Sidemount", depth: 30, nested: {city: "Helsinki"}, active: true},
    {id: 2, name: "Team Rebreather", depth: 45, nested: {city: "Turku"}, active: false}
];

const columns: OxColumnsType<Row> = [
    {title: "Name", dataIndex: "name", key: "name", mobile: true},
    {title: "Depth", dataIndex: "depth", key: "depth", render: (value: number) => <Tag>{value} m</Tag>},
    {title: "City", dataIndex: ["nested", "city"], key: "city"},
    {title: "Active", dataIndex: "active", key: "active"},
    {title: () => <span>Computed</span>, key: "computed", render: (_: unknown, record: Row) => ({children: "computed-" + record.id, props: {}})},
    {title: "Action", key: "action", render: (_: unknown, record: Row) => <button>act-{record.id}</button>}
];

const WIDE = {xs: false, sm: true, md: true, lg: true, xl: false, xxl: false};
const NARROW = {xs: true, sm: false, md: false, lg: false, xl: false, xxl: false};

describe("OxTable helpers", () => {
    it("recognises action columns by key or dataIndex", () => {
        expect(isActionColumn({key: "action"})).toBe(true);
        expect(isActionColumn({key: "Actions"})).toBe(true);
        expect(isActionColumn({dataIndex: "action"})).toBe(true);
        expect(isActionColumn({key: "comment-list-action"})).toBe(true);
        expect(isActionColumn({key: "row_actions"})).toBe(true);
        expect(isActionColumn({key: "transaction"})).toBe(false);
        expect(isActionColumn({dataIndex: ["nested", "action"]})).toBe(true);
        expect(isActionColumn({key: "name"})).toBe(false);
        expect(isActionColumn({title: "no key"})).toBe(false);
    });

    it("keeps mobile and action columns visible and collapses the rest", () => {
        const {visible, collapsed} = splitColumnsForMobile(columns);

        expect(visible.map((column) => column.key)).toEqual(["name", "action"]);
        expect(collapsed.map((column) => column.key)).toEqual(["depth", "city", "active", "computed"]);
    });

    it("falls back to the first non-action column when nothing is flagged as mobile", () => {
        const unflagged: OxColumnsType<Row> = [
            {title: "Action", key: "action"},
            {title: "Depth", dataIndex: "depth", key: "depth"},
            {title: "Name", dataIndex: "name", key: "name"}
        ];

        const {visible, collapsed} = splitColumnsForMobile(unflagged);

        expect(visible.map((column) => column.key)).toEqual(["action", "depth"]);
        expect(collapsed.map((column) => column.key)).toEqual(["name"]);
    });

    it("treats an empty or all-false breakpoint map as a wide screen", () => {
        expect(isNarrowScreen({}, "md")).toBe(false);
        expect(isNarrowScreen({xs: false, sm: false, md: false}, "md")).toBe(false);
        expect(isNarrowScreen(NARROW, "md")).toBe(true);
        expect(isNarrowScreen(WIDE, "md")).toBe(false);
        expect(isNarrowScreen({xs: false, sm: true, md: false, lg: false}, "sm")).toBe(false);
        expect(isNarrowScreen({xs: false, sm: true, md: true, lg: false}, "lg")).toBe(true);
    });

    it("renders collapsed values through the column renderer and nested data indexes", () => {
        const [, depth, city, active, computed] = columns;

        render(<div>{renderCollapsedValue(depth, rows[0], 0)}</div>);
        expect(screen.getByText("30 m")).toBeInTheDocument();
        expect(renderCollapsedValue(city, rows[0], 0)).toBe("Helsinki");
        expect(renderCollapsedValue(active, rows[1], 1)).toBe("false");
        expect(renderCollapsedValue(computed, rows[1], 1)).toBe("computed-2");
        expect(renderCollapsedValue<Row>({title: "Missing", dataIndex: ["nested", "missing", "deeper"]}, rows[0], 0)).toBe("");
        expect(renderCollapsedValue<Row>({title: "No index", key: "x"}, rows[0], 0)).toBe("");
    });
});

describe("OxTable", () => {
    beforeEach(() => {
        mockUseBreakpoint.mockReturnValue(WIDE);
    });

    it("renders every column on a wide screen", () => {
        render(<OxTable<Row> columns={columns} dataSource={rows} rowKey={"id"} pagination={false}/>);

        for (const header of ["Name", "Depth", "City", "Active", "Computed", "Action"]) {
            expect(screen.getByText(header)).toBeInTheDocument();
        }
        expect(screen.getByText("Helsinki")).toBeInTheDocument();
        expect(screen.queryByLabelText("Expand row")).toBeNull();
    });

    it("renders every column before the breakpoints are known", () => {
        mockUseBreakpoint.mockReturnValue({});

        render(<OxTable<Row> columns={columns} dataSource={rows} rowKey={"id"} pagination={false}/>);

        expect(screen.getByText("City")).toBeInTheDocument();
        expect(screen.queryByLabelText("Expand row")).toBeNull();
    });

    it("shows only the identifying and action columns on a narrow screen", () => {
        mockUseBreakpoint.mockReturnValue(NARROW);

        render(<OxTable<Row> columns={columns} dataSource={rows} rowKey={"id"} pagination={false}/>);

        expect(screen.getByText("Name")).toBeInTheDocument();
        expect(screen.getByText("Action")).toBeInTheDocument();
        expect(screen.getByText("act-1")).toBeInTheDocument();
        expect(screen.queryByText("Depth")).toBeNull();
        expect(screen.queryByText("Helsinki")).toBeNull();
        expect(screen.getAllByLabelText("Expand row")).toHaveLength(2);
    });

    it("lists the collapsed columns inside the expanded row on a narrow screen", async () => {
        mockUseBreakpoint.mockReturnValue(NARROW);

        render(<OxTable<Row> columns={columns} dataSource={rows} rowKey={"id"} pagination={false}/>);

        fireEvent.click(screen.getAllByLabelText("Expand row")[0]);

        await waitFor(() => expect(screen.getByText("Helsinki")).toBeInTheDocument());
        expect(screen.getByText("Depth")).toBeInTheDocument();
        expect(screen.getByText("30 m")).toBeInTheDocument();
        expect(screen.getByText("Computed")).toBeInTheDocument();
        expect(screen.getByText("computed-1")).toBeInTheDocument();
        expect(screen.getByText("true")).toBeInTheDocument();
    });

    it("keeps the caller's expanded row content below the collapsed columns", async () => {
        mockUseBreakpoint.mockReturnValue(NARROW);

        render(<OxTable<Row>
            columns={columns}
            dataSource={rows}
            rowKey={"id"}
            pagination={false}
            expandable={{expandedRowRender: (record) => <div>extra-{record.id}</div>}}/>);

        fireEvent.click(screen.getAllByLabelText("Expand row")[1]);

        await waitFor(() => expect(screen.getByText("extra-2")).toBeInTheDocument());
        expect(screen.getByText("Turku")).toBeInTheDocument();
    });

    it("respects the caller's rowExpandable for its own content but still lists the collapsed columns", async () => {
        mockUseBreakpoint.mockReturnValue(NARROW);

        render(<OxTable<Row>
            columns={columns}
            dataSource={rows}
            rowKey={"id"}
            pagination={false}
            expandable={{expandedRowRender: (record) => <div>extra-{record.id}</div>, rowExpandable: (record) => record.id === 1}}/>);

        fireEvent.click(screen.getAllByLabelText("Expand row")[1]);

        await waitFor(() => expect(screen.getByText("Turku")).toBeInTheDocument());
        expect(screen.queryByText("extra-2")).toBeNull();
    });

    it("uses the caller's expandable configuration unchanged on a wide screen", async () => {
        render(<OxTable<Row>
            columns={columns}
            dataSource={rows}
            rowKey={"id"}
            pagination={false}
            expandable={{expandedRowRender: (record) => <div>extra-{record.id}</div>}}/>);

        fireEvent.click(screen.getAllByLabelText("Expand row")[0]);

        await waitFor(() => expect(screen.getByText("extra-1")).toBeInTheDocument());
        expect(screen.getAllByText("Helsinki")).toHaveLength(1);
    });

    it("does not add an expandable row when every column fits on a narrow screen", () => {
        mockUseBreakpoint.mockReturnValue(NARROW);
        const compact: OxColumnsType<Row> = [
            {title: "Name", dataIndex: "name", key: "name", mobile: true},
            {title: "Action", key: "action", render: () => <button>go</button>}
        ];

        render(<OxTable<Row> columns={compact} dataSource={rows} rowKey={"id"} pagination={false}/>);

        expect(screen.queryByLabelText("Expand row")).toBeNull();
        expect(screen.getAllByText("go")).toHaveLength(2);
    });

    it("honours a custom collapse breakpoint", () => {
        mockUseBreakpoint.mockReturnValue({xs: false, sm: false, md: true, lg: false, xl: false, xxl: false});

        render(<OxTable<Row> columns={columns} dataSource={rows} rowKey={"id"} pagination={false} collapseBelow={"lg"}/>);

        expect(screen.queryByText("Depth")).toBeNull();
        expect(screen.getAllByLabelText("Expand row")).toHaveLength(2);
    });

    it("renders without columns", () => {
        mockUseBreakpoint.mockReturnValue(NARROW);

        render(<OxTable dataSource={[]} rowKey={"id"} pagination={false}/>);

        expect(document.querySelector(".ant-table")).not.toBeNull();
    });
});

/** Names of the rows currently rendered in the table body, in order. */
function renderedNames(): string[] {
    return Array.from(document.querySelectorAll("tbody tr.ant-table-row"))
        .map((row) => row.querySelector("td:not(.ant-table-row-expand-icon-cell)")?.textContent ?? "");
}

/** Opens the header filter dropdown of the column with the given title. */
function openFilterDropdown(title: string): void {
    const header = screen.getByText(title).closest("th");
    fireEvent.click(within(header as HTMLElement).getByRole("button"));
}

/** Picks an option of the Ant Design Select rendered inside the given container. */
async function selectEnumOption(container: string, label: string): Promise<void> {
    const select = document.querySelector(`${container} .ant-select`);
    fireEvent.mouseDown(select as Element);
    const option = await screen.findByText(label, {selector: ".ant-select-item-option-content"});
    fireEvent.click(option);
}

function pagedState(rows: Row[], overrides: Partial<PagedTableState<Row>> = {}): PagedTableState<Row> {
    return {
        dataSource: rows,
        loading: false,
        pagination: {current: 1, pageSize: 10, total: rows.length},
        handleTableChange: jest.fn(),
        search: "",
        setSearch: jest.fn(),
        caseSensitive: false,
        setCaseSensitive: jest.fn(),
        setFilter: jest.fn(),
        reload: jest.fn(),
        error: false,
        contextHolder: <></>,
        ...overrides
    };
}

function pageOf(rows: Row[], page: number, last: boolean): PagedResponse<Row> {
    return {
        content: rows,
        page,
        size: CLIENT_PAGE_SIZE,
        total_elements: rows.length,
        total_pages: last ? page + 1 : page + 2,
        first: page === 0,
        last,
        empty: rows.length === 0
    };
}

describe("OxTable filter and sort defaults", () => {
    it("matches enum filter values by equality, array membership and stringified booleans/numbers", () => {
        expect(matchesFilterValue("ACTIVE", "ACTIVE")).toBe(true);
        expect(matchesFilterValue("ACTIVE", "LOCKED")).toBe(false);
        expect(matchesFilterValue(["ROLE_USER", "ROLE_ADMIN"], "ROLE_ADMIN")).toBe(true);
        expect(matchesFilterValue(["ROLE_USER"], "ROLE_ADMIN")).toBe(false);
        expect(matchesFilterValue(true, "true")).toBe(true);
        expect(matchesFilterValue(false, true)).toBe(false);
        expect(matchesFilterValue(7, "7")).toBe(true);
        expect(matchesFilterValue(null, "null")).toBe(false);
        expect(matchesFilterValue(undefined, "x")).toBe(false);
    });

    it("matches search text case-insensitively as a substring", () => {
        expect(matchesSearchText("Team Sidemount", "side")).toBe(true);
        expect(matchesSearchText("Team Sidemount", "SIDE")).toBe(true);
        expect(matchesSearchText("Team Sidemount", "rebreather")).toBe(false);
        expect(matchesSearchText(42, "4")).toBe(true);
        expect(matchesSearchText(null, "")).toBe(false);
        expect(matchesSearchText("", "")).toBe(false);
    });

    it("compares numbers, strings, booleans and dates and sorts empty values last", () => {
        expect(compareCellValues(1, 2)).toBeLessThan(0);
        expect(compareCellValues(2, 1)).toBeGreaterThan(0);
        expect(compareCellValues("b", "a")).toBeGreaterThan(0);
        expect(compareCellValues("file2", "file10")).toBeLessThan(0);
        expect(compareCellValues(false, true)).toBeLessThan(0);
        expect(compareCellValues(dayjs("2026-01-02"), dayjs("2026-01-01"))).toBeGreaterThan(0);
        expect(compareCellValues(new Date("2026-01-01"), new Date("2026-01-02"))).toBeLessThan(0);
        expect(compareCellValues(null, "a")).toBeGreaterThan(0);
        expect(compareCellValues("a", undefined)).toBeLessThan(0);
        expect(compareCellValues("", null)).toBe(0);
        expect(compareCellValues({a: 1}, {b: 2})).toBe(0);
    });

    it("applies the filters of collapsed columns with table semantics", () => {
        const collapsed: OxColumnsType<Row> = [
            {title: "City", dataIndex: ["nested", "city"], key: "city", onFilter: (value, record) => matchesSearchText(record.nested.city, value)},
            {title: "Active", dataIndex: "active", key: "active", onFilter: (value, record) => matchesFilterValue(record.active, value)},
            {title: "No filter", dataIndex: "depth", key: "depth"}
        ];

        expect(applyColumnFilters(rows, collapsed, {})).toEqual(rows);
        expect(applyColumnFilters(rows, collapsed, {city: ["hel"]})).toEqual([rows[0]]);
        expect(applyColumnFilters(rows, collapsed, {city: ["hel", "tur"]})).toEqual(rows);
        expect(applyColumnFilters(rows, collapsed, {city: ["hel"], active: ["false"]})).toEqual([]);
        expect(applyColumnFilters(rows, collapsed, {depth: ["30"], active: null})).toEqual(rows);
    });

    it("keeps only the filter that changed, or the first remaining one", () => {
        expect(reduceToSingleFilter({}, {city: ["Hel"]})).toEqual({city: ["Hel"]});
        expect(reduceToSingleFilter({city: ["Hel"]}, {city: ["Hel"], active: ["true"]})).toEqual({active: ["true"]});
        expect(reduceToSingleFilter({city: ["Hel"]}, {city: ["Tur"], active: null})).toEqual({city: ["Tur"]});
        expect(reduceToSingleFilter({city: ["Hel"], active: ["true"]}, {city: ["Hel"], active: ["true"]})).toEqual({city: ["Hel"]});
        expect(reduceToSingleFilter({city: ["Hel"]}, {city: null, active: []})).toEqual({});
    });

    it("walks the pages until the last one and stops at the cap with a warning", async () => {
        const fetcher = jest.fn()
            .mockResolvedValueOnce(pageOf([rows[0]], 0, false))
            .mockResolvedValueOnce(pageOf([rows[1]], 1, true));

        await expect(fetchAllPages(fetcher)).resolves.toEqual({rows, truncated: false});
        expect(fetcher).toHaveBeenNthCalledWith(1, {page: 0, size: 100});
        expect(fetcher).toHaveBeenNthCalledWith(2, {page: 1, size: 100});

        const consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
        const endless = jest.fn().mockImplementation(({page}: { page: number }) => Promise.resolve(pageOf([{...rows[0], id: page}], page, false)));
        await expect(fetchAllPages(endless, 3)).resolves.toEqual({rows: [{...rows[0], id: 0}, {...rows[0], id: 1}, {...rows[0], id: 2}], truncated: true});
        expect(endless).toHaveBeenCalledTimes(3);
        expect(consoleWarn).toHaveBeenCalledTimes(1);
        consoleWarn.mockRestore();

        const empty = jest.fn().mockResolvedValue(pageOf([], 0, false));
        await expect(fetchAllPages(empty)).resolves.toEqual({rows: [], truncated: false});
        expect(empty).toHaveBeenCalledTimes(1);
    });
});

describe("OxTable client mode", () => {
    const filterColumns: OxColumnsType<Row> = [
        {title: "Name", dataIndex: "name", key: "name", mobile: true},
        {title: "Depth", dataIndex: "depth", key: "depth", sorter: true, sortDirections: ["descend", "ascend"]},
        {title: "City", dataIndex: ["nested", "city"], key: "city"},
        {title: "Active", dataIndex: "active", key: "active", filters: [{text: "Yes", value: "true"}, {text: "No", value: "false"}]},
        {
            title: "Custom",
            dataIndex: "depth",
            key: "custom",
            filters: [{text: "Deep", value: "deep"}],
            onFilter: (value, record) => value === "deep" && record.depth > 40
        }
    ];

    beforeEach(() => {
        mockUseBreakpoint.mockReturnValue(WIDE);
    });

    it("makes every data column searchable in client mode unless it opts out", () => {
        const optOut: OxColumnsType<Row> = [...filterColumns, {title: "Quiet", dataIndex: "id", key: "quiet", searchable: false}];
        render(<OxTable<Row> columns={optOut} dataSource={rows} rowKey={"id"} pagination={false}/>);

        for (const title of ["Name", "Depth", "City", "Active", "Custom"]) {
            expect(screen.getByText(title).closest("th")?.querySelector(".ant-table-filter-trigger")).not.toBeNull();
        }
        expect(screen.getByText("Quiet").closest("th")?.querySelector(".ant-table-filter-trigger")).toBeNull();
    });

    it("filters the rows with the default enum filter when the column has filters but no onFilter", async () => {
        render(<OxTable<Row> columns={filterColumns} dataSource={rows} rowKey={"id"} pagination={false}/>);
        expect(renderedNames()).toEqual(["Team Sidemount", "Team Rebreather"]);

        openFilterDropdown("Active");
        await selectEnumOption(".ant-table-filter-dropdown", "No");

        await waitFor(() => expect(renderedNames()).toEqual(["Team Rebreather"]));
        expect(document.querySelectorAll(".ant-table-filter-trigger.active")).toHaveLength(1);

        openFilterDropdown("Active");
        fireEvent.click(screen.getByText("common.table.filter.reset"));
        await waitFor(() => expect(renderedNames()).toEqual(["Team Sidemount", "Team Rebreather"]));
        expect(document.querySelectorAll(".ant-table-filter-trigger.active")).toHaveLength(0);
    });

    it("keeps the caller's onFilter for a column that has one", async () => {
        render(<OxTable<Row> columns={filterColumns} dataSource={rows} rowKey={"id"} pagination={false}/>);

        openFilterDropdown("Custom");
        await selectEnumOption(".ant-table-filter-dropdown", "Deep");

        await waitFor(() => expect(renderedNames()).toEqual(["Team Rebreather"]));
    });

    it("filters the rows with a case-insensitive substring search on a text column", async () => {
        render(<OxTable<Row> columns={filterColumns} dataSource={rows} rowKey={"id"} pagination={false}/>);

        openFilterDropdown("City");
        const input = screen.getByPlaceholderText("common.table.filter.searchColumn:City");
        fireEvent.change(input, {target: {value: "hels"}});
        fireEvent.keyDown(input, {key: "Enter", code: "Enter"});

        await waitFor(() => expect(renderedNames()).toEqual(["Team Sidemount"]));
    });

    it("sorts a `sorter: true` column with the default comparator", async () => {
        render(<OxTable<Row> columns={filterColumns} dataSource={rows} rowKey={"id"} pagination={false}/>);

        fireEvent.click(screen.getByText("Depth"));

        await waitFor(() => expect(renderedNames()).toEqual(["Team Rebreather", "Team Sidemount"]));
    });

    it("filters a static table from the search inside a collapsed mobile row", async () => {
        mockUseBreakpoint.mockReturnValue(NARROW);
        render(<OxTable<Row> columns={filterColumns} dataSource={rows} rowKey={"id"} pagination={false}/>);

        fireEvent.click(screen.getAllByLabelText("Expand row")[0]);
        await waitFor(() => expect(screen.getByText("Helsinki")).toBeInTheDocument());

        fireEvent.click(screen.getByLabelText("common.table.filter.searchColumn:City"));
        const search = screen.getByPlaceholderText("common.table.filter.searchColumn:City");
        fireEvent.change(search, {target: {value: "turku"}});
        fireEvent.keyDown(search, {key: "Enter", code: "Enter"});

        await waitFor(() => expect(renderedNames()).toEqual(["Team Rebreather"]));
    });

    it("filters a static table from the enum select inside a collapsed mobile row", async () => {
        mockUseBreakpoint.mockReturnValue(NARROW);
        render(<OxTable<Row> columns={filterColumns} dataSource={rows} rowKey={"id"} pagination={false}/>);

        fireEvent.click(screen.getAllByLabelText("Expand row")[1]);
        await waitFor(() => expect(screen.getByText("Turku")).toBeInTheDocument());

        fireEvent.click(screen.getByRole("button", {name: "common.table.filter.searchColumn:Active"}));
        await selectEnumOption(".ox-table-collapsed-row", "Yes");

        await waitFor(() => expect(renderedNames()).toEqual(["Team Sidemount"]));
    });

    it("loads every page through the fetcher, reloads on demand and reports failures", async () => {
        const fetcher = jest.fn()
            .mockResolvedValueOnce(pageOf([rows[0]], 0, false))
            .mockResolvedValueOnce(pageOf([rows[1]], 1, true))
            .mockResolvedValueOnce(pageOf([rows[1]], 0, true))
            .mockResolvedValueOnce(pageOf([rows[0]], 0, true))
            .mockRejectedValueOnce(Object.assign(new Error("boom"), {response: {data: {token: "secret"}}}));
        const messageApi = {error: jest.fn(), warning: jest.fn()} as unknown as MessageInstance;
        const handle = createRef<OxTableHandle>();
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);

        const {rerender} = render(<OxTable<Row> ref={handle} columns={columns} fetcher={fetcher} fetchDeps={[1]} messageApi={messageApi} rowKey={"id"}
                                                pagination={false}/>);

        expect(document.querySelector(".ant-spin-spinning")).not.toBeNull();
        await waitFor(() => expect(renderedNames()).toEqual(["Team Sidemount", "Team Rebreather"]));
        expect(fetcher).toHaveBeenNthCalledWith(1, {page: 0, size: 100});
        expect(fetcher).toHaveBeenNthCalledWith(2, {page: 1, size: 100});
        expect(document.querySelector(".ant-spin-spinning")).toBeNull();

        rerender(<OxTable<Row> ref={handle} columns={columns} fetcher={fetcher} fetchDeps={[2]} messageApi={messageApi} rowKey={"id"} pagination={false}/>);
        await waitFor(() => expect(renderedNames()).toEqual(["Team Rebreather"]));

        act(() => handle.current?.reload());
        await waitFor(() => expect(renderedNames()).toEqual(["Team Sidemount"]));

        rerender(<OxTable<Row> ref={handle} columns={columns} fetcher={fetcher} fetchDeps={[2]} reloadToken={1} messageApi={messageApi} rowKey={"id"}
                               pagination={false}/>);
        await waitFor(() => expect(messageApi.error).toHaveBeenCalledWith("common.table.loadError"));
        expect(consoleError).toHaveBeenCalledWith("Failed to load table data");
        expect(consoleError.mock.calls.some((call) => call.some((argument) => String(argument).includes("secret")))).toBe(false);
        expect(fetcher).toHaveBeenCalledTimes(5);
        consoleError.mockRestore();
    });

    it("renders its own message holder and warns when the page cap is hit, and fetches nothing while disabled", async () => {
        const fetcher = jest.fn().mockImplementation(({page}: { page: number }) => Promise.resolve(pageOf([{...rows[0], id: page}], page, false)));
        const consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => undefined);

        const {rerender} = render(<OxTable<Row> columns={columns} fetcher={fetcher} fetchEnabled={false} rowKey={"id"} pagination={false}/>);
        await act(async () => {
            await Promise.resolve();
        });
        expect(fetcher).not.toHaveBeenCalled();
        expect(document.querySelector(".ant-spin-spinning")).toBeNull();

        rerender(<OxTable<Row> columns={columns} fetcher={fetcher} fetchEnabled rowKey={"id"} pagination={false}/>);
        await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(50));
        await waitFor(() => expect(screen.getByText("common.table.fetchLimitReached")).toBeInTheDocument());
        expect(consoleWarn).toHaveBeenCalledTimes(1);
        consoleWarn.mockRestore();
    });
});

describe("OxTable server mode", () => {
    const serverColumns: OxColumnsType<Row> = [
        {title: "Name", dataIndex: "name", key: "name", mobile: true, sorter: true},
        {title: "City", dataIndex: ["nested", "city"], key: "city", searchable: true},
        {title: "Active", dataIndex: "active", key: "active", filters: [{text: "Yes", value: "true"}, {text: "No", value: "false"}]}
    ];

    beforeEach(() => {
        mockUseBreakpoint.mockReturnValue(WIDE);
    });

    it("renders the paged state and forwards a single column filter to the hook, replacing the previous one", async () => {
        const paged = pagedState(rows, {loading: true});
        render(<OxTable<Row> dataMode={"server"} paged={paged} columns={serverColumns} rowKey={"id"}/>);

        expect(renderedNames()).toEqual(["Team Sidemount", "Team Rebreather"]);
        expect(document.querySelector(".ant-spin-spinning")).not.toBeNull();

        openFilterDropdown("City");
        const input = screen.getByPlaceholderText("common.table.filter.searchColumn:City");
        fireEvent.change(input, {target: {value: "Hel"}});
        fireEvent.keyDown(input, {key: "Enter", code: "Enter"});

        await waitFor(() => expect(paged.handleTableChange).toHaveBeenCalledTimes(1));
        expect((paged.handleTableChange as jest.Mock).mock.calls[0][1]).toEqual({city: ["Hel"]});
        // The rows are not filtered in the browser
        expect(renderedNames()).toEqual(["Team Sidemount", "Team Rebreather"]);

        openFilterDropdown("Active");
        await selectEnumOption(".ant-table-filter-dropdown", "Yes");

        await waitFor(() => expect(paged.handleTableChange).toHaveBeenCalledTimes(2));
        expect((paged.handleTableChange as jest.Mock).mock.calls[1][1]).toEqual({active: ["true"]});
        await waitFor(() => expect(document.querySelectorAll(".ant-table-filter-trigger.active")).toHaveLength(1));
        expect(screen.getByText("Active").closest("th")?.querySelector(".ant-table-filter-trigger.active")).not.toBeNull();
    });

    it("sends the search of a collapsed mobile row to the hook and exposes reload through the handle", async () => {
        mockUseBreakpoint.mockReturnValue(NARROW);
        const paged = pagedState(rows);
        const handle = createRef<OxTableHandle>();
        render(<OxTable<Row> ref={handle} dataMode={"server"} paged={paged} columns={serverColumns} rowKey={"id"}/>);

        fireEvent.click(screen.getAllByLabelText("Expand row")[0]);
        await waitFor(() => expect(screen.getByText("Helsinki")).toBeInTheDocument());

        fireEvent.click(screen.getByLabelText("common.table.filter.searchColumn:City"));
        const search = screen.getByPlaceholderText("common.table.filter.searchColumn:City");
        fireEvent.change(search, {target: {value: "Tur"}});
        fireEvent.keyDown(search, {key: "Enter", code: "Enter"});

        await waitFor(() => expect(paged.setFilter).toHaveBeenCalledWith("city", "Tur"));
        expect(paged.handleTableChange).not.toHaveBeenCalled();

        act(() => handle.current?.reload());
        expect(paged.reload).toHaveBeenCalledTimes(1);
    });

    it("offers the text search only on columns flagged searchable, and enum filters only on columns with filters", () => {
        const flagged: OxColumnsType<Row> = [
            {title: "Name", dataIndex: "name", key: "name", mobile: true, searchable: true},
            {title: "Depth", dataIndex: "depth", key: "depth"},
            {title: "City", dataIndex: ["nested", "city"], key: "city", searchable: false},
            {title: "Active", dataIndex: "active", key: "active", filters: [{text: "Yes", value: "true"}]}
        ];
        const paged = pagedState(rows);
        render(<OxTable<Row> dataMode={"server"} paged={paged} columns={flagged} rowKey={"id"}/>);

        expect(screen.getByText("Name").closest("th")?.querySelector(".ant-table-filter-trigger")).not.toBeNull();
        expect(screen.getByText("Depth").closest("th")?.querySelector(".ant-table-filter-trigger")).toBeNull();
        expect(screen.getByText("City").closest("th")?.querySelector(".ant-table-filter-trigger")).toBeNull();
        expect(screen.getByText("Active").closest("th")?.querySelector(".ant-table-filter-trigger")).not.toBeNull();
        expect(document.querySelectorAll(".ant-table-filter-trigger")).toHaveLength(2);

        expect(columnFilterKind(flagged[0], true)).toBe("text");
        expect(columnFilterKind(flagged[1], true)).toBeUndefined();
        expect(columnFilterKind(flagged[1], false)).toBe("text");
        expect(columnFilterKind(flagged[2], false)).toBeUndefined();
        expect(columnFilterKind(flagged[3], true)).toBe("enum");
        expect(columnFilterKind({title: "Action", key: "action"}, false)).toBeUndefined();
    });

    it("hides the search of an unflagged column inside a collapsed mobile row in server mode", async () => {
        mockUseBreakpoint.mockReturnValue(NARROW);
        const paged = pagedState(rows);
        const flagged: OxColumnsType<Row> = [
            {title: "Name", dataIndex: "name", key: "name", mobile: true},
            {title: "Depth", dataIndex: "depth", key: "depth"},
            {title: "City", dataIndex: ["nested", "city"], key: "city", searchable: true}
        ];
        render(<OxTable<Row> dataMode={"server"} paged={paged} columns={flagged} rowKey={"id"}/>);

        fireEvent.click(screen.getAllByLabelText("Expand row")[0]);
        await waitFor(() => expect(screen.getByText("Helsinki")).toBeInTheDocument());

        expect(screen.queryByLabelText("common.table.filter.searchColumn:Depth")).toBeNull();
        expect(screen.getByLabelText("common.table.filter.searchColumn:City")).toBeInTheDocument();
    });

    it("falls back to a client table and logs when the paged state is missing", () => {
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);

        render(<OxTable<Row> dataMode={"server"} columns={serverColumns} dataSource={rows} rowKey={"id"} pagination={false}/>);

        expect(renderedNames()).toEqual(["Team Sidemount", "Team Rebreather"]);
        expect(consoleError.mock.calls.filter((call) => String(call[0]).includes("server mode"))).toHaveLength(1);
        consoleError.mockRestore();
    });
});
