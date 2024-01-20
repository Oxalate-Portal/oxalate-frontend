import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { diveEventAPI, userAPI } from "../../services";
import { DiveEventResponse, DiveEventUserResponse } from "../../models/responses";
import { OptionItemVO, RoleEnum, UpdateStatusEnum, UpdateStatusVO } from "../../models";
import { useTranslation } from "react-i18next";
import { Alert, Button, DatePicker, Form, Input, Select, Slider, Space, Switch } from "antd";
import dayjs from "dayjs";
import { SubmitResult } from "../main";
import TextArea from "antd/es/input/TextArea";
import { DiveEventRequest } from "../../models/requests";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

export function EditDiveEvent() {
    const {paramId} = useParams();
    const [diveEventId, setDiveEventId] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [diveEvent, setDiveEvent] = useState<DiveEventResponse | null>(null);
    const {t} = useTranslation();
    const [updateStatus, setUpdateStatus] = useState<UpdateStatusVO>({status: UpdateStatusEnum.NONE, message: ""});
    const navigate = useNavigate();

    const [organizerOptions, setOrganizerOptions] = useState<OptionItemVO[]>([]);
    const [participantOptions, setParticipantOptions] = useState<OptionItemVO[]>([]);

    const [submitButtonText, setSubmitButtonText] = useState(t('EditEvent.form.submitButton.update'));

    const eventDurationMarks = {1: '1h', 6: '6h', 12: '12h', 24: '24h'};
    const maxDurationMarks = {30: '30 min', 60: '60 min', 120: '120 min', 180: '180 min', 240: '240 min'};
    const maxDepthMarks = {10: '10m', 30: '30m', 60: '60m', 90: '90m', 120: '120m', 180: '180m'};
    const maxParticipantsMarks = {4: '4', 8: '8', 12: '12', 16: '16', 20: '20', 24: '24', 30: '30'};

    const eventTypes = [
        {value: 'DIVE', label: t('EditEvent.eventTypes.dive')},
        {value: 'Luola', label: t('EditEvent.eventTypes.cave')},
        {value: 'Luola / Avo', label: t('EditEvent.eventTypes.caveOpen')},
        {value: 'Avo', label: t('EditEvent.eventTypes.open')},
        {value: 'Vain pintatoimintaa', label: t('EditEvent.eventTypes.surface')},
        {value: 'Muu', label: t('EditEvent.eventTypes.other')}
    ];

    const [diveEventForm] = Form.useForm();

    useEffect(() => {
        function populateOrganizerList(organizers: DiveEventUserResponse[]): void {
            let organizerList = [];

            for (let i = 0; i < organizers.length; i++) {
                organizerList.push({value: organizers[i].id, label: organizers[i].name});
            }
            setOrganizerOptions(organizerList);
        }

        function populateParticipantList(users: DiveEventUserResponse[]): void {
            let participantList = [];

            for (let i = 0; i < users.length; i++) {
                participantList.push({value: users[i].id, label: users[i].name});
            }
            setParticipantOptions(participantList);
        }

        setLoading(true);
        let tmpDiveEventId = 0;

        if (paramId !== undefined && !Number.isNaN(parseInt(paramId))) {
            tmpDiveEventId = parseInt(paramId);
            setDiveEventId(tmpDiveEventId);
        }

        if (tmpDiveEventId > 0) { // We're editing an existing dive event
            Promise.all([
                diveEventAPI.findById(tmpDiveEventId, null),
                userAPI.findByRole(RoleEnum.ROLE_ORGANIZER),
                userAPI.findByRole(RoleEnum.ROLE_USER)
            ]).then(([eventResponse, organizerResponses, participantResponses]) => {
                setDiveEvent(JSON.parse(JSON.stringify(eventResponse)));
                populateOrganizerList(organizerResponses);
                populateParticipantList(participantResponses);
                setLoading(false);
            }).catch((error) => {
                console.error(error);
            })
        } else { // We're creating a new dive event
            Promise.all([
                userAPI.findByRole(RoleEnum.ROLE_ORGANIZER),
                userAPI.findByRole(RoleEnum.ROLE_USER)
            ]).then(([organizerResponse, participantResponse]) => {
                populateOrganizerList(organizerResponse);
                populateParticipantList(participantResponse);
                setDiveEvent(
                        {
                            id: 0,
                            title: '',
                            description: '',
                            type: '',
                            startTime: nextEventTime().toDate(),
                            eventDuration: 6,
                            maxDuration: 120,
                            maxDepth: 60,
                            maxParticipants: 12,
                            organizer: null,
                            participants: [],
                            published: false
                        }
                )

                setLoading(false);
            }).catch((error) => {
                console.error(error);
            })
            setSubmitButtonText(t('EditEvent.form.submitButton.add'));
        }
    }, [paramId, t]);

    // This calculates when the next event could be, general rule is to take current time, take mod 30 on the minutes and add 30 minutes
    function nextEventTime(): dayjs.Dayjs {
        let now = dayjs();
        let nextEvent: dayjs.Dayjs;

        if (now.minute() % 30 === 0) {
            nextEvent = now.add(30, 'minute');
        } else {
            nextEvent = now.add(60 - now.minute() % 30, 'minute');
        }

        return nextEvent;
    }

    function validateMaxParticipants(_: any, value: number): Promise<void> {
        // Get the selected participant IDs
        const selectedParticipants = diveEventForm.getFieldValue('participants');

        // Ensure that the input value is not less than the number of selected participants
        if (value < selectedParticipants.length) {
            return Promise.reject(t('EditEvent.form.maxDepth.rules.maxParticipants'));
        }

        return Promise.resolve();
    }

    function onFinish(submitValues: DiveEventRequest) {
        console.debug("Submit data: ", submitValues);
        setLoading(true);
        // Check also that the new maxParticipants value is not lower than the current number of participants
        if (submitValues.maxParticipants < submitValues.participants.length) {
            setUpdateStatus({
                status: UpdateStatusEnum.FAIL,
                message: t('EditEvent.onFinish.updateStatusFailMaxPartisipant')
            });
            setLoading(false);
            return;
        }

        if (diveEventId && diveEventId !== 0) {
            diveEventAPI.update(submitValues)
                    .then((response) => {
                        // If we get back the same ID as we sent, we assume the update was successful
                        // The eventId is a string, so we need to convert it to int
                        if (response.id === diveEventId) {
                            setUpdateStatus({
                                status: UpdateStatusEnum.OK,
                                message: t('EditEvent.onFinish.updateStatusOk')
                            });
                        } else {
                            setUpdateStatus({
                                status: UpdateStatusEnum.FAIL,
                                message: t('EditEvent.onFinish.updateStatusFail')
                            });
                        }
                    })
                    .catch(e => {
                        console.log("Failed to update event:", e);
                        setUpdateStatus({status: UpdateStatusEnum.FAIL, message: e});
                    });
        } else {
            submitValues.id = 0;
            diveEventAPI.create(submitValues)
                    .then((response) => {
                        // If we get back an non-zero positive ID as we sent, we assume the update was successful
                        if (response && !isNaN(response.id) && response.id > 0) {
                            setUpdateStatus({status: UpdateStatusEnum.OK, message: t('EditEvent.onFinish.addStatusOk')});
                        } else {
                            setUpdateStatus({
                                status: UpdateStatusEnum.FAIL,
                                message: t('EditEvent.onFinish.addStatusFail')
                            });
                        }
                    })
                    .catch(e => {
                        console.log("Failed to create event:", e);
                        setUpdateStatus({status: UpdateStatusEnum.FAIL, message: e});
                    });
        }
        setLoading(false);
    }

    function onFinishFail(errorInfo: { errorFields: { errors: any[]; }[]; }) {
        setUpdateStatus({status: UpdateStatusEnum.FAIL, message: errorInfo.errorFields[0].errors[0]});
    }

    if (updateStatus.status !== UpdateStatusEnum.NONE) {
        return <SubmitResult updateStatus={updateStatus} navigate={navigate}/>;
    } else if (diveEvent && diveEvent.id > 0 && diveEvent.startTime && dayjs().isAfter(dayjs(diveEvent.startTime).add(diveEvent.eventDuration, 'hour'))) {
        return (<div>
            <Alert type={'error'}
                   message={t('EditEvent.oldEvent.alertText')}/>
            <Button onClick={() => navigate(-1)}>{t('common.button.back')}</Button>
        </div>);
    }

    return (
            <div className={'darkDiv'}>
                <h4>{t('EditEvent.title')}</h4>
                {!loading && diveEvent && <Form
                        form={diveEventForm}
                        name={'event'}
                        labelCol={{span: 8}}
                        wrapperCol={{span: 12}}
                        style={{maxWidth: 800}}
                        initialValues={{
                            id: diveEvent.id,
                            organizerId: (diveEvent.organizer ? diveEvent.organizer.id : 0),
                            title: diveEvent.title,
                            description: diveEvent.description,
                            type: diveEvent.type,
                            startTime: diveEvent.startTime ? dayjs(diveEvent.startTime) : nextEventTime(),
                            eventDuration: diveEvent.eventDuration,
                            maxDuration: diveEvent.maxDuration,
                            maxDepth: diveEvent.maxDepth,
                            maxParticipants: diveEvent.maxParticipants,
                            published: diveEvent.published,
                            participants: diveEvent.participants.map((participant) => {
                                return participant.id
                            })
                        }}
                        onFinish={onFinish}
                        onFinishFailed={onFinishFail}
                        autoComplete={'off'}
                        scrollToFirstError={true}
                        validateTrigger={['onBlur', 'onChange']}
                >
                    <Form.Item name={'id'} label={'ID'} style={{display: 'none'}}>
                        <Input type={'text'}/>
                    </Form.Item>
                    <Form.Item name={'organizerId'}
                               required={true}
                               label={t('EditEvent.form.organizerId.label')}
                               tooltip={t('EditEvent.form.organizerId.tooltip')}
                               rules={[
                                   {
                                       required: true,
                                       message: t('EditEvent.form.organizerId.rules.required')
                                   }
                               ]}>
                        <Select options={organizerOptions}
                                showSearch={true}
                                allowClear={true}
                        />
                    </Form.Item>
                    <Form.Item name={'title'}
                               required={true}
                               label={t('EditEvent.form.title.label')}
                               tooltip={t('EditEvent.form.title.tooltip')}
                               rules={[
                                   {
                                       required: true,
                                       message: t('EditEvent.form.title.rules.required')
                                   },
                                   {
                                       min: 4,
                                       message: t('EditEvent.form.title.rules.min')
                                   }
                               ]}>
                        <Input placeholder={t('EditEvent.form.title.placeholder')}/>
                    </Form.Item>
                    <Form.Item name={'description'}
                               required={true}
                               label={t('EditEvent.form.description.label')}
                               tooltip={t('EditEvent.form.description.tooltip')}
                               rules={[
                                   {
                                       required: true,
                                       message: t('EditEvent.form.description.rules.required')
                                   },
                                   {
                                       min: 20,
                                       message: t('EditEvent.form.description.rules.min')
                                   },
                                   {
                                       max: 15000,
                                       message: t('EditEvent.form.description.rules.max')
                                   }
                               ]}>
                        <TextArea placeholder={t('EditEvent.form.description.placeholder')} rows={6}/>
                    </Form.Item>
                    <Form.Item name={'type'}
                               required={true}
                               label={t('EditEvent.form.type.label')}
                               tooltip={t('EditEvent.form.type.tooltip')}
                               rules={[
                                   {
                                       required: true,
                                       message: t('EditEvent.form.type.rules.required')
                                   }
                               ]}>
                        <Select options={eventTypes}/>
                    </Form.Item>
                    <Form.Item name={'startTime'}
                               required={true}
                               label={t('EditEvent.form.startTime.label')}
                               tooltip={t('EditEvent.form.startTime.tooltip')}
                               rules={[
                                   {
                                       required: true,
                                       message: t('EditEvent.form.startTime.rules.required')
                                   },
                                   () => ({
                                       validator(_, value) {
                                           if (value && dayjs().isBefore(value - 30 * 60 * 1000)) {
                                               return Promise.resolve();
                                           }

                                           return Promise.reject(new Error(t('EditEvent.form.startTime.rules.validator')));
                                       },
                                   })
                               ]}
                    >
                        <DatePicker
                                showTime={{format: 'HH:mm', defaultValue: dayjs()}}
                                minuteStep={30 as 30}
                                format={'YYYY-DD-MM HH:mm'}
                        />
                    </Form.Item>
                    <Form.Item name={'eventDuration'}
                               required={true}
                               label={t('EditEvent.form.eventDuration.label')}
                               tooltip={t('EditEvent.form.eventDuration.tooltip')}>
                        <Slider min={1} max={24} step={1} marks={eventDurationMarks}/>
                    </Form.Item>
                    <Form.Item name={'maxDuration'}
                               required={true}
                               label={t('EditEvent.form.maxDuration.label')}
                               tooltip={t('EditEvent.form.maxDuration.tooltip')}>
                        <Slider min={30} max={240} step={10} marks={maxDurationMarks}/>
                    </Form.Item>
                    <Form.Item name={'maxDepth'}
                               required={true}
                               label={t('EditEvent.form.maxDepth.label')}
                               tooltip={t('EditEvent.form.maxDepth.tooltip')}>
                        <Slider min={10} max={180} step={5} marks={maxDepthMarks}/>
                    </Form.Item>
                    <Form.Item name={'maxParticipants'}
                               required={true}
                               label={t('EditEvent.form.maxParticipants.label')}
                               tooltip={t('EditEvent.form.maxParticipants.tooltip')}
                               rules={[
                                   {validator: validateMaxParticipants}
                               ]}
                    >
                        <Slider min={3} max={29} step={1} marks={maxParticipantsMarks}/>
                    </Form.Item>
                    <Form.Item name={'published'}
                               required={true}
                               label={t('EditEvent.form.published.label')}
                               tooltip={t('EditEvent.form.published.tooltip')}
                               valuePropName={'checked'}>
                        <Switch/>
                    </Form.Item>
                    <Form.Item name={'participants'}
                               label={t('EditEvent.form.participants.label')}
                               tooltip={t('EditEvent.form.participants.tooltip')}
                    >
                        <Select
                                mode="multiple"
                                options={participantOptions}
                                placeholder={t('EditEvent.form.participants.placeholder')}
                                showSearch={true}
                                style={{
                                    width: "100%"
                                }}
                        />
                    </Form.Item>

                    <Space direction={'horizontal'} size={12} style={{width: '100%', justifyContent: 'center'}}>
                        <Button
                                type={'primary'}
                                htmlType={'submit'}
                                disabled={loading}
                        >{submitButtonText}</Button>
                        <Button
                                type={'default'}
                                htmlType={'reset'}
                                disabled={loading}
                        >{t('common.button.reset')}</Button>
                        {diveEvent && diveEvent.participants.length > 0 &&
                                <Button
                                        href={'/events/' + diveEventId + '/set-dives'}
                                        disabled={loading}
                                >{t('EditEvent.form.button.updateDives')}</Button>}
                    </Space>
                </Form>}
            </div>
    );
}