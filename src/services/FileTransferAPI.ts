import Axios, {type AxiosInstance, type AxiosResponse} from "axios";
import type {
    ActionResponse,
    AvatarFileResponse,
    CertificateFileResponse,
    DiveFileResponse,
    DocumentFileResponse,
    PagedRequest,
    PagedResponse,
    PageFileResponse
} from "../models";
import {configureAxiosBaseUrl} from "./configureAxiosBaseUrl";
import {transformDatesInObject} from "./dateTransformer";
import {type PagedQueryExtraParams, toPagedQueryParams} from "./pagedQuery";
import {getGlobalTimezone} from "./timezoneContext";

// Define the response type for successful uploads
interface UploadResponse {
    url: string;
}

class FileTransferAPI {
    private static readonly AVATAR_PATH: string = "/avatars";
    private static readonly CERTIFICATE_PATH: string = "/certificates";
    private static readonly DOCUMENT_PATH: string = "/documents";
    private static readonly DIVE_FILE_PATH: string = "/dive-files";
    private static readonly PAGE_FILE_PATH: string = "/page-files";
    private axiosInstance: AxiosInstance;

    constructor() {
        this.axiosInstance = Axios.create({
            withCredentials: true,
            headers: {"Content-Type": "application/json;charset=utf-8"}
        });
        configureAxiosBaseUrl(this.axiosInstance, "/files");
    }

    /* ==== Avatar file ==== */

    public async findAllAvatarFiles(request: PagedRequest): Promise<PagedResponse<AvatarFileResponse>> {
        return this.findPaged<AvatarFileResponse>(FileTransferAPI.AVATAR_PATH, request);
    }

    public async uploadAvatarFile(uploadFile: File): Promise<UploadResponse> {
        const formData = new FormData();
        formData.append("upload_file", uploadFile);

        const response: AxiosResponse<UploadResponse> = await this.axiosInstance.post(
            FileTransferAPI.AVATAR_PATH,
            formData,
            {headers: {"Content-Type": "multipart/form-data"}}
        );
        return response.data;
    }

    /**
     * Removes an avatar file
     * @param avatarId - The ID of the avatar file to remove
     */

    public async removeAvatarFile(avatarId: number): Promise<ActionResponse> {
        return this.removeFile(avatarId, FileTransferAPI.AVATAR_PATH);
    }

    /* ==== Certificate file ==== */

    public async findAllCertificateFiles(request: PagedRequest): Promise<PagedResponse<CertificateFileResponse>> {
        return this.findPaged<CertificateFileResponse>(FileTransferAPI.CERTIFICATE_PATH, request);
    }

    /*
     * The upload of a certificate is handled as a part of the ShowCertificateCard where we configure the uploadProps object for Ant Design Upload component.
     */

    /**
     * Removes a certificate file
     * @param certificateId - The ID of the certificate file to remove
     */

    public async removeCertificateFile(certificateId: number): Promise<ActionResponse> {
        return this.removeFile(certificateId, FileTransferAPI.CERTIFICATE_PATH);
    }

    /* ==== Dive file ==== */

    /**
     * Fetches one page of dive files, optionally restricted to a single dive event.
     */
    public async findAllDiveFiles(request: PagedRequest, eventId?: number): Promise<PagedResponse<DiveFileResponse>> {
        return this.findPaged<DiveFileResponse>(FileTransferAPI.DIVE_FILE_PATH, request, {event_id: eventId});
    }

    /**
     * Uploads a dive file (PDF only)
     * @param uploadFile - The dive PDF file to upload
     * @param eventId - The ID of the event
     * @param diveGroupId - The ID of the dive group
     * @returns Promise resolving to the response with file download info
     */
    public async uploadDiveFile(uploadFile: File, eventId: number, diveGroupId: number): Promise<UploadResponse> {
        const formData = new FormData();
        formData.append("upload_file", uploadFile);

        const response: AxiosResponse<UploadResponse> = await this.axiosInstance.post(
            `${FileTransferAPI.DIVE_FILE_PATH}?event_id=${eventId}&dive_group_id=${diveGroupId}`,
            formData,
            {headers: {"Content-Type": "multipart/form-data"}}
        );
        return response.data;
    }

    /**
     * Removes a dive file
     * @param diveFileId - The ID of the dive file to remove
     */

    public async removeDiveFile(diveFileId: number): Promise<ActionResponse> {
        return this.removeFile(diveFileId, FileTransferAPI.DIVE_FILE_PATH);
    }

    /* ==== Document file ==== */

    /**
     * Fetches one page of documents, optionally restricted to the ones uploaded by the given user. The backend forces
     * non-administrators to their own id regardless of the parameter.
     */
    public async findAllDocuments(request: PagedRequest, creatorId?: number): Promise<PagedResponse<DocumentFileResponse>> {
        return this.findPaged<DocumentFileResponse>(FileTransferAPI.DOCUMENT_PATH, request, {creator_id: creatorId});
    }

    /**
     * Uploads a document file (PDF only)
     * @param uploadFile - The document PDF file to upload
     * @returns Promise resolving to the response with file download info
     */
    public async uploadDocumentFile(uploadFile: File): Promise<UploadResponse> {
        const formData = new FormData();
        formData.append("upload_file", uploadFile);

        const response: AxiosResponse<UploadResponse> = await this.axiosInstance.post(
            FileTransferAPI.DOCUMENT_PATH,
            formData,
            {headers: {"Content-Type": "multipart/form-data"}}
        );
        return response.data;
    }

    /**
     * Removes a document file
     * @param documentId - The ID of the document file to remove
     */

    public async removeDocumentFile(documentId: number): Promise<ActionResponse> {
        return this.removeFile(documentId, FileTransferAPI.DOCUMENT_PATH);
    }

    /* ==== Page file ==== */

    public async findAllPageFiles(request: PagedRequest): Promise<PagedResponse<PageFileResponse>> {
        return this.findPaged<PageFileResponse>(FileTransferAPI.PAGE_FILE_PATH, request);
    }

    /*
     * The upload of a page file is handled as a part of the custom CKEditor upload plugin CKUploadAdapter used in PageBodyEditor where we configure the
     * adapter appropriately
     */

    public async removePageFile(pageId: number, language: string, fileName: string): Promise<ActionResponse> {
        const response = await this.axiosInstance.delete(`${FileTransferAPI.PAGE_FILE_PATH}/${pageId}/${language}/${fileName}`);
        return response.data;
    }

    /**
     * Fetches one page of a file list endpoint and converts the temporal fields of every item to Dayjs.
     */
    private async findPaged<T>(path: string, request: PagedRequest, extraParams?: PagedQueryExtraParams): Promise<PagedResponse<T>> {
        const response = await this.axiosInstance.post<PagedResponse<T>>(path, request, {params: toPagedQueryParams({}, extraParams)});
        return {
            ...response.data,
            content: response.data.content.map((item) => transformDatesInObject(item, getGlobalTimezone()))
        };
    }

    private async removeFile(fileId: number, fileTypePath: string): Promise<ActionResponse> {
        const response = await this.axiosInstance.delete(`${fileTypePath}/${fileId}`);
        return response.data;
    }
}

export const fileTransferAPI = new FileTransferAPI();
