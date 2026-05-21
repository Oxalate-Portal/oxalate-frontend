export interface UploadAvatarResponse {
    url?: string;
    error?: {
        message?: string;
    };
}

export function getAvatarUploadOutcome(response?: UploadAvatarResponse): { success: true; url: string } | { success: false; message?: string } {
    if (response?.error?.message) {
        return {success: false, message: response.error.message};
    }

    if (typeof response?.url === "string" && response.url.length > 0) {
        return {success: true, url: response.url};
    }

    return {success: false};
}

