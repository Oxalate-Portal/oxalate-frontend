import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {Tag} from "antd";
import {isActionColumn, isNarrowScreen, type OxColumnsType, OxTable, renderCollapsedValue, splitColumnsForMobile} from "../components";

const mockUseBreakpoint = jest.fn();

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
