import React from "react";
import "./App.css";
import { ConfigProvider, theme } from "antd";
import NavigationBar from "./components/main/NavigationBar";
import Home from "./components/main/Home";
import { useSession } from "./session";
import i18next from "i18next";
import { Navigate, Route, Routes } from "react-router-dom";
import Page from "./components/Page/Page";
import LoginWithCaptcha from "./components/main/LoginWithCaptcha";

function App() {
    const {darkAlgorithm} = theme;
    const {userSession, getSessionLanguage} = useSession();
    const sessionLanguage = getSessionLanguage();

    if (sessionLanguage !== undefined && sessionLanguage !== i18next.language) {
        console.log("Changing language to:", sessionLanguage);
        i18next.changeLanguage(getSessionLanguage());
    }

    let routes = null;
    // If the user is not logged in, then the user can only visit the front page, the login page and designated public pages where the anonymous user has access
    if (!userSession) {
        console.log("User is not logged in");
        routes = <Routes>
            <Route path="*" element={<Navigate to="/"/>}/>
            <Route path="/" element={<Home/>}/>
            <Route path="/login" element={<LoginWithCaptcha/>}/>
            <Route path="/pages/:pageId" element={<Page/>}/>
        </Routes>;
    } else if (userSession && !userSession.approvedTerms) {
        console.log("User is logged in, but has not accepted terms and conditions");
    } else {
        routes = <Routes>
            <Route path="*" element={<Navigate to="/"/>}/>
            <Route path="/" element={<Home/>}/>
            <Route path="/pages/:pageId" element={<Page/>}/>
        </Routes>;
    }

    // If the user is logged in, but they have not accepted the terms and conditions, then redirect them to the terms and conditions page. The user
    // is only allowed to access their own profile page until they have accepted the terms and conditions.

    return (
            <div className="app-container bg-light">
                <NavigationBar/>
                <div className="container pt-4 pb-4">
                    <ConfigProvider theme={{algorithm: darkAlgorithm}}>
                        {routes}
                    </ConfigProvider>
                </div>
            </div>
    );
}

export default App;
