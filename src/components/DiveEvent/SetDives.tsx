import {Link, useNavigate, useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {DownOutlined, UpOutlined} from "@ant-design/icons";
import {Button, Space, Spin, Table} from "antd";
import {diveEventAPI} from "../../services";
import type {DiveCountItemVO, DiveEventListRequest, DiveEventListResponse} from "../../models";

export function SetDives() {
    const {paramId} = useParams();
    const [diveEventId, setDiveEventId] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [eventDives, setEventDives] = useState<DiveEventListResponse | null>(null);
    const [modified, setModified] = useState(false);
    const navigate = useNavigate();
    const {t} = useTranslation();

    const eventDiveColumns = [
        {
            title: "#",
            dataIndex: "userId",
            key: "userId",
            render: (_: any, record: DiveCountItemVO) => {
                return (<Link to={"/users/" + record.userId + "/show"}>{record.userId}</Link>);
            }
        },
        {
            title: t("SetDives.table.name"),
            dataIndex: "name",
            key: "name"
        },
        {
            title: t("SetDives.table.diveCount"),
            dataIndex: "diveCount",
            key: "diveCount"
        },
        {
            title: t("SetDives.table.action"),
            key: "action",
            render: (_: any, record: DiveCountItemVO) => (
                    <Space size="middle">
                        <DownOutlined onClick={() => changeDiveCount(record, -1)}/>
                        <UpOutlined onClick={() => changeDiveCount(record, 1)}/>
                    </Space>
            )
        }
    ];

    useEffect(() => {
        setLoading(true);

        let tmpDiveEventId = 0;
        if (paramId !== undefined && !Number.isNaN(parseInt(paramId))) {
            tmpDiveEventId = parseInt(paramId);
            setDiveEventId(tmpDiveEventId);
        }

        if (tmpDiveEventId > 0) {
            diveEventAPI.getDiveEventDives(tmpDiveEventId)
                    .then((response) => {
                        // We do this in order to avoid any references
                        setEventDives(JSON.parse(JSON.stringify(response)));
                    })
                    .catch((error) => {
                        console.error(error);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        } else {

        }
    }, [paramId]);

    function changeDiveCount(record: DiveCountItemVO, change: number) {
        const newEventDives = JSON.parse(JSON.stringify(eventDives));
        const dive = newEventDives.dives.find((x: DiveCountItemVO) => x.userId === record.userId);

        if (dive.diveCount === 0 && change === -1) {
            return;
        }

        dive.diveCount += change;
        setEventDives(newEventDives);
        setModified(true);
    }

    async function updateEventDives() {
        setLoading(true);
        if (eventDives !== null) {
            const updatedDives: DiveEventListRequest = {
                dives: eventDives.dives
            };
            diveEventAPI.updateDiveEventDives(diveEventId, updatedDives)
                    .then((response) => {
                        // We do this in order to avoid any references
                        setEventDives(JSON.parse(JSON.stringify(response)));
                    })
                    .catch((error) => {
                        console.error(error);
                    })
                    .finally(() => {
                        setLoading(false);
                        setModified(false);
                    });
        }
    }

    return (
            <div className={"darkDiv"}>
                <Spin spinning={loading}>
                    {eventDives?.dives.length === 0 && <p>{t("SetDives.noDives")}</p>}
                    {eventDives && <Table dataSource={eventDives.dives} columns={eventDiveColumns} rowKey="userId" pagination={false}/>}
                    {eventDives && <Space orientation={"horizontal"} size={12} style={{width: "100%", justifyContent: "right"}}>
                        {modified && <Button type={"primary"} onClick={() => updateEventDives()} style={{margin: 8}}>{t("common.button.save")}</Button>}
                        <Button onClick={() => navigate(-1)}>{t("common.button.back")}</Button>
                    </Space>}
                </Spin>
            </div>
    );
}
