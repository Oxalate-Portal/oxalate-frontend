import {Descriptions, Grid, Table, type TableProps} from "antd";
import type {ColumnGroupType, ColumnsType, ColumnType} from "antd/es/table";
import type {Breakpoint} from "antd/es/_util/responsiveObserver";
import type {ReactNode} from "react";

/**
 * A column of an OxTable. In addition to the Ant Design column properties a column can be flagged as `mobile`, which
 * means that it identifies the row and therefore stays visible when the table collapses on a narrow screen. Columns
 * without the flag are moved into the expandable row on narrow screens. Action columns (key or dataIndex `action` or
 * `actions`) always stay visible.
 */
export type OxColumnType<RecordType> = ColumnType<RecordType> & { mobile?: boolean };
export type OxColumnGroupType<RecordType> = ColumnGroupType<RecordType> & { mobile?: boolean };
export type OxColumnsType<RecordType> = (OxColumnType<RecordType> | OxColumnGroupType<RecordType>)[];

export interface OxTableProps<RecordType> extends Omit<TableProps<RecordType>, "columns"> {
    columns?: OxColumnsType<RecordType>;
    /** The table collapses when the viewport is narrower than this Ant Design breakpoint. Defaults to `md` (768px). */
    collapseBelow?: Breakpoint;
}

/** Matches `action`, `actions` and suffixed variants such as `comment-list-action` or `row_actions`. */
const ACTION_COLUMN_PATTERN = /(^|[-_.])actions?$/;

function columnIdentity<RecordType>(column: OxColumnType<RecordType> | OxColumnGroupType<RecordType>): string {
    const key = column.key ?? ("dataIndex" in column ? column.dataIndex : undefined);

    if (Array.isArray(key)) {
        return key.join(".");
    }

    return key === undefined || key === null ? "" : String(key);
}

export function isActionColumn<RecordType>(column: OxColumnType<RecordType> | OxColumnGroupType<RecordType>): boolean {
    return ACTION_COLUMN_PATTERN.test(columnIdentity(column).toLowerCase());
}

/**
 * Splits the columns into the ones that stay visible on a narrow screen and the ones that move into the expanded row.
 * When no column is flagged as `mobile`, the first non-action column is used as the identifying column so that the
 * table never collapses to only its action buttons.
 */
export function splitColumnsForMobile<RecordType>(columns: OxColumnsType<RecordType>): {
    visible: OxColumnsType<RecordType>;
    collapsed: OxColumnsType<RecordType>;
} {
    const hasMobileColumn = columns.some((column) => column.mobile);
    const fallbackIdentifier = hasMobileColumn ? undefined : columns.find((column) => !isActionColumn(column));
    const visible: OxColumnsType<RecordType> = [];
    const collapsed: OxColumnsType<RecordType> = [];

    for (const column of columns) {
        if (column.mobile || isActionColumn(column) || column === fallbackIdentifier) {
            visible.push(column);
        } else {
            collapsed.push(column);
        }
    }

    return {visible, collapsed};
}

function readDataIndex<RecordType>(record: RecordType, dataIndex: unknown): unknown {
    if (dataIndex === undefined || dataIndex === null) {
        return undefined;
    }

    const path = Array.isArray(dataIndex) ? dataIndex : [dataIndex];
    let value: unknown = record;

    for (const segment of path) {
        if (value === null || value === undefined) {
            return undefined;
        }

        value = (value as Record<string, unknown>)[String(segment)];
    }

    return value;
}

function columnLabel<RecordType>(column: OxColumnType<RecordType> | OxColumnGroupType<RecordType>): ReactNode {
    const title = column.title;

    if (typeof title === "function") {
        return title({sortColumns: [], filters: {}});
    }

    return title ?? columnIdentity(column);
}

/**
 * Renders a single cell the same way the table would, so that tags, links and formatted values look identical in the
 * collapsed view. Cells that render as `{children, props}` objects are unwrapped.
 */
export function renderCollapsedValue<RecordType>(column: OxColumnType<RecordType> | OxColumnGroupType<RecordType>, record: RecordType, index: number): ReactNode {
    const rawValue = "dataIndex" in column ? readDataIndex(record, column.dataIndex) : undefined;
    const render = "render" in column ? column.render : undefined;
    const rendered = render ? render(rawValue, record, index) : rawValue;

    if (rendered !== null && typeof rendered === "object" && !Array.isArray(rendered) && "children" in (rendered as object)
        && !("$$typeof" in (rendered as object))) {
        return (rendered as { children?: ReactNode }).children ?? null;
    }

    if (rendered === undefined || rendered === null || typeof rendered === "boolean") {
        return typeof rendered === "boolean" ? String(rendered) : "";
    }

    return rendered as ReactNode;
}

/**
 * Whether the current viewport is narrower than the given breakpoint. The breakpoint map is empty on the very first
 * render, and all false in jsdom, and both must be treated as a wide screen so that nothing collapses by accident.
 */
export function isNarrowScreen(screens: Partial<Record<Breakpoint, boolean>>, collapseBelow: Breakpoint): boolean {
    const anyBreakpointMatched = Object.values(screens).some((matched) => matched === true);
    return anyBreakpointMatched && screens[collapseBelow] === false;
}

/**
 * Ant Design Table that adapts to narrow screens. Below the collapse breakpoint only the columns flagged as `mobile`,
 * plus the action column, remain visible; every other column is listed inside the expandable row, above any
 * expanded content the caller provides. On wide screens it behaves exactly like the Ant Design Table.
 */
export function OxTable<RecordType extends object = Record<string, unknown>>({
                                                                                 columns = [],
                                                                                 collapseBelow = "md",
                                                                                 expandable,
                                                                                 size,
                                                                                 ...tableProps
                                                                             }: OxTableProps<RecordType>) {
    const screens = Grid.useBreakpoint();
    const narrow = isNarrowScreen(screens, collapseBelow);

    if (!narrow) {
        return <Table<RecordType> {...tableProps} columns={columns as ColumnsType<RecordType>} expandable={expandable} size={size}/>;
    }

    const {visible, collapsed} = splitColumnsForMobile(columns);

    if (collapsed.length === 0) {
        return <Table<RecordType> {...tableProps} columns={visible as ColumnsType<RecordType>} expandable={expandable} size={size ?? "small"}/>;
    }

    const originalExpandedRowRender = expandable?.expandedRowRender;
    const originalRowExpandable = expandable?.rowExpandable;

    const mobileExpandable: NonNullable<TableProps<RecordType>["expandable"]> = {
        ...expandable,
        rowExpandable: () => true,
        expandedRowRender: (record, index, indent, expanded) => (
            <div className={"ox-table-collapsed-row"}>
                <Descriptions
                    size={"small"}
                    column={1}
                    colon
                    items={collapsed.map((column, columnIndex) => ({
                        key: columnIdentity(column) || String(columnIndex),
                        label: columnLabel(column),
                        children: renderCollapsedValue(column, record, index)
                    }))}
                />
                {originalExpandedRowRender && (originalRowExpandable === undefined || originalRowExpandable(record))
                    && originalExpandedRowRender(record, index, indent, expanded)}
            </div>
        )
    };

    return (
        <Table<RecordType>
            {...tableProps}
            columns={visible as ColumnsType<RecordType>}
            expandable={mobileExpandable}
            size={size ?? "small"}
            tableLayout={tableProps.tableLayout ?? "auto"}
        />
    );
}
