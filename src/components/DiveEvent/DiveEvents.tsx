import {useState} from "react";
import {useTranslation} from "react-i18next";
import {DiveEventsTable} from "./DiveEventsTable";
import {useSession} from "../../session";
import {HealthCheckConfirmationModal} from "../main";

export function DiveEvents() {
    const {t} = useTranslation();
    const {userSession, refreshUserSession} = useSession();
    const [showHealthCheckModal, setShowHealthCheckModal] = useState(!userSession?.healthCheckId);

    const handleHealthCheckConfirm = () => {
        if (userSession) {
            const newSession = JSON.parse(JSON.stringify(userSession));
            newSession.healthCheckId = 0;
            refreshUserSession(newSession);
        }

        setShowHealthCheckModal(false);
    };

    const handleHealthCheckCancel = () => {
        // Keep the modal open if the user hasn't confirmed
        // The modal stays open until the user confirms or navigates away
    };

    return (
            <div className={"darkDiv"}>
                <DiveEventsTable
                        diveEventType={"new"}
                        title={t("Events.search.placeholder")}
                        healthCheckId={(userSession ? userSession.healthCheckId : null)}
                        onHealthCheckRequired={() => setShowHealthCheckModal(true)}
                />
                <DiveEventsTable
                        diveEventType={"ongoing"}
                        title={t("Events.ongoing.title")}
                        healthCheckId={(userSession ? userSession.healthCheckId : null)}
                        onHealthCheckRequired={() => setShowHealthCheckModal(true)}
                />
                <HealthCheckConfirmationModal
                        open={showHealthCheckModal}
                        onConfirm={handleHealthCheckConfirm}
                        onCancel={handleHealthCheckCancel}
                        registration={false}
                />
            </div>
    );
}