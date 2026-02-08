import {Button, Col, Input, Row, Select, Space, Switch, Typography} from "antd";
import {useTranslation} from "react-i18next";
import {SortDirectionEnum} from "../../models";

const {Text} = Typography;

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
    totalItems?: number;
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
                                 hasMore = false,
                                 totalItems = 0
                             }: BlogControlsProps) {
    const {t} = useTranslation();

    // Disable sort controls if there's only one item or less (but keep search and case sensitivity enabled)
    const sortControlsDisabled = totalItems <= 1;

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
                    <Space orientation={"vertical"} size={4} style={{width: "100%"}}>
                        <Text type="secondary">{t("BlogControls.sortBy.label")}</Text>
                        <Select
                                style={{width: "100%"}}
                                value={sortBy}
                                onChange={onSortByChange}
                                options={sortByOptions}
                                placeholder={t("BlogControls.sortBy.placeholder")}
                                disabled={sortControlsDisabled}
                        />
                    </Space>
                </Col>
                <Col xs={24} sm={12} md={6} lg={4}>
                    <Space orientation={"vertical"} size={4} style={{width: "100%"}}>
                        <Text type="secondary">{t("BlogControls.sortDirection.label")}</Text>
                        <Select
                                style={{width: "100%"}}
                                value={sortDirection}
                                onChange={onSortDirectionChange}
                                options={sortDirectionOptions}
                                placeholder={t("BlogControls.sortDirection.placeholder")}
                                disabled={sortControlsDisabled}
                        />
                    </Space>
                </Col>
                <Col xs={24} sm={16} md={8} lg={10}>
                    <Space orientation={"vertical"} size={4} style={{width: "100%"}}>
                        <Text type="secondary">{t("BlogControls.search.label")}</Text>
                        <Input
                                placeholder={t("BlogControls.search.placeholder")}
                                value={searchText}
                                onChange={(e) => onSearchChange(e.target.value)}
                                allowClear
                        />
                    </Space>
                </Col>
                <Col xs={24} sm={8} md={4} lg={6}>
                    <Space orientation={"vertical"} size={4}>
                        <Text type="secondary">{t("BlogControls.caseSensitive.label")}</Text>
                        <Space>
                            <Switch
                                    checked={caseSensitive}
                                    onChange={onCaseSensitiveChange}
                                    unCheckedChildren={t("common.switch.off")}
                                    checkedChildren={t("common.switch.on")}
                                    style={{
                                        backgroundColor: caseSensitive ? "#52c41a" : "#ff4d4f"
                                    }}
                            />
                        </Space>
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
