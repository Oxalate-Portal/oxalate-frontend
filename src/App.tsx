import React from "react";
import "./App.css";
import {ConfigProvider, theme} from "antd";
import {AdminRoute, AuthVerify, PrivateRoute, useSession} from "./session";
import i18next from "i18next";
import {Navigate, Route, Routes} from "react-router-dom";
import {Register} from "./components/Register";
import {LostPassword, NewPassword, Password, User} from "./components/User";
import {Home, LoginWithCaptcha, NavigationBar} from "./components/main";
import {Page} from "./components/Page";
import {AdminMain} from "./components/Administration";

function App() {
    const {darkAlgorithm} = theme;
    const {userSession, getSessionLanguage, logoutUser} = useSession();
    const sessionLanguage = getSessionLanguage();

    if (sessionLanguage !== undefined && sessionLanguage !== i18next.language) {
        console.log("Changing language to:", sessionLanguage);
        i18next.changeLanguage(getSessionLanguage());
    }

    // If the user is not logged in, then the user can only visit the front page, the login page and designated public pages where the anonymous user has access
    if (userSession && !userSession.approvedTerms) {
        console.log("User is logged in, but has not accepted terms and conditions");
    }

    // If the user is logged in, but they have not accepted the terms and conditions, then redirect them to the terms and conditions page. The user
    // is only allowed to access their own profile page until they have accepted the terms and conditions.

    return (
            <div className="app-container bg-light">
                <NavigationBar/>
                <div className="container pt-4 pb-4">
                    <ConfigProvider theme={{algorithm: darkAlgorithm}}>
                        <Routes>
                            <Route path="*" element={<Navigate to="/"/>}/>
                            <Route path="/" element={<Home/>}/>
                            <Route path="/administration/main" element={<AdminRoute><AdminMain/></AdminRoute>}/>
                            <Route path="/auth/lost-password" element={<LostPassword/>}/>
                            <Route path="/auth/new-password/:token" element={<NewPassword/>}/>
                            <Route path="/auth/reconfirm" element={<LostPassword/>}/>
                            <Route path="/auth/register" element={<Register/>}/>
                            <Route path="/login" element={<LoginWithCaptcha/>}/>
                            <Route path="/pages/:pageId" element={<Page/>}/>
                            <Route path="/users/profile" element={<PrivateRoute><User/></PrivateRoute>}/>
                            <Route path="/users/password" element={<PrivateRoute><Password/></PrivateRoute>}/>
                        </Routes>
                    </ConfigProvider>
                </div>
                <AuthVerify logOut={logoutUser}/>
            </div>
    );
}

export default App;
