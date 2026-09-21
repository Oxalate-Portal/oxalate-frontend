import {Input, Space, Switch, Typography} from "antd";
import type {ReactNode} from "react";
import {useTranslation} from "react-i18next";

export interface OxTableSearchProps {
    /** The search text currently applied to the table. */
    value?: string;
    /** Called with the trimmed text when the user presses Enter, clicks the search button or clears the field. */
    onSearch: (value: string) => void;
    caseSensitive?: boolean;
    /** When given, a case-sensitive switch is rendered next to the search field. */
    onCaseSensitiveChange?: (caseSensitive: boolean) => void;
    placeholder?: string;
    loading?: boolean;
    /** Extra controls rendered in front of the search field, e.g. a column selector. */
    children?: ReactNode;
}

/**
 * Search bar rendered above a server-paged {@link OxTable}: a search field plus an optional case-sensitive switch.
 * The bar fills the available width up to a maximum and wraps on narrow screens, so it never forces a horizontal
 * scroll.
 */
export function OxTableSearch({value, onSearch, caseSensitive = false, onCaseSensitiveChange, placeholder, loading, children}: OxTableSearchProps) {
    const {t} = useTranslation();
    const caseSensitiveLabel = t("common.table.search.caseSensitive");

    return (
        <div className={"ox-table-search"}
             style={{display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, width: "100%", maxWidth: 720, marginBottom: 12}}>
            {children}
            <Input.Search
                allowClear
                defaultValue={value}
                placeholder={placeholder ?? t("common.table.search.placeholder")}
                aria-label={placeholder ?? t("common.table.search.placeholder")}
                onSearch={(text) => onSearch(text.trim())}
                loading={loading}
                style={{flex: "1 1 200px", minWidth: 0}}
            />
            {onCaseSensitiveChange && (
                <Space size={4}>
                    <Switch
                        size={"small"}
                        checked={caseSensitive}
                        onChange={(checked) => onCaseSensitiveChange(checked)}
                        aria-label={caseSensitiveLabel}
                    />
                    <Typography.Text>{caseSensitiveLabel}</Typography.Text>
                </Space>
            )}
        </div>
    );
}
