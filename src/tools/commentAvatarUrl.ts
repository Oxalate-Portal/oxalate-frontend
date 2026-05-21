import {getApiBaseUrl} from "../services/getApiBaseUrl";

export function resolveCommentAvatarUrl(avatarUrl?: string | null, apiBaseUrl = getApiBaseUrl()): string | null {
    if (!avatarUrl) {
        return null;
    }

    const trimmedAvatarUrl = avatarUrl.trim();
    if (!trimmedAvatarUrl) {
        return null;
    }

    // Keep absolute URLs as-is.
    if (/^https?:\/\//.test(trimmedAvatarUrl)) {
        return trimmedAvatarUrl;
    }

    if (!apiBaseUrl) {
        return trimmedAvatarUrl;
    }

    try {
        const apiBase = new URL(apiBaseUrl);
        if (trimmedAvatarUrl.startsWith("/")) {
            // Backend usually returns /api/files/...; use backend origin from configured API base URL.
            return `${apiBase.origin}${trimmedAvatarUrl}`;
        }

        return `${apiBase.origin}/${trimmedAvatarUrl.replace(/^\/+/, "")}`;
    } catch {
        return trimmedAvatarUrl;
    }
}

