import React from "react";
import "./App.css";
import { ConfigProvider, theme } from "antd";
import NavigationBar from "./components/main/NavigationBar";
import Home from "./components/main/Home";
import { useSession } from "./session";
import i18next from "i18next";
import { Navigate, Route, Routes } from "react-router-dom";
import Page from "./components/Page/Page";

function App() {
    const {darkAlgorithm} = theme;
    const {userSession, getSessionLanguage} = useSession();
    const sessionLanguage = getSessionLanguage();

    if (sessionLanguage !== undefined && sessionLanguage !== i18next.language) {
        console.log("Changing language to:", sessionLanguage);
        i18next.changeLanguage(getSessionLanguage());
    }

    return (
            <div className="app-container bg-light">
                <NavigationBar/>
                <div className="container pt-4 pb-4">
                    <ConfigProvider theme={{algorithm: darkAlgorithm}}>
                        <Routes>
                            <Route path="*" element={<Navigate to="/"/>}/>
                            <Route path="/" element={<Home/>}/>
                            <Route path="/pages/:pageId" element={<Page/>}/>
                        </Routes>
                    </ConfigProvider>
                </div>
            </div>
    );
}

export default App;
