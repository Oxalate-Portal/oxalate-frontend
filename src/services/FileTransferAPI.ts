import Axios, {AxiosInstance, AxiosResponse} from "axios";
import {SessionVO} from "../models";
import type {GetProp, UploadFile, UploadProps} from "antd";
import {FileRemovalResponse} from "../models/responses/FileRemovalResponse";
import {AvatarFileResponse, CertificateFileResponse, DiveFileResponse, DocumentFileResponse, PageFileResponse} from "../models/responses/filetransfers";

// Define the response type for successful uploads
interface DownloadResponse {
    fileName: string;
    fileUrl: string;
}

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

class FileTransferAPI {
    private axiosInstance: AxiosInstance;
    private baseUrl: string = `${import.meta.env.VITE_APP_API_URL}` + "/files";
    private static  readonly AVATAR_PATH: string = "/avatars";
    private static  readonly CERTIFICATE_PATH: string = "/certificates";
    private static  readonly DOCUMENT_PATH: string = "/documents";
    private static  readonly DIVE_FILE_PATH: string = "/dive-files";
    private static  readonly PAGE_FILE_PATH: string = "/page-files";

    constructor() {
        this.axiosInstance = Axios.create({baseURL: this.baseUrl});
        this.axiosInstance.defaults.headers.put["Content-Type"] = "application/json;charset=utf-8";
    }

    /* ==== Avatar file ==== */

    public async findAllAvatarFiles(): Promise<AvatarFileResponse[]> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<AvatarFileResponse[]>(FileTransferAPI.AVATAR_PATH);
        return response.data;
    }

    /**
     * Removes an avatar file
     * @param avatarId - The ID of the avatar file to remove
     */

    public async removeAvatarFile(avatarId: number): Promise<FileRemovalResponse> {
        return this.removeFile(avatarId, FileTransferAPI.AVATAR_PATH);
    }

    /* ==== Certificate file ==== */

    public async findAllCertificateFiles(): Promise<CertificateFileResponse[]> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<CertificateFileResponse[]>(FileTransferAPI.CERTIFICATE_PATH);
        return response.data;
    }

    /*
     * The upload of a certificate is handled as a part of the ShowCertificateCard where we configure the uploadProps object for Ant Design Upload component.
     */

    /**
     * Removes a certificate file
     * @param certificateId - The ID of the certificate file to remove
     */

    public async removeCertificateFile(certificateId: number): Promise<FileRemovalResponse> {
        return this.removeFile(certificateId, FileTransferAPI.CERTIFICATE_PATH);
    }

    /* ==== Dive file ==== */

    public async findAllDiveFiles(): Promise<DiveFileResponse[]> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<DiveFileResponse[]>(FileTransferAPI.DIVE_FILE_PATH);
        return response.data;
    }

    /**
     * Uploads a dive file (PDF only)
     * @param uploadFile - The dive PDF file to upload
     * @returns Promise resolving to the response with file download info
     */
    public async uploadDiveFile(uploadFile: UploadFile): Promise<DownloadResponse[]> {
        this.setAuthorizationHeader();
        this.setMultipartFormDataHeader();

        const formData = new FormData();
        formData.append("file", uploadFile as FileType);

        const response: AxiosResponse<DownloadResponse[]> = await this.axiosInstance.post(FileTransferAPI.DIVE_FILE_PATH, formData);
        return response.data;
    }

    /**
     * Removes a dive file
     * @param diveFileId - The ID of the dive file to remove
     */

    public async removeDiveFile(diveFileId: number): Promise<FileRemovalResponse> {
        return this.removeFile(diveFileId, FileTransferAPI.DIVE_FILE_PATH);
    }

    /* ==== Document file ==== */

    public async findAllDocuments(): Promise<DocumentFileResponse[]> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<DocumentFileResponse[]>(FileTransferAPI.DOCUMENT_PATH);
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

        const response: AxiosResponse<DownloadResponse[]> = await this.axiosInstance.post(FileTransferAPI.DOCUMENT_PATH, formData);
        return response.data;
    }

    /**
     * Removes a document file
     * @param documentId - The ID of the document file to remove
     */

    public async removeDocumentFile(documentId: number): Promise<FileRemovalResponse> {
        return this.removeFile(documentId, FileTransferAPI.DOCUMENT_PATH);
    }

    /* ==== Page file ==== */

    public async findAllPageFiles(): Promise<PageFileResponse[]> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<PageFileResponse[]>(FileTransferAPI.PAGE_FILE_PATH);
        return response.data;
    }

    /*
     * The upload of a page file is handled as a part of the custom CKEditor upload plugin CKUploadAdapter used in PageBodyEditor where we configure the
     * adapter appropriately
     */

    public async removePageFile(pageId: number, language: string, fileName: string): Promise<FileRemovalResponse> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.delete(`${FileTransferAPI.PAGE_FILE_PATH}/${pageId}/${language}/${fileName}`);
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

    private async removeFile(fileId: number, fileTypePath: string): Promise<FileRemovalResponse> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.delete(`${fileTypePath}/${fileId}`);
        return response.data;
    }
}

export const fileTransferAPI = new FileTransferAPI();
