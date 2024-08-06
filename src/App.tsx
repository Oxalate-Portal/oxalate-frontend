import React from "react";
import "./App.css";
import { ConfigProvider, theme } from "antd";
import { AdminRoute, AuthVerify, OrganizerRoute, PrivateRoute, useSession } from "./session";
import i18next from "i18next";
import { Navigate, Route, Routes } from "react-router-dom";
import { Register, Registration } from "./components/Register";
import { LostPassword, NewPassword, Password, ShowUser, User } from "./components/User";
import { AcceptTerms, Home, LoginWithCaptcha, NavigationBar, OxalateFooter } from "./components/main";
import { EditPage, EditPageGroup, Page, PageGroups, Pages } from "./components/Page";
import { AdminMain, AdminOrgUser, AdminOrgUsers, AuditEvents, BlockedDates, DownloadData } from "./components/Administration";
import { DiveEvent, DiveEvents, EditDiveEvent, PastDiveEvents, SetDives, ShowDiveEvent } from "./components/DiveEvent";
import { MainAdminStatistics, YearlyDiveStats } from "./components/Statistics";
import { Payments } from "./components/Payment";
import { EditCertificate } from "./components/Certificate";

function App() {
    const {darkAlgorithm} = theme;
    const {userSession, getSessionLanguage, logoutUser} = useSession();
    const sessionLanguage = getSessionLanguage();

    if (sessionLanguage !== undefined && sessionLanguage !== i18next.language) {
        i18next.changeLanguage(getSessionLanguage());
    }

    // If the user is logged in, but they have not accepted the terms and conditions, then redirect them to the terms and conditions page. The user
    // is only allowed to access their own profile page until they have accepted the terms and conditions.

    if (userSession && !userSession.approvedTerms) {
        return (
                <div className="app-container bg-light">
                    <NavigationBar/>
                    <div className="container pt-4 pb-4">
                        <ConfigProvider theme={{algorithm: darkAlgorithm}}>
                            <Routes>
                                <Route path="*" element={<Navigate to="/"/>}/>
                                <Route path="/" element={<Home/>}/>
                                <Route path="/user" element={<PrivateRoute><User/></PrivateRoute>}/>
                            </Routes>
                            {window.location.pathname !== "/user" && <AcceptTerms registration={false}/>}
                            <OxalateFooter/>
                        </ConfigProvider>
                    </div>
                    <AuthVerify logOut={logoutUser}/>
                </div>
        );
    }

    return (
            <div className="app-container bg-light">
                <NavigationBar/>
                <div className="container pt-4 pb-4">
                    <ConfigProvider theme={{algorithm: darkAlgorithm}}>
                        <Routes>
                            <Route path="*" element={<Navigate to="/"/>}/>
                            <Route path="/" element={<Home/>}/>
                            <Route path="/administration/audit" element={<AdminRoute><AuditEvents/></AdminRoute>}/>
                            <Route path="/administration/blocked-dates" element={<AdminRoute><BlockedDates/></AdminRoute>}/>
                            <Route path="/administration/download" element={<AdminRoute><DownloadData/></AdminRoute>}/>
                            <Route path="/administration/main" element={<AdminRoute><AdminMain/></AdminRoute>}/>
                            <Route path="/administration/page-groups" element={<OrganizerRoute><PageGroups/></OrganizerRoute>}/>
                            <Route path="/administration/page-groups/:paramId" element={<OrganizerRoute><EditPageGroup/></OrganizerRoute>}/>
                            <Route path="/administration/page-groups/:paramId/pages" element={<OrganizerRoute><Pages/></OrganizerRoute>}/>
                            <Route path="/administration/pages/:paramId" element={<OrganizerRoute><EditPage/></OrganizerRoute>}/>
                            <Route path="/administration/payments" element={<AdminRoute><Payments/></AdminRoute>}/>
                            <Route path="/administration/statistics" element={<AdminRoute><MainAdminStatistics/></AdminRoute>}/>
                            <Route path="/administration/users" element={<AdminRoute><AdminOrgUsers/></AdminRoute>}/>
                            <Route path="/administration/users/:paramId" element={<AdminRoute><AdminOrgUser/></AdminRoute>}/>
                            <Route path="/auth/lost-password" element={<LostPassword/>}/>
                            <Route path="/auth/new-password/:token" element={<NewPassword/>}/>
                            <Route path="/auth/reconfirm" element={<LostPassword/>}/>
                            <Route path="/auth/register" element={<Register/>}/>
                            <Route path="/events/:paramId" element={<PrivateRoute><DiveEvent/></PrivateRoute>}/>
                            <Route path="/events/:paramId/edit" element={<OrganizerRoute><EditDiveEvent/></OrganizerRoute>}/>
                            <Route path="/events/:paramId/set-dives" element={<PrivateRoute><SetDives/></PrivateRoute>}/>
                            <Route path="/events/:paramId/show" element={<PrivateRoute><ShowDiveEvent/></PrivateRoute>}/>
                            <Route path="/events/add" element={<OrganizerRoute><EditDiveEvent/></OrganizerRoute>}/>
                            <Route path="/events/dive-stats" element={<PrivateRoute><YearlyDiveStats/></PrivateRoute>}/>
                            <Route path="/events/main" element={<PrivateRoute><DiveEvents/></PrivateRoute>}/>
                            <Route path="/events/past" element={<PrivateRoute><PastDiveEvents/></PrivateRoute>}/>
                            <Route path="/login" element={<LoginWithCaptcha/>}/>
                            <Route path="/pages/:paramId" element={<Page/>}/>
                            <Route path="/registration" element={<Registration/>}/>
                            <Route path="/users/password" element={<PrivateRoute><Password/></PrivateRoute>}/>
                            <Route path="/users/:paramId/show" element={<OrganizerRoute><ShowUser/></OrganizerRoute>}/>
                            <Route path="/users/certificates/:paramId" element={<PrivateRoute><EditCertificate/></PrivateRoute>}/>
                            <Route path="/users/profile" element={<PrivateRoute><User/></PrivateRoute>}/>
                        </Routes>
                        <OxalateFooter/>
                    </ConfigProvider>
                </div>
                <AuthVerify logOut={logoutUser}/>
            </div>
    );
}

export default App;