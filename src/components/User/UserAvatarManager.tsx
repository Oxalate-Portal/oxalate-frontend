import {Avatar, Button, message, Space, Upload, type UploadProps} from "antd";
import {UploadOutlined, UserOutlined} from "@ant-design/icons";
import {ProtectedImage} from "../main";
import {useState} from "react";
import {useTranslation} from "react-i18next";
import {FileUploadValidationError, validateUploadFile} from "../../tools/FileUploadValidation";
import {getAvatarUploadOutcome, type UploadAvatarResponse} from "../../tools/avatarUploadResponse";
import {useSession} from "../../session";

interface UserAvatarManagerProps {
    userId: number;
    initialAvatarUrl: string | null;
}

export function UserAvatarManager({userId, initialAvatarUrl}: UserAvatarManagerProps) {
    const {t} = useTranslation();
    const {userSession, refreshUserSession} = useSession();
    const [messageApi, contextHolder] = message.useMessage();
    const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null);
    const avatarUrl = uploadedAvatarUrl ?? initialAvatarUrl;

    function setNewAvatarUrl(url: string) {
        setUploadedAvatarUrl(url);

        // Update the shared session so NavigationBar (and any other consumer) picks
        // up the new avatar URL immediately without relying on localStorage or events.
        if (userSession) {
            refreshUserSession({...userSession, avatarUrl: url});
        }
    }

    const uploadProps: UploadProps = {
        name: "uploadFile",
        action: `${import.meta.env.VITE_APP_API_URL}/files/avatars`,
        showUploadList: false,
        withCredentials: true,
        accept: "image/gif,image/jpeg,image/jpg,image/png",
        beforeUpload: (file) => {
            const validation = validateUploadFile(file, "avatar");

            if (!validation.valid) {
                if (validation.error === FileUploadValidationError.INVALID_TYPE) {
                    messageApi.error(t("UserFiles.avatar.upload.invalidType"));
                } else {
                    messageApi.error(t("UserFiles.avatar.upload.fileTooLarge"));
                }

                return false;
            }

            return true;
        },
        onChange(info) {
            if (info.file.status === "done") {
                const response = info.file.response as UploadAvatarResponse | undefined;

                const uploadOutcome = getAvatarUploadOutcome(response);
                if (uploadOutcome.success) {
                    setNewAvatarUrl(uploadOutcome.url);
                    messageApi.success(t("UserFiles.avatar.upload.success"));
                    return;
                }

                if (uploadOutcome.message) {
                    messageApi.error(uploadOutcome.message);
                    return;
                }

                messageApi.error(t("UserFiles.avatar.upload.fail"));
            } else if (info.file.status === "error") {
                messageApi.error(t("UserFiles.avatar.upload.fail"));
            }
        }
    };

    return (
            <Space orientation={"vertical"} size={12} style={{marginBottom: 16}}>
                {contextHolder}
                <Space size={16} align={"start"}>
                    {avatarUrl ? (
                            <ProtectedImage
                                    imageUrl={avatarUrl}
                                    alt={t("UserFiles.avatar.previewAlt")}
                                    style={{width: 96, borderRadius: "50%"}}
                                    preview={true}
                                    viewOnly={true}
                            />
                    ) : (
                            <Avatar size={96} icon={<UserOutlined/>}/>
                    )}

                    <Upload {...uploadProps}>
                        <Button icon={<UploadOutlined/>}>{t("UserFiles.avatar.upload.button")}</Button>
                    </Upload>
                </Space>
            </Space>
    );
}

