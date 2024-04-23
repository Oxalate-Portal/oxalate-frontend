import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { Login } from "./Login";

export function LoginWithCaptcha() {
    let captchaKey = import.meta.env.VITE_APP_RECAPTCHA_SITE_KEY as string;

    return (
            <GoogleReCaptchaProvider
                    reCaptchaKey={captchaKey}
                    useEnterprise={false}
            >
                <div className={"darkDiv"}>
                    <Login/>
                </div>
            </GoogleReCaptchaProvider>
    );
}
