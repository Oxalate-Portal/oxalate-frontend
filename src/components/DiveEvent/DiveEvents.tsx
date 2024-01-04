import {useTranslation} from "react-i18next";
import {useSession} from "../../session";
import {DiveEventsTable} from "./DiveEventsTable";

export function DiveEvents() {
    const {userSession} = useSession();
    const {t} = useTranslation();

    return (
            <div className={'darkDiv'}>
                <DiveEventsTable type={'new'} title={t('Events.search.placeholder')}/>
                <DiveEventsTable type={'ongoing'} title={t('Events.ongoing.title')}/>
            </div>
    );
}