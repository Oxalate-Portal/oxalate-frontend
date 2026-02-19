import {Alert, Modal} from "antd";
import {useTranslation} from "react-i18next";
import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {CloseOutlined} from "@ant-design/icons";
import {HealthCheckConfirmation} from "./HealthCheckConfirmation";
import {userAPI} from "../../services";
import {useSession} from "../../session";

interface HealthCheckConfirmationModalProps {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    registration?: boolean;
}

export function HealthCheckConfirmationModal({open, onConfirm, onCancel, registration = false}: HealthCheckConfirmationModalProps) {
    const {t} = useTranslation();
    const navigate = useNavigate();
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
            const response = await userAPI.confirmHealthCheck({healthCheckAnswer: "yes"});

            if (userSession) {
                const newSession = JSON.parse(JSON.stringify(userSession));
                newSession.healthCheckId = response;
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
                    cancelText={t("HealthCheckConfirmationModal.reject")}
                    closable={!registration}
                    closeIcon={!registration ? <CloseOutlined onClick={(e) => {
                        e.stopPropagation();
                        navigate("/");
                    }}/> : undefined}
                    confirmLoading={loading}
                    okText={t("HealthCheckConfirmationModal.confirm")}
                    onCancel={handleReject}
                    onOk={handleConfirm}
                    open={open}
                    title={t("HealthCheckConfirmationModal.title")}
                    width={"80%"}
            >
                {error && <Alert type={"error"} message={t("HealthCheckConfirmationModal.error")} style={{marginBottom: 16}}/>}
                <HealthCheckConfirmation/>
            </Modal>
    );
}

