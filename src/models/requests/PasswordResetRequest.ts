export interface PasswordResetRequest {
    new_password: string;
    confirm_password: string;
    token: string;
}
