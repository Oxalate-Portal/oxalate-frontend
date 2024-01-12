import { useSession } from "./SessionProvider";
import { Navigate } from "react-router-dom";
import { RoleRouteProps } from "../models/props";

export function PrivateRoute({ children }: RoleRouteProps) {
    const {userSession} = useSession()

    if (!userSession) {
        // not logged in so redirect to login page with the return url
        console.log("User is not logged in so we forward the browser to login page")
        return <Navigate to="/login"/>
    }

    // authorized so return child components
    return <>{children}</>;

}
