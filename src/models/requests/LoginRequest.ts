export interface LoginRequest {
    username: string;
    password: string;
    recaptcha_token: string | null;
}
