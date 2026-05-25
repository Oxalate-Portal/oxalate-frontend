/// <reference types="jest" />
import {authAPI} from '../services';
import MockAdapter from 'axios-mock-adapter';
import type {LoginRequest, PasswordResetRequest, RegistrationVO} from '../models';

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
        } as unknown as LoginRequest;

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
        } as unknown as LoginRequest;

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
        } as unknown as RegistrationVO;

        const response = {status: 'SUCCESS', message: 'Registration successful'};
        mock.onPost('/register').reply(200, response);

        const result = await authAPI.register(registrationData);
        expect(result).toEqual(response);
    });

    // Regression test: privacy must always be an explicit boolean (not null/undefined/missing).
    // When the user never touches the privacy switch on the registration form, the field defaults
    // to false via Form initialValues. Without that default the field is omitted from the payload,
    // which causes the backend to throw HttpMessageNotReadableException because
    // Java's primitive boolean cannot be deserialized from null.
    it('should send privacy as explicit false when not set by the user', async () => {
        const registrationData: RegistrationVO = {
            username: 'newuser@example.com',
            password: 'aA1^WWWWWWWWW',
            firstName: 'New',
            lastName: 'User',
            phoneNumber: '123456789012345',
            nextOfKin: 'Someone',
            privacy: false,  // default value injected by Form initialValues
            language: 'fi',
            approvedTerms: true,
            healthStatementId: 0,
            primaryUserType: 'SCUBA_DIVER' as import('../models').UserTypeEnum,
        };

        const response = {status: 'SUCCESS', token: 'abc123'};
        mock.onPost('/register').reply(200, response);

        await authAPI.register(registrationData);

        expect(mock.history.post).toHaveLength(1);
        const sentBody = JSON.parse(mock.history.post[0].data as string) as Record<string, unknown>;

        // privacy MUST be present and be a boolean false – never null, undefined, or missing
        expect(Object.prototype.hasOwnProperty.call(sentBody, 'privacy')).toBe(true);
        expect(sentBody['privacy']).toBe(false);
        expect(typeof sentBody['privacy']).toBe('boolean');
    });

    it('should send privacy as explicit true when the user opts in', async () => {
        const registrationData: RegistrationVO = {
            username: 'newuser@example.com',
            password: 'aA1^WWWWWWWWW',
            firstName: 'New',
            lastName: 'User',
            phoneNumber: '358407031231',
            nextOfKin: 'Someone',
            privacy: true,
            language: 'fi',
            approvedTerms: true,
            healthStatementId: 0,
            primaryUserType: 'SCUBA_DIVER' as import('../models').UserTypeEnum,
        };

        const response = {status: 'SUCCESS', token: 'abc123'};
        mock.onPost('/register').reply(200, response);

        await authAPI.register(registrationData);

        const sentBody = JSON.parse(mock.history.post[0].data as string) as Record<string, unknown>;
        expect(sentBody['privacy']).toBe(true);
        expect(typeof sentBody['privacy']).toBe('boolean');
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
        const data = {token: 'reset-token', password: 'newpassword123', confirmPassword: 'newpassword123'} as unknown as PasswordResetRequest;
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

    it('should request email change and return true when backend accepts request', async () => {
        const requestData = {newEmail: 'new.user@example.com', password: 'ValidPassword1!'};
        mock.onPost('/email-change/requests').reply(200, true);

        const result = await authAPI.requestEmailChange(requestData);

        expect(result).toBe(true);
        const sentBody = JSON.parse(mock.history.post[0].data as string) as Record<string, unknown>;
        expect(sentBody['newEmail']).toBe('new.user@example.com');
        expect(sentBody['password']).toBe('ValidPassword1!');
    });

    it('should request email change and return false when backend rejects request', async () => {
        const requestData = {newEmail: 'taken@example.com', password: 'WrongPassword1!'};
        mock.onPost('/email-change/requests').reply(200, false);

        const result = await authAPI.requestEmailChange(requestData);

        expect(result).toBe(false);
    });
});

