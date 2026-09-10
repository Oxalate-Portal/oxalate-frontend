import type {AxiosInstance, InternalAxiosRequestConfig} from "axios";
import {getApiBaseUrl} from "./getApiBaseUrl";
import {registerSessionExpiryInterceptor} from "./sessionExpiryInterceptor";

function buildServiceBaseUrl(member: string): string {
    return `${getApiBaseUrl()}${member}`;
}

export function configureAxiosBaseUrl(axiosInstance: AxiosInstance, member: string): void {
    axiosInstance.defaults.baseURL = buildServiceBaseUrl(member);

    axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
        const resolvedBaseUrl = buildServiceBaseUrl(member);
        axiosInstance.defaults.baseURL = resolvedBaseUrl;
        config.baseURL = resolvedBaseUrl;
        return config;
    });

    // OWASP A07/A10:2025 - end the client side session when the server says it is gone
    registerSessionExpiryInterceptor(axiosInstance);
}


