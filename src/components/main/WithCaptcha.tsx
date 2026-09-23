import type {ReactNode} from "react";
import {GoogleReCaptchaProvider} from "@wojtekmaj/react-recaptcha-v3";
import {runtimeConfig} from "../../runtimeConfig";

interface WithCaptchaProps {
    children: ReactNode;
}

/**
 * Provides Google reCAPTCHA v3 to the unauthenticated screens whose backend endpoints are captcha protected
 * (login, registration, lost and reset password, resend confirmation). Every submit inside must obtain a token with
 * `useReCaptcha().executeRecaptcha(action)` and hand it to the `authAPI` call, which sends it as `X-Captcha-Token`.
 */
export function WithCaptcha({children}: WithCaptchaProps) {
    return (
        <GoogleReCaptchaProvider
            reCaptchaKey={runtimeConfig.recaptchaSiteKey}
            useEnterprise={false}
        >
            {children}
        </GoogleReCaptchaProvider>
    );
}
