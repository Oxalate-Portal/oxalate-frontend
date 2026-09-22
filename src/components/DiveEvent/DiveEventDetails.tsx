import {useTranslation} from "react-i18next";
import {useEffect, useState} from "react";
import {useSession} from "../../session";
import {type DiveEventResponse, DiveTypeEnum, type ListUserResponse, PaymentTypeEnum, RoleEnum, UserTypeEnum} from "../../models";
import {checkRoles, diveTypeEnum2Tag, paymentTypeEnum2Tag, userTypeEnum2Tag} from "../../tools";
import {Link} from "react-router-dom";
import {Button, Modal, Space, Spin, Tooltip} from "antd";
import {LinkOutlined} from "@ant-design/icons";
import {type OxColumnsType, OxTable} from "../main";
import dayjs from "dayjs";
import {AdminNotifications} from "../Notification";

interface DiveEventDetailsProps {
    eventInfo: DiveEventResponse | null;
}

export function DiveEventDetails({eventInfo}: DiveEventDetailsProps) {
    const [loading, setLoading] = useState(true);
    const [notificationModalOpen, setNotificationModalOpen] = useState(false);
    const {userSession, getPortalTimezone} = useSession();
    const {t} = useTranslation();
    const isFutureEvent = !!eventInfo && dayjs(eventInfo.start_time).isAfter(dayjs());
    const canNotifyParticipants = !!userSession
            && checkRoles(userSession.roles, [RoleEnum.ROLE_ORGANIZER, RoleEnum.ROLE_ADMIN])
            && isFutureEvent
            && !!eventInfo
            && eventInfo.participants.length > 0;

    const columns: OxColumnsType<DiveEventResponse> = [
        {
            title: "#",
            dataIndex: "id",
            key: "event_id",
            mobile: true
        },
        {
            title: t("EventDetails.table.startTime"),
            dataIndex: "start_time",
            key: "start_time",
            render: (_: string, record: DiveEventResponse) => {
                return (<>{dayjs(record.start_time).tz(getPortalTimezone()).format("YYYY-MM-DD HH:mm")}</>);
            }
        },
        {
            title: t("EventDetails.table.participants"),
            dataIndex: "participants",
            key: "participants",
            render: (_: string, record: DiveEventResponse) => {
                if (record.participants) {
                    return (<>{record.participants.length} / {record.max_participants}</>);
                }
            }
        },
        {
            title: t("EventDetails.table.maxDuration"),
            dataIndex: "max_duration",
            key: "max_duration"
        },
        {
            title: t("EventDetails.table.maxDepth"),
            dataIndex: "max_depth",
            key: "max_depth"
        },
        {
            title: t("EventDetails.table.type"),
            dataIndex: "type",
            key: "type",
            filters: Object.values(DiveTypeEnum).map((value) => ({text: t(`DiveTypeEnum.${value}`), value})),
            render: (_, record: DiveEventResponse) => diveTypeEnum2Tag(record.type, t, record.id)
        },
        {
            title: t("EventDetails.table.organizer"),
            dataIndex: "organizer",
            key: "organizer",
            render: (_: string, record: DiveEventResponse) => {
                if (record.organizer === null) {
                    return (<></>);
                }
                if (userSession && checkRoles(userSession.roles, [RoleEnum.ROLE_ORGANIZER, RoleEnum.ROLE_ADMIN])) {
                    return (<Link to={"/users/" + record.organizer.id + "/show"}>{record.organizer.last_name} {record.organizer.first_name}</Link>);
                }
                return (<>{record.organizer.last_name} {record.organizer.first_name}</>);
            }
        },
        {
            title: t("EventDetails.table.phoneNumber"),
            dataIndex: "phone_number",
            key: "phone_number",
            render: (_: string, record: DiveEventResponse) => {
                if (record.organizer === null) {
                    return (<></>);
                }

                return (<>{record.organizer.phone_number}</>);
            }
        }
    ];

    let participantColumns: OxColumnsType<ListUserResponse> = [
        {
            title: "#",
            dataIndex: "id",
            key: "id",
            sorter: (a: ListUserResponse, b: ListUserResponse) => a.id - b.id,
            render: (_: string, record: ListUserResponse) => {
                if (userSession && checkRoles(userSession.roles, [RoleEnum.ROLE_ORGANIZER, RoleEnum.ROLE_ADMIN])) {
                    return (<Link to={"/users/" + record.id + "/show"} key={"user-id-link-" + record.id}>{record.id}</Link>);
                }

                return (<>{record.id}</>);
            }
        },
        {
            title: t("EventDetails.participantTable.name"),
            dataIndex: "name",
            key: "name",
            mobile: true,
            sorter: (a: ListUserResponse, b: ListUserResponse) => a.name.localeCompare(b.name),
            render: (_: string, record: ListUserResponse) => {
                if (userSession && checkRoles(userSession.roles, [RoleEnum.ROLE_ORGANIZER, RoleEnum.ROLE_ADMIN])) {
                    return (<Link to={"/users/" + record.id + "/show"} key={"user-name-" + record.id}>{record.name}</Link>);
                }

                return (<>{record.name}</>);
            }
        },
        {
            title: t("EventDetails.participantTable.userType"),
            dataIndex: "user_type",
            key: "user_type",
            filters: Object.values(UserTypeEnum).map((value) => ({text: t(`UserTypeEnum.${value.toLowerCase()}`), value})),
            sorter: (a: ListUserResponse, b: ListUserResponse) => a.user_type.toLowerCase().localeCompare(b.user_type.toLowerCase()),
            render: (_, record: ListUserResponse) => (
                    <>
                        {userTypeEnum2Tag(record.user_type, t, record.id)}
                    </>
            )
        },
        {
            title: t("EventDetails.participantTable.certificateClassification"),
            dataIndex: "certificate_classification_title",
            key: "certificate_classification_title",
            render: (_: string | null, record: ListUserResponse) => record.certificate_classification_title || t("User.form.certificateClassification.none")
        },
        {
            title: t("EventDetails.participantTable.eventDiveCount"),
            dataIndex: "event_dive_count",
            key: "event_dive_count",
            sorter: (a: ListUserResponse, b: ListUserResponse) => a.event_dive_count - b.event_dive_count
        },
        {
            title: t("EventDetails.participantTable.createdAt"),
            dataIndex: "created_at",
            key: "created_at",
            sorter: (a: ListUserResponse, b: ListUserResponse) => dayjs(a.created_at).valueOf() - dayjs(b.created_at).valueOf(),
            render: (_: string, record: ListUserResponse) => {
                return (<>{dayjs(record.created_at).tz(getPortalTimezone()).format("YYYY-MM-DD HH:mm")}</>);
            }
        }

    ];

    if (userSession && checkRoles(userSession.roles, [RoleEnum.ROLE_ORGANIZER, RoleEnum.ROLE_ADMIN])) {
        participantColumns = [...participantColumns,
            {
                title: t("EventDetails.participantTable.payments"),
                dataIndex: "payments",
                key: "payments",
                filters: Object.values(PaymentTypeEnum).map((value) => ({text: t(`PaymentTypeEnum.${value}`), value})),
                onFilter: (value, record) => record.payments.some((payment) =>
                    payment.payment_type === value
                    && (dayjs(payment.end_date).isAfter(dayjs()) || payment.end_date === null)
                    && dayjs(payment.start_date).isBefore(dayjs())
                ),
                render: (_, {payments}) => (
                        <>
                            {payments.map((payment) => {
                                if ((dayjs(payment.end_date).isAfter(dayjs())
                                        || payment.end_date === null)
                                    && dayjs(payment.start_date).isBefore(dayjs())) {
                                    return paymentTypeEnum2Tag(payment.payment_type, t, payment.id);
                                }
                            })}
                        </>
                )
            }];
    }

    useEffect(() => {
        if (!eventInfo || eventInfo.participants === undefined || eventInfo.organizer === undefined) {

            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLoading(true);
        } else {
            setLoading(false);
        }
    }, [eventInfo]);

    return (<Spin spinning={loading} key={"event-spinner"}>
                {eventInfo &&
                        <Space orientation={"vertical"} size={12} key={"event-space"}>
                            <h5 key={"event-main-" + eventInfo.id}>{t("EventDetails.title")}: {eventInfo.title}
                                <Link to={"/events/" + eventInfo.id + "/show"} key={"event-link-" + eventInfo.id}>
                                    <Tooltip title={t("EventDetails.link.tooltip")} key={"tooltip-" + eventInfo.id}>
                                        <LinkOutlined key={"linkout" + eventInfo.id}/>
                                    </Tooltip>
                                </Link>
                            </h5>

                            <p key={"event-desc-" + eventInfo.id}>{t("EventDetails.description.title")}: {eventInfo.description}</p>

                            <OxTable columns={columns}
                                     dataSource={[eventInfo]}
                                     pagination={false}
                                     key={"dive-" + eventInfo.id}
                                     rowKey={(record) => "table-row-" + eventInfo.id + "-" + record.id}
                            />

                            <h5 key={"event-part-" + eventInfo.id}>{t("EventDetails.participants.title")}: ({eventInfo.participants.length}):</h5>
                            {canNotifyParticipants &&
                                    <Button onClick={() => setNotificationModalOpen(true)}>
                                        {t("EventDetails.notificationModal.button")}
                                    </Button>}

                            <OxTable columns={participantColumns}
                                   dataSource={eventInfo.participants}
                                   pagination={false}
                                   key={"parts" + eventInfo.id}
                                   rowKey={(record) => "participant-row-" + record.id}
                            />

                            {eventInfo.waiting_list && eventInfo.waiting_list.length > 0 &&
                                    <>
                                        <h5 key={"event-waiting-list-" + eventInfo.id}>{t("EventDetails.waitingList.title")}:
                                            ({eventInfo.waiting_list.length}):</h5>

                                        <OxTable columns={participantColumns}
                                                 dataSource={eventInfo.waiting_list}
                                                 pagination={false}
                                                 key={"waiting-list-" + eventInfo.id}
                                                 rowKey={(record) => "waiting-list-row-" + record.id}
                                        />
                                    </>}
                        </Space>}
                <Modal
                        title={t("EventDetails.notificationModal.title")}
                        open={notificationModalOpen}
                        onCancel={() => setNotificationModalOpen(false)}
                        footer={null}
                        width={600}
                        destroyOnHidden
                >
                    {eventInfo && (
                            <AdminNotifications
                                    participantIds={eventInfo.participants.map(participant => participant.id)}
                                    onNotificationSent={() => setNotificationModalOpen(false)}
                                    onCancel={() => setNotificationModalOpen(false)}
                                    embedded={true}
                            />
                    )}
                </Modal>
            </Spin>
    );
}
