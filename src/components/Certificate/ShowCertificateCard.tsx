import { CertificateResponse } from "../../models/responses";
import { Button, Card, Space } from "antd";
import { useTranslation } from "react-i18next";

interface ShowCertificateCardProps {
    certificate: CertificateResponse,
    deleteCertificate: any
}

export function ShowCertificateCard({certificate, deleteCertificate}: ShowCertificateCardProps) {
    const {t} = useTranslation();

    function showExtras() {
        if (deleteCertificate) {
            return (<Space direction={"horizontal"} size={12}>
                <Button type="primary" htmlType={"submit"} href={"/users/certificates/" + certificate.id}>{t("common.button.update")}</Button>
                <Button danger type="primary" onClick={() => deleteCertificate(certificate)}>{t("common.button.delete")}</Button>
            </Space>);
        }

        return (<></>);
    }

    return (
                <Card key={certificate.id}
                      title={t("ShowCertificateCard.card.title") + certificate.certificateName}
                      style={{backgroundColor: "rgba(50, 50, 50, 1)", border: 2, width: 600}}
                      extra={showExtras()}
                >
                        <p key={"cert-detail-1"}>{t("ShowCertificateCard.card.organization")}: {certificate.organization}</p>
                        <p key={"cert-detail-2"}>{t("ShowCertificateCard.card.certification")}: {certificate.certificateName}</p>
                        <p key={"cert-detail-3"}>{t("ShowCertificateCard.card.certificateId")}: {certificate.certificateId}</p>
                        <p key={"cert-detail-4"}>{t("ShowCertificateCard.card.diverId")}: {certificate.diverId}</p>
                        <p key={"cert-detail-5"}>{t("ShowCertificateCard.card.date")}: {certificate.certificationDate.toString()}</p>
                </Card>
    );
}
