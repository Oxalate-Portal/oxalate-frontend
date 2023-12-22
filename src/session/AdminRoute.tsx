import { Navigate } from "react-router-dom";
import { useSession } from "./SessionProvider";
import RoleEnum from "../models/RoleEnum";
import RoleRouteProps from "../models/props/RoleRouteProps";

export function AdminRoute({ children }: RoleRouteProps) {
    const {userSession} = useSession()

    if (!userSession) {
        // not logged in so redirect to login page with the return url
        return <Navigate to={"/login"}/>;
    }

    if (!userSession || userSession.roles.indexOf(RoleEnum.ROLE_ADMIN) === -1) {
        // Redirect unprivileged user to home page
        return <Navigate to={"/"}/>;
    }

    // authorized so return child components
    return <>{children}</>;
}

export default AdminRoute;