import {useNavigate, useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {blockedDatesAPI, diveEventAPI, userAPI} from "../../services";
import {
    type BlockedDateResponse,
    type DiveEventRequest,
    type DiveEventResponse,
    DiveEventStatusEnum,
    DiveTypeEnum,
    type ListUserResponse,
    type OptionItemVO,
    PaymentTypeEnum,
    PortalConfigGroupEnum,
    RoleEnum
} from "../../models";
import {useTranslation} from "react-i18next";
import {Button, DatePicker, Form, Input, message, Select, Slider, Space} from "antd";
import dayjs, {Dayjs} from "dayjs";
import TextArea from "antd/es/input/TextArea";
import {useSession} from "../../session";
import {localToUTCDatetime} from "../../tools";

export function EditDiveEvent() {
    const navigator = useNavigate();
    const {paramId} = useParams();
    const [diveEventId, setDiveEventId] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [diveEvent, setDiveEvent] = useState<DiveEventResponse | null>(null);
    const {t} = useTranslation();
    const [blockedDates, setBlockedDates] = useState<Date[]>([]);

    const [organizerOptions, setOrganizerOptions] = useState<OptionItemVO[]>([]);
    const [participantOptions, setParticipantOptions] = useState<OptionItemVO[]>([]);

    const [submitButtonText, setSubmitButtonText] = useState(t("EditEvent.form.submitButton.update"));

    const [maxDepth, setMaxDepth] = useState<number>(60);
    const [maxDiveLength, setMaxDiveLength] = useState<number>(120);
    const [minParticipants, setMinParticipants] = useState<number>(2);
    const [maxParticipants, setMaxParticipants] = useState<number>(20);
    const [minEventLength, setMinEventLength] = useState<number>(1);
    const [maxEventLength, setMaxEventLength] = useState<number>(6);
    const [eventTypes, setEventTypes] = useState<{ value: string, label: string }[]>([]);

    const [eventDurationMarks, setEventDurationMarks] = useState<{ [key: number]: string }>({});
    const [diveLengthMarks, setDiveLengthMarks] = useState<{ [key: number]: string }>({});
    const [depthMarks, setDepthMarks] = useState<{ [key: number]: string }>({});
    const [participantsMarks, setParticipantsMarks] = useState<{ [key: number]: string }>({});

    const {getPortalTimezone, getFrontendConfigurationValue, getPortalConfigurationValue} = useSession();

    const statusOptions: OptionItemVO[] = [
        {value: DiveEventStatusEnum.DRAFTED, label: t("common.dive-event.status.drafted")},
        {value: DiveEventStatusEnum.PUBLISHED, label: t("common.dive-event.status.published")},
        {value: DiveEventStatusEnum.HELD, label: t("common.dive-event.status.held")},
        {value: DiveEventStatusEnum.CANCELLED, label: t("common.dive-event.status.cancelled")},
    ];

    const [diveEventForm] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        function populateOrganizerList(organizers: ListUserResponse[]): void {
            let organizerList = [];

            for (let i = 0; i < organizers.length; i++) {
                organizerList.push({value: organizers[i].id, label: organizers[i].name});
            }
            setOrganizerOptions(organizerList);
        }

        function populateParticipantList(users: ListUserResponse[], thisEventId: number): void {
            let participantList = [];
            const requiresMembership = getPortalConfigurationValue(PortalConfigGroupEnum.MEMBERSHIP, "event-require-membership") === "true";
            const requiresActivePayment = getPortalConfigurationValue(PortalConfigGroupEnum.PAYMENT, "event-require-payment") === "true";

            for (let i = 0; i < users.length; i++) {
                if ((requiresMembership && !users[i].membershipActive)
                        || (requiresActivePayment && users[i].payments.length === 0)) {
                    continue;
                }

                // Next check of the list of payments of the users are all expired or empty
                let hasValidPayment = false;

                for (let j = 0; j < users[i].payments.length; j++) {
                    const payment = users[i].payments[j];
                    // If the user has an active periodical payment
                    if (payment.paymentType === PaymentTypeEnum.PERIOD
                            && dayjs(payment.expiresAt).isAfter(dayjs())) {
                        hasValidPayment = true;
                        break;
                    } else if (payment.paymentType === PaymentTypeEnum.ONE_TIME
                            && (dayjs(payment.expiresAt).isAfter(dayjs())
                                    || payment.expiresAt === null)
                            && (payment.paymentCount > 0
                                    || payment.boundEvents.includes(thisEventId))) {
                        hasValidPayment = true;
                        break;
                    }
                }

                if (!hasValidPayment) {
                    continue;
                }

                participantList.push({value: users[i].id, label: users[i].name + " (" + users[i].id + ")"});
            }

            setParticipantOptions(participantList);
        }

        function getMarks(min: number, max: number, step: number, suffix: string): { [key: number]: string } {
            let marks: { [key: number]: string } = {};
            for (let i = min; i <= max; i += step) {
                marks[i] = i.toString() + suffix;
            }
            return marks;
        }

        function setFrontendValues(): void {
            // Find max-depth from portalConfiguration array and set it to state
            const maxDepth = parseInt(getFrontendConfigurationValue("max-depth"));
            setMaxDepth(maxDepth);
            setDepthMarks(getMarks(10, maxDepth, 10, "m"));
            diveEventForm.setFieldsValue({maxDepth: maxDepth});

            const maxDiveLength = parseInt(getFrontendConfigurationValue("max-dive-length"));
            setMaxDiveLength(maxDiveLength);
            setDiveLengthMarks(getMarks(30, maxDiveLength, 60, " min"));
            diveEventForm.setFieldsValue({maxDuration: maxDiveLength});

            const minEventLength = parseInt(getFrontendConfigurationValue("min-event-length"));
            const maxEventLength = parseInt(getFrontendConfigurationValue("max-event-length"));
            setMinEventLength(minEventLength);
            setMaxEventLength(maxEventLength);
            setEventDurationMarks(getMarks(minEventLength, maxEventLength, 2, "h"));

            const minParticipants = parseInt(getFrontendConfigurationValue("min-participants"));
            const maxParticipants = parseInt(getFrontendConfigurationValue("max-participants"));
            setMinParticipants(minParticipants);
            setMaxParticipants(maxParticipants);
            setParticipantsMarks(getMarks(minParticipants, maxParticipants, 5, ""));

            const eventTypes: string[] = getFrontendConfigurationValue("types-of-event").split(",");
            eventTypes.sort();
            setEventTypes(eventTypes.map((type) => {
                return {value: type, label: t("DiveTypeEnum." + type)};
            }));
        }

        setLoading(true);
        setFrontendValues();
        let tmpDiveEventId = 0;

        if (paramId !== undefined && !Number.isNaN(parseInt(paramId))) {
            tmpDiveEventId = parseInt(paramId);
            setDiveEventId(tmpDiveEventId);
        }

        if (tmpDiveEventId > 0) { // We're editing an existing dive event
            Promise.all([
                diveEventAPI.findById(tmpDiveEventId, null),
                userAPI.findByRole(RoleEnum.ROLE_ORGANIZER),
                userAPI.findByRole(RoleEnum.ROLE_USER),
                blockedDatesAPI.findAll()
            ])
                    .then(([eventResponse, organizerResponses, participantResponses, blockedDatesResponses]) => {
                        setDiveEvent(JSON.parse(JSON.stringify(eventResponse)));
                        populateOrganizerList(organizerResponses);
                        populateParticipantList(participantResponses, tmpDiveEventId);
                        const dates = blockedDatesResponses.map((item: BlockedDateResponse) => dayjs(item.blockedDate).toDate());
                        setBlockedDates(dates);
                    })
                    .catch((error) => {
                        console.error(error);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        } else { // We're creating a new dive event
            Promise.all([
                userAPI.findByRole(RoleEnum.ROLE_ORGANIZER),
                userAPI.findByRole(RoleEnum.ROLE_USER),
                blockedDatesAPI.findAll()
            ])
                    .then(([organizerResponse, participantResponse, blockedDatesResponses]) => {
                        populateOrganizerList(organizerResponse);
                        populateParticipantList(participantResponse, tmpDiveEventId);
                        setDiveEvent(
                                {
                                    id: 0,
                                    title: "",
                                    description: "",
                                    type: DiveTypeEnum.SURFACE,
                                    // startTime is a string in the model; store an ISO string
                                    startTime: nextEventTime().toISOString(),
                                    eventDuration: 6,
                                    maxDuration: 120,
                                    maxDepth: 60,
                                    maxParticipants: 12,
                                    organizer: null,
                                    participants: [],
                                    status: DiveEventStatusEnum.DRAFTED,
                                    eventCommentId: 0,
                                }
                        );
                        const dates = blockedDatesResponses.map((item: BlockedDateResponse) => dayjs(item.blockedDate).toDate());
                        setBlockedDates(dates);
                    })
                    .catch((error) => {
                        console.error(error);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            setSubmitButtonText(t("EditEvent.form.submitButton.add"));
        }
    }, [paramId, t, getFrontendConfigurationValue, getPortalConfigurationValue]);

    function disabledDate(current: Dayjs): boolean {
        return current && (blockedDates.some(date => dayjs(date).isSame(current, "day")) || current < dayjs().startOf("day"));
    }

    // This calculates when the next event could be, general rule is to take current time, take mod 30 on the minutes and add 30 minutes
    function nextEventTime(): dayjs.Dayjs {
        let now = dayjs();
        let nextEvent: dayjs.Dayjs;

        if (now.minute() % 30 === 0) {
            nextEvent = now.add(30, "minute");
        } else {
            nextEvent = now.add(60 - now.minute() % 30, "minute");
        }

        return nextEvent;
    }

    function validateMaxParticipants(_: any, value: number): Promise<void> {
        // Get the selected participant IDs
        const selectedParticipants = diveEventForm.getFieldValue("participants");

        // Ensure that the input value is not less than the number of selected participants
        if (value < (selectedParticipants.length + 1)) {
            return Promise.reject(t("EditEvent.form.maxDepth.rules.maxParticipants"));
        }

        return Promise.resolve();
    }

    function validateSelectedParticipants(_: any, _1: number): Promise<void> {
        // Get the selected participant IDs
        const selectedParticipants = diveEventForm.getFieldValue("participants");
        // Get the set maxParticipants value
        const setMaxParticipants = diveEventForm.getFieldValue("maxParticipants");
        // Ensure that the input value is not less than the number of selected participants

        if (selectedParticipants.length >= setMaxParticipants) {
            return Promise.reject(t("EditEvent.form.maxDepth.rules.maxParticipants"));
        }

        return Promise.resolve();
    }

    function onFinish(submitValues: DiveEventRequest) {
        // First make sure we're not editing an event in the past
        if (dayjs().isAfter(dayjs(submitValues.startTime).add(submitValues.eventDuration, "hour"))) {
            messageApi.error(t("EditEvent.oldEvent.alertText"));
            setLoading(false);
            return;
        }

        if (submitValues.organizerId <= 0) {
            messageApi.error(t("EditEvent.onFinish.updateStatusFail"));
            setLoading(false);
            return;
        }

        setLoading(true);
        // Normalize to minute precision
        const normalizedStart = dayjs(submitValues.startTime).second(0).millisecond(0);
        // Shift the datetime to the configured timezone (UTC) and send as ISO string
        const utcStart = localToUTCDatetime(normalizedStart, getPortalTimezone());
        submitValues.startTime = utcStart.toISOString();

        // Check also that the new maxParticipants value is not lower than the current number of participants
        if (submitValues.maxParticipants < submitValues.participants.length) {
            messageApi.error(t("EditEvent.onFinish.updateStatusFailMaxParticipant"));
            setLoading(false);
            return;
        }

        if (diveEventId && diveEventId !== 0) {
            diveEventAPI.update(submitValues)
                    .then((response) => {
                        // If we get back the same ID as we sent, we assume the update was successful
                        // The eventId is a string, so we need to convert it to int
                        if (response.id === diveEventId) {
                            messageApi.success(t("EditEvent.onFinish.updateStatusOk"));
                        } else {
                            messageApi.error(t("EditEvent.onFinish.updateStatusFail"));
                            return;
                        }
                    })
                    .catch(e => {
                        console.error("Failed to update event:", e);
                        messageApi.error(e);
                        return;
                    });
        } else {
            submitValues.id = 0;
            diveEventAPI.create(submitValues)
                    .then((response) => {
                        // If we get back a non-zero positive ID as we sent, we assume the update was successful
                        if (response && !isNaN(response.id) && response.id > 0) {
                            messageApi.success(t("EditEvent.onFinish.addStatusOk"));
                        } else {
                            messageApi.error(t("EditEvent.onFinish.addStatusFail"));
                            return;
                        }
                    })
                    .catch(e => {
                        console.error("Failed to create event:", e);
                        messageApi.error(e);
                        return;
                    });
        }

        setLoading(false);
        navigator("/events/main");
    }

    function onFinishFail(errorInfo: { errorFields: { errors: any[]; }[]; }) {
        messageApi.success(errorInfo.errorFields[0].errors[0]);
    }

    return (
            <div className={"darkDiv"}>
                {contextHolder}
                <h4>{t("EditEvent.title")}</h4>
                {!loading && diveEvent && <Form
                        form={diveEventForm}
                        name={"event"}
                        labelCol={{span: 8}}
                        wrapperCol={{span: 12}}
                        style={{maxWidth: 800}}
                        initialValues={{
                            id: diveEvent.id,
                            organizerId: (diveEvent.organizer ? diveEvent.organizer.id : 0),
                            title: diveEvent.title,
                            description: diveEvent.description,
                            type: diveEvent.type,
                            // Convert string -> dayjs for DatePicker
                            startTime: diveEvent.startTime ? dayjs(diveEvent.startTime) : nextEventTime(),
                            eventDuration: diveEvent.eventDuration,
                            maxDuration: diveEvent.maxDuration,
                            maxDepth: diveEvent.maxDepth,
                            maxParticipants: diveEvent.maxParticipants,
                            status: diveEvent.status,
                            participants: diveEvent.participants.map((participant) => {
                                return participant.id;
                            })
                        }}
                        onFinish={onFinish}
                        onFinishFailed={onFinishFail}
                        autoComplete={"off"}
                        scrollToFirstError={true}
                        validateTrigger={["onBlur", "onChange"]}
                >
                    <Form.Item name={"id"} label={"ID"} style={{display: "none"}}>
                        <Input type={"text"}/>
                    </Form.Item>
                    <Form.Item name={"organizerId"}
                               required={true}
                               label={t("EditEvent.form.organizerId.label")}
                               tooltip={t("EditEvent.form.organizerId.tooltip")}
                               rules={[
                                   {
                                       required: true,
                                       message: t("EditEvent.form.organizerId.rules.required")
                                   },
                                   {
                                       min: 1,
                                       message: t("EditEvent.form.organizerId.rules.required"),
                                       validator: (_, value) => {
                                           if (value > 0) {
                                               return Promise.resolve();
                                           }
                                           return Promise.reject(new Error(t("EditEvent.form.organizerId.rules.required")));
                                       }
                                   }
                               ]}>
                        <Select options={organizerOptions}
                                showSearch={true}
                                allowClear={true}
                        />
                    </Form.Item>
                    <Form.Item name={"title"}
                               required={true}
                               label={t("EditEvent.form.title.label")}
                               tooltip={t("EditEvent.form.title.tooltip")}
                               rules={[
                                   {
                                       required: true,
                                       message: t("EditEvent.form.title.rules.required")
                                   },
                                   {
                                       min: 4,
                                       message: t("EditEvent.form.title.rules.min")
                                   }
                               ]}>
                        <Input placeholder={t("EditEvent.form.title.placeholder")}/>
                    </Form.Item>
                    <Form.Item name={"description"}
                               required={true}
                               label={t("EditEvent.form.description.label")}
                               tooltip={t("EditEvent.form.description.tooltip")}
                               rules={[
                                   {
                                       required: true,
                                       message: t("EditEvent.form.description.rules.required")
                                   },
                                   {
                                       min: 20,
                                       message: t("EditEvent.form.description.rules.min")
                                   },
                                   {
                                       max: 15000,
                                       message: t("EditEvent.form.description.rules.max")
                                   }
                               ]}>
                        <TextArea placeholder={t("EditEvent.form.description.placeholder")} rows={6}/>
                    </Form.Item>
                    <Form.Item name={"type"}
                               required={true}
                               label={t("EditEvent.form.type.label")}
                               tooltip={t("EditEvent.form.type.tooltip")}
                               rules={[
                                   {
                                       required: true,
                                       message: t("EditEvent.form.type.rules.required"),
                                       validator: (_, value) => {

                                           if (value && value.length > 0) {
                                               if (eventTypes.findIndex((et) => et.value === value) >= 0) {
                                                   return Promise.resolve();
                                               }
                                           }

                                           return Promise.reject(new Error(t("EditEvent.form.type.rules.required")));
                                       }
                                   }
                               ]}>
                        <Select options={eventTypes}/>
                    </Form.Item>
                    <Form.Item name={"startTime"}
                               required={true}
                               label={t("EditEvent.form.startTime.label")}
                               tooltip={t("EditEvent.form.startTime.tooltip")}
                               rules={[
                                   {
                                       required: true,
                                       message: t("EditEvent.form.startTime.rules.required")
                                   },
                                   () => ({
                                       validator(_, value) {
                                           // Allow past times if editing; otherwise require at least 30 minutes in the future
                                           if (diveEventId > 0) {
                                               return Promise.resolve();
                                           }
                                           if (value && dayjs().isBefore(dayjs(value).subtract(30, "minute"))) {
                                               return Promise.resolve();
                                           }

                                           return Promise.reject(new Error(t("EditEvent.form.startTime.rules.validator")));
                                       },
                                   })
                               ]}
                    >
                        <DatePicker
                                disabledDate={disabledDate}
                                showTime={{format: "HH:mm", defaultValue: dayjs()}}
                                minuteStep={30 as 30}
                                format={"YYYY-MM-DD HH:mm"}
                        />
                    </Form.Item>
                    <Form.Item name={"eventDuration"}
                               required={true}
                               label={t("EditEvent.form.eventDuration.label")}
                               tooltip={t("EditEvent.form.eventDuration.tooltip")}>
                        <Slider min={minEventLength} max={maxEventLength} step={1} marks={eventDurationMarks}/>
                    </Form.Item>
                    <Form.Item name={"maxDuration"}
                               required={true}
                               label={t("EditEvent.form.maxDuration.label")}
                               tooltip={t("EditEvent.form.maxDuration.tooltip")}>
                        <Slider min={30} max={maxDiveLength} step={10} marks={diveLengthMarks}/>
                    </Form.Item>
                    <Form.Item name={"maxDepth"}
                               required={true}
                               label={t("EditEvent.form.maxDepth.label")}
                               tooltip={t("EditEvent.form.maxDepth.tooltip")}>
                        <Slider min={10} max={maxDepth} step={5} marks={depthMarks}/>
                    </Form.Item>
                    <Form.Item name={"maxParticipants"}
                               required={true}
                               label={t("EditEvent.form.maxParticipants.label")}
                               tooltip={t("EditEvent.form.maxParticipants.tooltip")}
                               rules={[
                                   {validator: validateMaxParticipants}
                               ]}
                    >
                        <Slider min={minParticipants} max={maxParticipants} step={1} marks={participantsMarks}/>
                    </Form.Item>
                    <Form.Item name={"status"}
                               required={true}
                               label={t("EditEvent.form.status.label")}
                               tooltip={t("EditEvent.form.status.tooltip")}
                               key={"dive-event-status"}
                               rules={[
                                   {
                                       required: true,
                                       message: t("EditEvent.form.status.rules.required")
                                   }
                               ]}
                    >
                        <Select options={statusOptions}/>
                    </Form.Item>
                    <Form.Item name={"participants"}
                               label={t("EditEvent.form.participants.label")}
                               tooltip={t("EditEvent.form.participants.tooltip")}
                               rules={[
                                   {validator: validateSelectedParticipants},
                               ]}
                    >
                        <Select
                                mode="multiple"
                                options={participantOptions}
                                placeholder={t("EditEvent.form.participants.placeholder")}
                                showSearch={true}
                                filterOption={(input, option) =>
                                        option?.label.toLowerCase().includes(input.toLowerCase()) ?? false
                                }
                                style={{
                                    width: "100%"
                                }}
                        />
                    </Form.Item>

                    <Space orientation={"horizontal"} size={12} style={{width: "100%", justifyContent: "center"}}>
                        <Button
                                type={"primary"}
                                htmlType={"submit"}
                                disabled={loading}
                        >{submitButtonText}</Button>
                        <Button
                                type={"default"}
                                htmlType={"reset"}
                                disabled={loading}
                        >{t("common.button.reset")}</Button>
                        {diveEvent && diveEvent.participants.length > 0 &&
                                <Button
                                        href={"/events/" + diveEventId + "/set-dives"}
                                        disabled={loading}
                                >{t("EditEvent.form.button.updateDives")}</Button>}
                    </Space>
                </Form>}
            </div>
    );
}