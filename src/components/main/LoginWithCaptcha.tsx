import Login from "./Login";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

function LoginWithCaptcha() {
    let captchaKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY as string;
    console.log("Using captcha key:", captchaKey);

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

export default LoginWithCaptcha;