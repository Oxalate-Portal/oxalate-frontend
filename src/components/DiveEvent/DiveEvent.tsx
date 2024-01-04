import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {useSession} from "../../session";
import {useTranslation} from "react-i18next";
import {diveEventAPI} from "../../services";
import {DiveEventResponse} from "../../models/responses";
import {DiveEventDetails} from "./DiveEventDetails";
import dayjs from "dayjs";
import {SessionVO} from "../../models";
import {Spin} from "antd";

export function DiveEvent() {
    const {paramId} = useParams();
    const [diveEventId, setDiveEventId] = useState<number>(0);
    const [diveEvent, setDiveEvent] = useState<DiveEventResponse | null>(null);
    const {userSession} = useSession();
    const {t} = useTranslation();
    const [loading, setLoading] = useState<boolean>(true);
    const [canSubscribe, setCanSubscribe] = useState(false);
    const [subscribing, setSubscribing] = useState(false);

    useEffect(() => {
        if (paramId?.length === 0) {
            console.error("Invalid dive event id:", paramId);
            return;
        }

        let tmpEventId = 0;
        if (paramId !== undefined && !Number.isNaN(parseInt(paramId))) {
            tmpEventId = parseInt(paramId);
            setDiveEventId(tmpEventId);
        }

        if (tmpEventId > 0) {
            setLoading(true);
            console.log("Fetching dive event with id:", tmpEventId);
            diveEventAPI.findById(tmpEventId, null)
                    .then(response => {
                        console.log("Response:", response);
                        setDiveEvent(response);
                    })
                    .catch(error => {
                        console.log("Error:", error);
                    });
            setLoading(false);
        } else {
            console.error("Invalid dive event id:", tmpEventId);

        }

    }, [paramId]);

    useEffect(() => {
        function isUserAllowedToParticipate(userSession: SessionVO | null, diveEvent: DiveEventResponse): boolean {
            if (!userSession) {
                return false;
            }

            const currentUser = userSession.id;
            const isUserTheOrganizer = diveEvent.organizer?.id === currentUser;
            const isUserAlreadyInEvent = isUserParticipating(userSession, diveEvent);
            const isEventFull = diveEvent.participants?.length >= diveEvent.maxParticipants;
            return !isUserTheOrganizer && !isUserAlreadyInEvent && !isEventFull && userSession.approvedTerms;
        }

        function isUserParticipating(userSession: SessionVO | null, diveEvent: DiveEventResponse): boolean {
            if (!userSession) {
                return false;
            }

            const participants = diveEvent.participants?.map(user => user.id);
            return participants?.indexOf(userSession.id) > -1;
        }

        // If the event has passed, we don't want to show the subscribe button
        if (diveEvent) {
            if (dayjs().isAfter(dayjs(diveEvent.startTime).add(diveEvent.eventDuration, 'hour'))) {
                setCanSubscribe(false);
                setSubscribing(false);
                return;
            }

            setCanSubscribe(isUserAllowedToParticipate(userSession, diveEvent));
            setSubscribing(isUserParticipating(userSession, diveEvent));
        }
    }, [userSession, diveEvent]);


    function subscribeEvent(diveEventId: number) {
        diveEventAPI.subscribeUserToEvent(diveEventId)
                .then(response => {
                    console.log("Subscribe response:", response);
                    setDiveEvent(response);
                    setSubscribing(true);
                })
                .catch(error => {
                    console.log("Error:", error);
                });
    }

    function unSubscribeEvent(diveEventId: number) {
        diveEventAPI.unsubscribeUserToEvent(diveEventId)
                .then(response => {
                    console.log("Unsubscribe response:", response);
                    setDiveEvent(response);
                    setSubscribing(false);
                })
                .catch(error => {
                    console.log("Error:", error);

                })
    }

    return (
            <div className={'darkDiv'}>
                <Spin spinning={loading}>
                {diveEvent && diveEvent.id !== undefined && <DiveEventDetails eventInfo={diveEvent}/>}
                {!subscribing && canSubscribe &&
                        <div className="row pt-5">
                            <div>
                                <button
                                        className="btn btn-primary"
                                        onClick={() => subscribeEvent(diveEventId)}
                                        key={diveEventId + '-sub-button'}>{t('Event.subscribe.button')}</button>
                            </div>
                        </div>
                }
                {subscribing &&
                        <div className="row pt-5">
                            <div>
                                <button
                                        className="btn btn-danger"
                                        onClick={() => unSubscribeEvent(diveEventId)}
                                        key={diveEventId + 'unsub-button'}>{t('Event.unsubscribe.button')}</button>
                            </div>
                        </div>
                }
                </Spin>
            </div>
    );
}