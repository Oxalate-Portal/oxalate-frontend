import {useState} from "react";
import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router-dom";
import {DiveEventsTable} from "./DiveEventsTable";
import {useSession} from "../../session";
import {HealthStatementConfirmationModal} from "../main";

export function DiveEvents() {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const {userSession} = useSession();
    const [showHealthStatementModal, setShowHealthStatementModal] = useState(userSession?.healthStatementId == null);

    const handleHealthStatementConfirm = () => {

        setShowHealthStatementModal(false);
    };

    const handleHealthStatementCancel = () => {
        setShowHealthStatementModal(false);
        navigate("/");
    };

    return (
            <div className={"darkDiv"}>
                <DiveEventsTable
                        diveEventType={"new"}
                        title={t("Events.search.placeholder")}
                        healthStatementId={(userSession ? userSession.healthStatementId : null)}
                        onHealthStatementRequired={() => setShowHealthStatementModal(true)}
                />
                <DiveEventsTable
                        diveEventType={"ongoing"}
                        title={t("Events.ongoing.title")}
                        healthStatementId={(userSession ? userSession.healthStatementId : null)}
                        onHealthStatementRequired={() => setShowHealthStatementModal(true)}
                />
                <HealthStatementConfirmationModal
                        open={showHealthStatementModal}
                        onConfirm={handleHealthStatementConfirm}
                        onCancel={handleHealthStatementCancel}
                        registration={false}
                />
            </div>
    );
}