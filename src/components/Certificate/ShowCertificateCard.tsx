import { UploadOutlined } from "@ant-design/icons";
import { CertificateResponse } from "../../models/responses";
import { Button, Card, Col, message, Row, Space, Upload, UploadProps } from "antd";
import { useTranslation } from "react-i18next";
import { useSession } from "../../session";
import { useState } from "react";
import { ProtectedImage } from "../main";

interface ShowCertificateCardProps {
    certificate: CertificateResponse;
    deleteCertificate: any;
}

export function ShowCertificateCard({certificate, deleteCertificate}: ShowCertificateCardProps) {
    const { t } = useTranslation();
    const { userSession } = useSession();
    const [certificatePhotoUrl, setCertificatePhotoUrl] = useState<string | null>(certificate.certificatePhotoUrl);

    const uploadProps: UploadProps = {
        name: "uploadFile",
        action: `${import.meta.env.VITE_APP_API_URL}` + "/files/upload/certificates/" + certificate.id,
        headers: {
            authorization: "Bearer " + userSession?.accessToken,
        },
        onChange(info) {
            if (info.file.status !== "uploading") {
                console.log("Received info: ", info);
            }
            if (info.file.status === "done") {
                const uploadedUrl = info.file.response.url;
                setCertificatePhotoUrl(uploadedUrl); // Update state to trigger re-render
                message.success(`${info.file.name} file uploaded successfully`);
            } else if (info.file.status === "error") {
                message.error(`${info.file.name} file upload failed.`);
            }
        },
        showUploadList: false
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
                        <Upload {...uploadProps}>
                            <Button icon={<UploadOutlined />}>
                                {t("ShowCertificateCard.card.upload-photo")}
                            </Button>
                        </Upload>
                    </Space>
            );
        }

        return <></>;
    }

    // Function to show the certificate photocopy or upload button
    function renderCertificatePhoto() {
        if (certificatePhotoUrl) {
            console.log("We have an image URL: ", certificatePhotoUrl);
            return (
                    <ProtectedImage
                            imageUrl={certificatePhotoUrl}
                            style={{width: "200"}}
                            alt={t("ShowCertificateCard.card.certificatePhoto")}
                    />
            );
        }
    }

    return (
            <Card
                    key={certificate.id}
                    title={t("ShowCertificateCard.card.title") + certificate.certificateName}
                    style={{ backgroundColor: "rgba(50, 50, 50, 1)", border: 2, width: 600 }}
                    extra={showExtras()}
            >
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
                        {renderCertificatePhoto()}
                    </Col>
                </Row>
            </Card>
    );
}
