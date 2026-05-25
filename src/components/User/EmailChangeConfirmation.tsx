import {Alert, Button, Space} from "antd";
import {useEffect, useRef} from "react";
import {useTranslation} from "react-i18next";
import {useNavigate, useSearchParams} from "react-router-dom";
import {useSession} from "../../session";

export function EmailChangeConfirmation() {
    const [searchParams] = useSearchParams();
    const status = searchParams.get("status");
    const {t} = useTranslation();
    const {logoutUser} = useSession();
    const navigate = useNavigate();
    const handledLogoutRef = useRef(false);

    useEffect(() => {
        // After successful username/email change, force local session state refresh via logout.
        if (status === "OK" && !handledLogoutRef.current) {
            handledLogoutRef.current = true;
            logoutUser();
        }
    }, [logoutUser, status]);

    if (status === "OK") {
        return (
                <div className="darkDiv">
                    <Space direction="vertical" size={12}>
                        <Alert type="success" message={t("User.emailChange.confirmation.ok")}/>
                        <Button type="primary" onClick={() => navigate("/login")}>{t("common.button.login")}</Button>
                    </Space>
                </div>
        );
    }

    return (
            <div className="darkDiv">
                <Space direction="vertical" size={12}>
                    <Alert type="error" message={t("User.emailChange.confirmation.invalid")}/>
                    <Button onClick={() => navigate("/")}>{t("common.button.back")}</Button>
                </Space>
            </div>
    );
}

