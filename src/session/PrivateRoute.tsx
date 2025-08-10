import {useSession} from "./SessionProvider";
import {Navigate} from "react-router-dom";
import {RoleRouteProps} from "../models";

export function PrivateRoute({children}: RoleRouteProps) {
    const {userSession} = useSession();

    if (!userSession) {
        return <Navigate to="/login"/>;
    }

    // authorized so return child components
    return <>{children}</>;

}
