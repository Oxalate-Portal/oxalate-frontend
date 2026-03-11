import {Navigate} from "react-router-dom";
import {useSession} from "./useSession";
import type {RoleRouteProps} from "../models";

export function PrivateRoute({children}: RoleRouteProps) {
    const {userSession} = useSession();

    if (!userSession) {
        return <Navigate to="/login"/>;
    }

    // authorized so return child components
    return <>{children}</>;

}
