import {Modal} from "antd";
import {useTranslation} from "react-i18next";
import {HealthCheckConfirmation} from "./HealthCheckConfirmation";

interface HealthCheckConfirmationModalProps {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    registration?: boolean;
}

export function HealthCheckConfirmationModal({open, onConfirm, onCancel, registration = false}: HealthCheckConfirmationModalProps) {
    const {t} = useTranslation();

    return (
            <Modal
                    cancelText={t("HealthCheckConfirmationModal.reject")}
                    okText={t("HealthCheckConfirmationModal.confirm")}
                    onCancel={onCancel}
                    onOk={onConfirm}
                    open={open}
                    title={t("HealthCheckConfirmationModal.title")}
                    width={"80%"}
            >
                <HealthCheckConfirmation registration={registration}/>
            </Modal>
    );
}

