import {render, screen} from "@testing-library/react";
import {Form} from "antd";
import type {ReactNode} from "react";
import {UserFields} from "../components/User/UserFields";

jest.mock("antd", () => {
    const FormMock = ({children}: { children: ReactNode }) => <div>{children}</div>;
    FormMock.Item = ({children}: { children: ReactNode }) => <div>{children}</div>;

    const SpaceMock = ({children}: { children: ReactNode }) => <div>{children}</div>;
    SpaceMock.Compact = ({children}: { children: ReactNode }) => <div>{children}</div>;

    return {
        Form: FormMock,
        Button: ({children, onClick}: { children: ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
        Input: () => <input/>,
        Select: () => <select/>,
        Space: SpaceMock,
        Switch: () => <input type="checkbox"/>
    };
});

let currentSessionUserId = 100;
const mockedGetFrontendConfigurationValue = () => "en,fi";
const mockedUserSession = {id: currentSessionUserId};

jest.mock("../session", () => ({
    useSession: () => ({
        userSession: mockedUserSession,
        getFrontendConfigurationValue: mockedGetFrontendConfigurationValue
    })
}));

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key
    })
}));

describe("UserFields email change visibility", () => {
    it("shows change email button for own profile", () => {
        currentSessionUserId = 100;
        mockedUserSession.id = currentSessionUserId;

        render(
                <Form>
                    <UserFields userId={100} username={"self@example.com"} isOrganizer={false}/>
                </Form>
        );

        expect(screen.getByText("User.emailChange.button")).toBeInTheDocument();
    });

    it("hides change email button for another user", () => {
        currentSessionUserId = 100;
        mockedUserSession.id = currentSessionUserId;

        render(
                <Form>
                    <UserFields userId={101} username={"other@example.com"} isOrganizer={false}/>
                </Form>
        );

        expect(screen.queryByText("User.emailChange.button")).toBeNull();
    });
});

