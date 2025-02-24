import { NavigateFunction } from "react-router-dom";
import { Alert, Button } from "antd";
import { useTranslation } from "react-i18next";
import { UpdateStatusEnum, UpdateStatusVO } from "../../models";

interface SubmitResultProps {
    updateStatus: UpdateStatusVO;
    navigate: NavigateFunction;
    path?: string; // Optional path parameter
}

export function SubmitResult({ updateStatus, navigate, path }: SubmitResultProps) {
    const { t } = useTranslation();

    function handleBack() {
        if (path) {
            navigate(path);
        } else {
            navigate(-1);
        }
    }

    if (updateStatus.status === UpdateStatusEnum.OK) {
        window.dispatchEvent(new Event("reloadNavigationEvent"));
        return (
                <div className="darkDiv">
                    <Alert
                            type="success"
                            showIcon={true}
                            message={updateStatus.message.toString()}
                            action={<Button type="primary" onClick={handleBack}>{t("common.button.back")}</Button>}
                    />
                </div>
        );
    } else if (updateStatus.status === UpdateStatusEnum.FAIL) {
        return (
                <div className="darkDiv">
                    <Alert
                            type="error"
                            showIcon={true}
                            message={updateStatus.message.toString()}
                            action={<Button type="primary" onClick={handleBack}>{t("common.button.back")}</Button>}
                    />
                </div>
        );
    } else {
        return <>Unknown status: {updateStatus.status}</>;
    }
}
