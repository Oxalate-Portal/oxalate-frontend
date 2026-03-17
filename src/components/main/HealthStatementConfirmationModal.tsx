import {Alert, Modal} from "antd";
import {useTranslation} from "react-i18next";
import {useState} from "react";
import {HealthStatementConfirmation} from "./HealthStatementConfirmation";
import {userAPI} from "../../services";
import {useSession} from "../../session";

interface HealthStatementConfirmationModalProps {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    registration?: boolean;
}

export function HealthStatementConfirmationModal({open, onConfirm, onCancel, registration = false}: HealthStatementConfirmationModalProps) {
    const {t} = useTranslation();
    const {userSession, refreshUserSession} = useSession();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleConfirm() {
        if (registration) {
            onConfirm();
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await userAPI.acceptHealthStatement({confirmationAnswer: true});

            if (userSession) {
                const newSession = JSON.parse(JSON.stringify(userSession));
                newSession.healthStatementId = 0;
                refreshUserSession(newSession);
            }

            onConfirm();
        } catch (e: unknown) {
            console.error(e);
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }

    function handleReject() {
        onCancel();
    }

    return (
            <Modal
                    cancelText={t("common.button.reject")}
                    closable={!registration}
                    confirmLoading={loading}
                    okText={t("common.button.confirm")}
                    onCancel={handleReject}
                    onOk={handleConfirm}
                    open={open}
                    title={t("HealthStatementConfirmationModal.title")}
                    width={"80%"}
            >
                {error && <Alert type={"error"} message={t("HealthStatementConfirmationModal.error")} style={{marginBottom: 16}}/>}
                <HealthStatementConfirmation/>
            </Modal>
    );
}


