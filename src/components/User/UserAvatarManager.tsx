import {Avatar, Button, message, Space, Upload, type UploadProps} from "antd";
import {UploadOutlined, UserOutlined} from "@ant-design/icons";
import {ProtectedImage} from "../main";
import {useState} from "react";
import {useTranslation} from "react-i18next";
import {FileUploadValidationError, validateUploadFile} from "../../tools/FileUploadValidation";
import {getAvatarUploadOutcome, type UploadAvatarResponse} from "../../tools/avatarUploadResponse";

interface UserAvatarManagerProps {
    userId: number;
}

function getAvatarStorageKey(userId: number): string {
    return `oxalate-avatar-url-${userId}`;
}

export function UserAvatarManager({userId}: UserAvatarManagerProps) {
    const {t} = useTranslation();
    const [messageApi, contextHolder] = message.useMessage();
    const [avatarUrl, setAvatarUrl] = useState<string | null>(localStorage.getItem(getAvatarStorageKey(userId)));

    function setNewAvatarUrl(url: string) {
        localStorage.setItem(getAvatarStorageKey(userId), url);
        setAvatarUrl(url);

        window.dispatchEvent(new CustomEvent("avatarUpdated", {
            detail: {
                userId,
                url
            }
        }));
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
            <Space direction={"vertical"} size={12} style={{marginBottom: 16}}>
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

