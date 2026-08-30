import {AbstractAPI} from "./AbstractAPI";
import type {CertificateClassificationRequest, CertificateClassificationResponse} from "../models";

class CertificateClassificationAPI extends AbstractAPI<CertificateClassificationRequest, CertificateClassificationResponse> {
}

export const certificateClassificationAPI = new CertificateClassificationAPI("/certificate-classifications");
