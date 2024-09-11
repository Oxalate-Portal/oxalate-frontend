import Axios, {AxiosInstance, AxiosResponse} from "axios";
import {SessionVO} from "../models";
import type {GetProp, UploadFile, UploadProps} from "antd";

// Define the response type for successful uploads
interface DownloadResponse {
  fileName: string;
  fileUrl: string;
}

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

class FileTransferAPI {
  private axiosInstance: AxiosInstance;
  private baseUrl: string = `${import.meta.env.VITE_APP_API_URL}` + "/api/files";

  constructor() {
    this.axiosInstance = Axios.create({baseURL: this.baseUrl});
    this.axiosInstance.defaults.headers.put["Content-Type"] = "application/json;charset=utf-8";
  }

  /**
   * Uploads a dive certificate file (image only)
   * @param uploadFile - The certificate image file to upload
   * @returns Promise resolving to the response with file download info
   */
  public async uploadCertificateFile(uploadFile: UploadFile): Promise<DownloadResponse[]> {
    this.setAuthorizationHeader();
    this.setMultipartFormDataHeader();

    const formData = new FormData();
    formData.append("file", uploadFile as FileType);

    const response: AxiosResponse<DownloadResponse[]> = await this.axiosInstance.post("/certificate-files", formData);
    return response.data;
  }

  /**
   * Uploads a document file (PDF only)
   * @param uploadFile - The document PDF file to upload
   * @returns Promise resolving to the response with file download info
   */
  public async uploadDocumentFile(uploadFile: UploadFile): Promise<DownloadResponse[]> {
    this.setAuthorizationHeader();
    this.setMultipartFormDataHeader();

    const formData = new FormData();
    formData.append("file", uploadFile as FileType);

    const response: AxiosResponse<DownloadResponse[]> = await this.axiosInstance.post("/document-files", formData);
    return response.data;
  }

  /**
   * Uploads a dive plan file (PDF only)
   * @param uploadFile - The dive plan PDF file to upload
   * @returns Promise resolving to the response with file download info
   */
  public async uploadDivePlanFile(uploadFile: UploadFile): Promise<DownloadResponse[]> {
    this.setAuthorizationHeader();
    this.setMultipartFormDataHeader();

    const formData = new FormData();
    formData.append("file", uploadFile as FileType);

    const response: AxiosResponse<DownloadResponse[]> = await this.axiosInstance.post("/document-files", formData);
    return response.data;
  }

  /**
   * Sets the authorization header for the axios instance. We get the authorization bearer value from the local storage. We're forced
   * to do this on every request because the token can expire at any time.
   * @private
   */
  private setAuthorizationHeader(): void {
    const session: SessionVO = JSON.parse(localStorage.getItem("user") || "{}");

    if (session && session.accessToken) {
      this.axiosInstance.defaults.headers.common["Authorization"] = "Bearer " + session.accessToken;
    }
  }

  private setMultipartFormDataHeader(): void {
    this.axiosInstance.defaults.headers.post["Content-Type"] = "multipart/form-data";
  }
}

export const fileTransferAPI = new FileTransferAPI();
