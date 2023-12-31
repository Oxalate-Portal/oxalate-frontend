export interface PasswordResetRequest {
    newPassword: string;
    confirmPassword: string;
    token: string;
}
