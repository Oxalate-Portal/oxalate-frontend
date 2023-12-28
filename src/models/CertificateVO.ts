interface CertificateVO {
    id: number;
    userId: number;
    organization: string;
    certificateName: string;
    certificateId: string;
    diverId: string;
    certificationDate: Date;
}

export default CertificateVO;