import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {Spin} from "antd";
import {diveEventAPI} from "../../services";
import {DiveEventDetails} from "./DiveEventDetails";
import type {DiveEventResponse} from "../../models";

export function ShowDiveEvent() {
    const {paramId} = useParams();
    const [diveEvent, setDiveEvent] = useState<DiveEventResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (paramId?.length === 0) {
            console.error("Invalid dive event id:", paramId);
            return;
        }

        let tmpDiveEventId = 0;
        if (paramId !== undefined && !Number.isNaN(parseInt(paramId))) {
            tmpDiveEventId = parseInt(paramId);
        }

        if (tmpDiveEventId > 0) {
            setLoading(true);
            console.error("Fetching dive event with id:", tmpDiveEventId);
            diveEventAPI.findById(tmpDiveEventId, null)
                    .then(response => {
                        setDiveEvent(response);
                    })
                    .catch(error => {
                        console.error("Error:", error);
                    });
            setLoading(false);
        } else {
            console.error("Invalid dive event id:", tmpDiveEventId);

        }
    }, [paramId]);

    return (
            <div className={"darkDiv"}>
                <Spin spinning={loading}>
                    {!loading && diveEvent && <DiveEventDetails eventInfo={diveEvent} key={diveEvent.id}/>}
                </Spin>
            </div>
    );
}