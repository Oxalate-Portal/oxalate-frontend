import {Button, Col, Input, Row, Select, Space, Switch} from "antd";
import {useTranslation} from "react-i18next";
import {SortDirectionEnum} from "../../models";

interface BlogControlsProps {
    sortBy: string;
    sortDirection: SortDirectionEnum;
    searchText: string;
    caseSensitive: boolean;
    onSortByChange: (value: string) => void;
    onSortDirectionChange: (value: SortDirectionEnum) => void;
    onSearchChange: (value: string) => void;
    onCaseSensitiveChange: (value: boolean) => void;
    showLoadMore?: boolean;
    onLoadMore?: () => void;
    loading?: boolean;
    hasMore?: boolean;
}

export function BlogControls({
                                 sortBy,
                                 sortDirection,
                                 searchText,
                                 caseSensitive,
                                 onSortByChange,
                                 onSortDirectionChange,
                                 onSearchChange,
                                 onCaseSensitiveChange,
                                 showLoadMore = false,
                                 onLoadMore,
                                 loading = false,
                                 hasMore = false
                             }: BlogControlsProps) {
    const {t} = useTranslation();
    const sortByOptions = [
        {value: "createdAt", label: t("BlogControls.sortBy.createdAt")},
        {value: "title", label: t("BlogControls.sortBy.title")}
    ];
    const sortDirectionOptions = [
        {value: SortDirectionEnum.DESC, label: t("BlogControls.sortDirection.desc")},
        {value: SortDirectionEnum.ASC, label: t("BlogControls.sortDirection.asc")}
    ];
    return (
            <Row gutter={[16, 16]} align="middle" style={{marginBottom: showLoadMore ? 0 : 16, marginTop: showLoadMore ? 16 : 0}}>
                <Col xs={24} sm={12} md={6} lg={4}>
                    <Select
                            style={{width: "100%"}}
                            value={sortBy}
                            onChange={onSortByChange}
                            options={sortByOptions}
                            placeholder={t("BlogControls.sortBy.placeholder")}
                    />
                </Col>
                <Col xs={24} sm={12} md={6} lg={4}>
                    <Select
                            style={{width: "100%"}}
                            value={sortDirection}
                            onChange={onSortDirectionChange}
                            options={sortDirectionOptions}
                            placeholder={t("BlogControls.sortDirection.placeholder")}
                    />
                </Col>
                <Col xs={24} sm={16} md={8} lg={10}>
                    <Input
                            placeholder={t("BlogControls.search.placeholder")}
                            value={searchText}
                            onChange={(e) => onSearchChange(e.target.value)}
                            allowClear
                    />
                </Col>
                <Col xs={24} sm={8} md={4} lg={6}>
                    <Space>
                        <Switch
                                checked={caseSensitive}
                                onChange={onCaseSensitiveChange}
                        />
                        <span>{t("BlogControls.caseSensitive")}</span>
                    </Space>
                </Col>
                {showLoadMore && (
                        <Col xs={24} style={{textAlign: "center", marginTop: 16}}>
                            <Button
                                    type="primary"
                                    onClick={onLoadMore}
                                    loading={loading}
                                    disabled={!hasMore}
                            >
                                {hasMore ? t("BlogControls.loadMore") : t("BlogControls.noMore")}
                            </Button>
                        </Col>
                )}
            </Row>
    );
}
