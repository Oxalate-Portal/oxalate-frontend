import {QuestionCircleOutlined, UploadOutlined} from "@ant-design/icons";
import {CertificateResponse} from "../../models";
import {Button, Card, Col, message, Row, Space, Spin, Tooltip, Upload, UploadProps} from "antd";
import {useTranslation} from "react-i18next";
import {useState} from "react";
import {ProtectedImage} from "../main";
import {fileTransferAPI} from "../../services";

interface ShowCertificateCardProps {
    certificate: CertificateResponse;
    deleteCertificate: any;
    viewOnly: boolean;
}

export function ShowCertificateCard({certificate, deleteCertificate, viewOnly}: ShowCertificateCardProps) {
    const {t} = useTranslation();
    const [certificatePhotoUrl, setCertificatePhotoUrl] = useState<string | null>(certificate.certificatePhotoUrl);
    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [messageApi, contextHolder] = message.useMessage();

    const uploadProps: UploadProps = {
        name: "uploadFile",
        action: `${import.meta.env.VITE_APP_API_URL}` + "/files/certificates/" + certificate.id,
        showUploadList: false,
        accept: "image/png, image/jpeg, image/jpg",
        withCredentials: true,
        beforeUpload: (file) => {
            const maxFileSize = 1 * 1024 * 1024;
            if (file.size > maxFileSize) {
                messageApi.error(t("ShowCertificateCard.card.upload-photo-size-too-big"));
                return false;
            }
        },
        onChange(info) {
            if (info.file.status === "done") {
                const uploadedUrl = info.file.response.url;
                setCertificatePhotoUrl(uploadedUrl);
                setRefreshKey((prevKey) => prevKey + 1);
                messageApi.success(`${info.file.name} file uploaded successfully`);
            } else if (info.file.status === "error") {
                messageApi.error(`${info.file.name} file upload failed.`);
            }
        },
    };

    function showExtras() {
        if (deleteCertificate) {
            return (
                    <Space direction={"horizontal"} size={12}>
                        <Button type="primary" htmlType={"submit"} href={"/users/certificates/" + certificate.id}>
                            {t("common.button.update")}
                        </Button>
                        <Button danger type="primary" onClick={() => deleteCertificate(certificate)}>
                            {t("common.button.delete")}
                        </Button>
                        <div>
                            <Upload {...uploadProps}>
                                <Button icon={<UploadOutlined/>}>
                                    {t("ShowCertificateCard.card.upload-photo")}
                                </Button>
                            </Upload>&nbsp;
                            <Tooltip title={t("ShowCertificateCard.card.upload-photo-tooltip")}>
                                <QuestionCircleOutlined/>
                            </Tooltip>
                        </div>
                    </Space>
            );
        }

        return <></>;
    }

    function removeCertificatePhoto() {
        setLoading(true);
        fileTransferAPI.removeCertificateFile(certificate.id)
                .then(() => {
                    messageApi.success(t("ShowCertificateCard.card.remove-photo-success"));
                    setCertificatePhotoUrl(null);
                    setRefreshKey((prevKey) => prevKey + 1);
                })
                .catch((error) => {
                    console.error("Error removing certificate photo:", error);
                    messageApi.error(t("ShowCertificateCard.card.remove-photo-fail"));
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    // Function to show the certificate photocopy or upload button
    function renderCertificatePhoto() {
        if (certificatePhotoUrl) {
            return (
                    <ProtectedImage
                            key={"cert-photo-" + refreshKey}
                            imageUrl={certificatePhotoUrl}
                            style={{width: "250px"}}
                            alt={t("ShowCertificateCard.card.certificatePhoto")}
                            onRemove={removeCertificatePhoto}
                            viewOnly={viewOnly}
                    />
            );
        } else {
            return null;
        }
    }

    return (
            <Card
                    key={certificate.id}
                    title={t("ShowCertificateCard.card.title") + certificate.certificateName}
                    style={{backgroundColor: "rgba(50, 50, 50, 1)", border: 2, width: 800}}
                    extra={showExtras()}
            >
                {contextHolder}
                <Row gutter={16}>
                    {/* Left Column: Certificate details */}
                    <Col span={12}>
                        <p key={"cert-detail-1"}>{t("ShowCertificateCard.card.organization")}: {certificate.organization}</p>
                        <p key={"cert-detail-2"}>{t("ShowCertificateCard.card.certification")}: {certificate.certificateName}</p>
                        <p key={"cert-detail-3"}>{t("ShowCertificateCard.card.certificateId")}: {certificate.certificateId}</p>
                        <p key={"cert-detail-4"}>{t("ShowCertificateCard.card.diverId")}: {certificate.diverId}</p>
                        <p key={"cert-detail-5"}>{t("ShowCertificateCard.card.date")}: {certificate.certificationDate.toString()}</p>
                    </Col>

                    {/* Right Column: Certificate photocopy or upload button */}
                    <Col span={12}>
                        <Spin spinning={loading}>
                            {renderCertificatePhoto()}
                        </Spin>
                    </Col>
                </Row>
            </Card>
    );
}
