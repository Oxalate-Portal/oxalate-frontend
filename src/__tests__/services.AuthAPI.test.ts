/// <reference types="jest" />
import {authAPI} from '../services';
import MockAdapter from 'axios-mock-adapter';

describe('AuthAPI', () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(authAPI['axiosInstance']);
        localStorage.clear();
    });

    afterEach(() => {
        mock.reset();
        localStorage.clear();
        jest.restoreAllMocks();
    });

    it('should login a user and store session', async () => {
        const loginRequest = {
            email: 'test@example.com',
            password: 'password123',
            recaptchaToken: 'token'
        } as any;

        const sessionResponse = {
            id: 1,
            email: 'test@example.com',
            token: 'jwt-token'
        };

        mock.onPost('/login').reply(200, sessionResponse);
        const result = await authAPI.login(loginRequest);

        expect(result).toEqual(sessionResponse);
        expect(localStorage.getItem('user')).toBe(JSON.stringify(sessionResponse));
    });

    it('should not store session when id is 0', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        const loginRequest = {
            email: 'test@example.com',
            password: 'wrongpassword',
            recaptchaToken: 'token'
        } as any;

        const failResponse = {id: 0, email: 'test@example.com', token: ''};

        mock.onPost('/login').reply(200, failResponse);
        const result = await authAPI.login(loginRequest);

        expect(result).toEqual(failResponse);
        expect(localStorage.getItem('user')).toBeNull();
        expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should logout a user', async () => {
        mock.onGet('/logout').reply(200);
        await authAPI.logout();
        expect(mock.history.get).toHaveLength(1);
    });

    it('should register a new user', async () => {
        const registrationData = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            password: 'password123'
        } as any;

        const response = {status: 'SUCCESS', message: 'Registration successful'};
        mock.onPost('/register').reply(200, response);

        const result = await authAPI.register(registrationData);
        expect(result).toEqual(response);
    });

    it('should resend registration email', async () => {
        const token = 'registration-token';
        mock.onPost('/registrations/resend-confirmation').reply(200);

        const result = await authAPI.resendRegistrationEmail(token);
        expect(result).toBe(true);
    });

    it('should recover lost password', async () => {
        const data = {email: 'test@example.com'};
        const response = {status: 'SUCCESS', message: 'Recovery email sent'};

        mock.onPost('/lost-password').reply(200, response);
        const result = await authAPI.recoverLostPassword(data);
        expect(result).toEqual(response);
    });

    it('should reset password', async () => {
        const data = {token: 'reset-token', password: 'newpassword123', confirmPassword: 'newpassword123'} as any;
        const response = {status: 'SUCCESS', message: 'Password reset successfully'};

        mock.onPost('/reset-password').reply(200, response);
        const result = await authAPI.resetPassword(data);
        expect(result).toEqual(response);
    });

    it('should update user password', async () => {
        const userId = 1;
        const passwordData = {oldPassword: 'oldpassword', newPassword: 'newpassword', confirmPassword: 'newpassword'};
        const response = {status: 'SUCCESS', message: 'Password updated'};

        mock.onPut('/1/password').reply(200, response);
        const result = await authAPI.updatePassword(userId, passwordData);
        expect(result).toEqual(response);
    });
});

