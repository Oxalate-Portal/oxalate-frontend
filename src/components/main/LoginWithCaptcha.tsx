import {Login} from "./Login";
import {WithCaptcha} from "./WithCaptcha";

export function LoginWithCaptcha() {
    return (
        <WithCaptcha>
            <div className={"darkDiv"}>
                <Login/>
            </div>
        </WithCaptcha>
    );
}
