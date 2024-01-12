import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { CertificateResponse } from "../../models/responses";
import { Button, Space } from "antd";
import { ShowCertificateCard } from "./ShowCertificateCard";
import { certificateAPI } from "../../services/CertificateAPI";

interface CertificatesProps {
    userId: number,
    viewOnly: boolean
}

export function Certificates({userId, viewOnly}: CertificatesProps) {
    const [certificates, setCertificates] = useState<CertificateResponse[]>([]);
    const {t} = useTranslation();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        certificateAPI.findAllByUserId(userId)
                .then(response => {
                    setCertificates(response);
                })
                .catch(error => {
                    console.log("Certificate fetch error: " + error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [userId]);

    function deleteCertificate(certificateObject: CertificateResponse) {
        if (viewOnly) {
            return;
        }

        if (window.confirm(t("Certificates.deleteCertificate.confirm") + certificateObject.certificateName + "\"?")) {
            setLoading(true);
            certificateAPI.delete(certificateObject.id)
                    .then(response => {
                        window.location.reload();
                    })
                    .catch(error => {
                        console.log("Certificate delete error: " + error);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        }
    }

    return (
            <Space direction={"vertical"} size={12}>
                {!loading && certificates.length > 0 && certificates.map(certificate =>
                        <ShowCertificateCard certificate={certificate}
                                             deleteCertificate={viewOnly ? null : deleteCertificate}
                                             key={certificate.id}/>
                )}
                {!viewOnly && <Button type={"primary"} href={"/users/certificates/0"}>{t("Certificates.panel.addButton")}</Button>}
            </Space>
    );
}
