import {DiveEventsTable} from "./DiveEventsTable";
import {useTranslation} from "react-i18next";

export function PastDiveEvents() {
    const {t} = useTranslation();

    return (
            <div className={"darkDiv"}>
                <DiveEventsTable diveEventType={"past"} title={t("PastEvents.title")}/>
            </div>
    );
}