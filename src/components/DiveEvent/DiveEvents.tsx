import {useTranslation} from "react-i18next";
import {DiveEventsTable} from "./DiveEventsTable";

export function DiveEvents() {
    const {t} = useTranslation();

    return (
            <div className={'darkDiv'}>
                <DiveEventsTable diveEventType={'new'} title={t('Events.search.placeholder')}/>
                <DiveEventsTable diveEventType={'ongoing'} title={t('Events.ongoing.title')}/>
            </div>
    );
}