interface PasswordResetRequest {
    newPassword: string;
    confirmPassword: string;
    token: string;
}

export default PasswordResetRequest;