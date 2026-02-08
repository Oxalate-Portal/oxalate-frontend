import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {Button, Col, DatePicker, Input, Row, Select, Space, Table} from "antd";
import dayjs, {Dayjs} from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {commentAPI, userAPI} from "../../services";
import {CommentClassEnum, type CommentFilterRequest, type CommentResponse, CommentStatusEnum, CommentTypeEnum} from "../../models";
import {commentStatusEnum2Tag, commentTypeEnum2Tag} from "../../tools";

dayjs.extend(utc);
dayjs.extend(timezone);

export function CommentList() {
    const {t} = useTranslation();
    const [filter, setFilter] = useState<CommentFilterRequest>({});
    const [comments, setComments] = useState<CommentResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [userList, setUserList] = useState<{ value: number, label: string }[]>([]);

    useEffect(() => {
        setLoading(true);
        userAPI.findAll()
                .then(response => {
                    const optionList = [];
                    for (const user of response) {
                        optionList.push({value: user.id, label: user.lastName + " " + user.firstName + " (" + user.id + ")"});
                        user.username = user.firstName + " " + user.lastName;
                    }
                    setUserList(optionList);
                })
                .catch(error => {
                    console.error("Error:", error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, []);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const data = await commentAPI.findFilteredComments(filter);
            setComments(data);
        } catch (error) {
            console.error("Error fetching comments:", error);
        }
        setLoading(false);
    };

    function handleFilterChange(changedValues: Partial<CommentFilterRequest>) {
        setFilter((prev) => ({...prev, ...changedValues}));
    }

    const columns = [
                {title: t("CommentList.id"), dataIndex: "id", key: "id"},
                {title: t("CommentList.title"), dataIndex: "title", key: "title"},
                {title: t("CommentList.body"), dataIndex: "body", key: "body"},
                {title: t("CommentList.username"), dataIndex: "username", key: "username"},
                {
                    title: t("CommentList.status"),
                    dataIndex: "commentStatus",
                    key: "commentStatus",
                    render: (_: string, item: CommentResponse) => (commentStatusEnum2Tag(item.commentStatus, t, item.id))
                },
                {
                    title: t("CommentList.type"),
                    dataIndex: "commentType",
                    key: "commentType",
                    render: (_: string, item: CommentResponse) => (commentTypeEnum2Tag(item.commentType, t, item.id))
                },
                {title: t("CommentList.createdAt"), dataIndex: "createdAt", key: "createdAt", render: (date: Dayjs) => dayjs(date).format("YYYY-MM-DD HH:mm:ss")},
                {
                    title: t("common.table.column-title.action"),
                    key: "comment-list-action",
                    render: (_: string, item: CommentResponse) => {
                        return <Button type={"primary"} onClick={() => console.log("Edit comment", item.id)}>{t("common.button.update")}</Button>;
                    }
                }
            ];

    return (
            <div className="darkDiv">
                <h1>{t("CommentList.title")}</h1>
                <Space orientation={"vertical"} size={"large"}>
                    <Row gutter={[8, 8]} wrap>
                        <Col><Select options={userList}
                                     placeholder={t("CommentList.filters.user-name")}
                                     onChange={(value) => handleFilterChange({userId: value})}
                                     optionFilterProp="label"
                                     showSearch
                        /></Col>
                        <Col><Input placeholder={t("CommentList.filters.titleSearch")}
                                    onChange={e => handleFilterChange({titleSearch: e.target.value || undefined})}/></Col>
                        <Col><Input placeholder={t("CommentList.filters.bodySearch")}
                                    onChange={e => handleFilterChange({bodySearch: e.target.value || undefined})}/></Col>

                        <Col><Select placeholder={t("CommentList.filters.commentClass")}
                                     onChange={value => handleFilterChange({commentClass: value})}
                                     options={Object.values(CommentClassEnum).map(value => ({value, label: t(`CommentClassEnum.${value.toLowerCase()}`)}))}
                                     allowClear={true}
                        /></Col>

                        <Col><Select placeholder={t("CommentList.filters.commentStatus")}
                                     onChange={value => handleFilterChange({commentStatus: value})}
                                     options={Object.values(CommentStatusEnum).map(value => ({value, label: t(`CommentStatusEnum.${value.toLowerCase()}`)}))}
                                     allowClear={true}
                        /></Col>
                        <Col><Select placeholder={t("CommentList.filters.commentType")}
                                     onChange={value => handleFilterChange({commentType: value})}
                                     options={Object.values(CommentTypeEnum).map(value => ({value, label: t(`CommentTypeEnum.${value.toLowerCase()}`)}))}
                                     allowClear={true}
                        /></Col>
                        <Col><DatePicker placeholder={t("CommentList.filters.afterDate")}
                                         onChange={date => handleFilterChange({afterDate: date ? date.toDate() : undefined})}/></Col>
                        <Col><DatePicker placeholder={t("CommentList.filters.beforeDate")}
                                         onChange={date => handleFilterChange({beforeDate: date ? date.toDate() : undefined})}/></Col>
                        <Col><Button type={"primary"} onClick={fetchComments}>{t("common.button.search")}</Button></Col>
                    </Row>
                    <Table dataSource={comments} columns={columns} rowKey="id" loading={loading}/>
                </Space>
            </div>
    );
}
