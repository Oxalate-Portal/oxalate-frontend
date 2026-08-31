import {GoogleReCaptchaProvider} from "@wojtekmaj/react-recaptcha-v3";
import {Login} from "./Login";
import {runtimeConfig} from "../../runtimeConfig";

export function LoginWithCaptcha() {
    return (
            <GoogleReCaptchaProvider
                    reCaptchaKey={runtimeConfig.recaptchaSiteKey}
                    useEnterprise={false}
            >
                <div className={"darkDiv"}>
                    <Login/>
                </div>
            </GoogleReCaptchaProvider>
    );
}
