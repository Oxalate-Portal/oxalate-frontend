export type FileUploadType = "avatar" | "document" | "dive";

interface FileUploadRule {
    maxFileSizeBytes: number;
    allowedMimeTypes: string[];
    allowedExtensions: string[];
}

export enum FileUploadValidationError {
    INVALID_TYPE = "INVALID_TYPE",
    FILE_TOO_LARGE = "FILE_TOO_LARGE"
}

export interface FileUploadValidationResult {
    valid: boolean;
    error?: FileUploadValidationError;
}

const ONE_MEGABYTE = 1024 * 1024;
const FIVE_MEGABYTES = 5 * ONE_MEGABYTE;

const IMAGE_MIME_TYPES = ["image/gif", "image/jpeg", "image/jpg", "image/png"];
const IMAGE_EXTENSIONS = ["gif", "jpg", "jpeg", "png"];

const FILE_UPLOAD_RULES: Record<FileUploadType, FileUploadRule> = {
    avatar: {
        maxFileSizeBytes: ONE_MEGABYTE,
        allowedMimeTypes: IMAGE_MIME_TYPES,
        allowedExtensions: IMAGE_EXTENSIONS
    },
    document: {
        maxFileSizeBytes: FIVE_MEGABYTES,
        allowedMimeTypes: [...IMAGE_MIME_TYPES, "application/pdf"],
        allowedExtensions: [...IMAGE_EXTENSIONS, "pdf"]
    },
    dive: {
        maxFileSizeBytes: FIVE_MEGABYTES,
        allowedMimeTypes: [...IMAGE_MIME_TYPES, "application/pdf"],
        allowedExtensions: [...IMAGE_EXTENSIONS, "pdf"]
    }
};

function getFileExtension(fileName: string): string {
    const parts = fileName.toLowerCase().split(".");
    return parts.length > 1 ? parts[parts.length - 1] : "";
}

export function validateUploadFile(file: Pick<File, "name" | "size" | "type">, uploadType: FileUploadType): FileUploadValidationResult {
    const rule = FILE_UPLOAD_RULES[uploadType];
    const extension = getFileExtension(file.name);
    const hasAllowedMimeType = rule.allowedMimeTypes.includes(file.type);
    const hasAllowedExtension = rule.allowedExtensions.includes(extension);

    if (!hasAllowedMimeType && !hasAllowedExtension) {
        return {valid: false, error: FileUploadValidationError.INVALID_TYPE};
    }

    if (file.size > rule.maxFileSizeBytes) {
        return {valid: false, error: FileUploadValidationError.FILE_TOO_LARGE};
    }

    return {valid: true};
}

