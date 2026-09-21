import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {Button, Col, DatePicker, Input, Row, Select, Space} from "antd";
import dayjs, {Dayjs} from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {commentAPI, userAPI} from "../../services";
import {CommentClassEnum, type CommentFilterRequest, type CommentResponse, CommentStatusEnum, CommentTypeEnum} from "../../models";
import {commentStatusEnum2Tag, commentTypeEnum2Tag} from "../../tools";
import {OxTable} from "../main";

dayjs.extend(utc);
dayjs.extend(timezone);

export function CommentList() {
    const {t} = useTranslation();
    const [filter, setFilter] = useState<CommentFilterRequest>({});
    const [comments, setComments] = useState<CommentResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [userList, setUserList] = useState<{ value: number, label: string }[]>([]);

    useEffect(() => {
        userAPI.findAll()
                .then(response => {
                    const optionList = [];
                    for (const user of response) {
                        optionList.push({value: user.id, label: user.last_name + " " + user.first_name + " (" + user.id + ")"});
                        user.username = user.first_name + " " + user.last_name;
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
        {title: t("CommentList.title"), dataIndex: "title", key: "title", mobile: true},
        {title: t("CommentList.body"), dataIndex: "body", key: "body"},
        {title: t("CommentList.username"), dataIndex: "username", key: "username", mobile: true},
        {
            title: t("CommentList.status"),
            dataIndex: "comment_status",
            key: "comment_status",
            render: (_: string, item: CommentResponse) => (commentStatusEnum2Tag(item.comment_status, t, item.id))
        },
        {
            title: t("CommentList.type"),
            dataIndex: "comment_type",
            key: "comment_type",
            render: (_: string, item: CommentResponse) => (commentTypeEnum2Tag(item.comment_type, t, item.id))
        },
        {title: t("CommentList.createdAt"), dataIndex: "created_at", key: "created_at", render: (date: Dayjs) => dayjs(date).format("YYYY-MM-DD HH:mm:ss")},
        {
            title: t("common.table.column-title.action"),
            key: "comment-list-action",
            render: (_: string, item: CommentResponse) => {
                return <Button type={"primary"} onClick={() => console.debug("Edit comment", item.id)}>{t("common.button.update")}</Button>;
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
                                     onChange={(value) => handleFilterChange({user_id: value})}
                                     showSearch={{optionFilterProp: "label"}}
                        /></Col>
                        <Col><Input placeholder={t("CommentList.filters.titleSearch")}
                                    onChange={e => handleFilterChange({title_search: e.target.value || undefined})}/></Col>
                        <Col><Input placeholder={t("CommentList.filters.bodySearch")}
                                    onChange={e => handleFilterChange({body_search: e.target.value || undefined})}/></Col>

                        <Col><Select placeholder={t("CommentList.filters.commentClass")}
                                     onChange={value => handleFilterChange({comment_class: value})}
                                     options={Object.values(CommentClassEnum).map(value => ({value, label: t(`CommentClassEnum.${value.toLowerCase()}`)}))}
                                     allowClear={true}
                        /></Col>

                        <Col><Select placeholder={t("CommentList.filters.commentStatus")}
                                     onChange={value => handleFilterChange({comment_status: value})}
                                     options={Object.values(CommentStatusEnum).map(value => ({value, label: t(`CommentStatusEnum.${value.toLowerCase()}`)}))}
                                     allowClear={true}
                        /></Col>
                        <Col><Select placeholder={t("CommentList.filters.commentType")}
                                     onChange={value => handleFilterChange({comment_type: value})}
                                     options={Object.values(CommentTypeEnum).map(value => ({value, label: t(`CommentTypeEnum.${value.toLowerCase()}`)}))}
                                     allowClear={true}
                        /></Col>
                        <Col><DatePicker placeholder={t("CommentList.filters.afterDate")}
                                         onChange={date => handleFilterChange({after_date: date ? date.toDate() : undefined})}/></Col>
                        <Col><DatePicker placeholder={t("CommentList.filters.beforeDate")}
                                         onChange={date => handleFilterChange({before_date: date ? date.toDate() : undefined})}/></Col>
                        <Col><Button type={"primary"} onClick={fetchComments}>{t("common.button.search")}</Button></Col>
                    </Row>
                    <OxTable dataSource={comments} columns={columns} rowKey="id" loading={loading}/>
                </Space>
            </div>
    );
}
