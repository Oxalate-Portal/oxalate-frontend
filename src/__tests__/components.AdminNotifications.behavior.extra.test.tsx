import {act, fireEvent, render, screen} from "@testing-library/react";
import type {ReactNode} from "react";
import React from "react";
import {AdminNotifications} from "../components/Notification/AdminNotifications";
import {NotificationGroupEnum, RoleEnum, UpdateStatusEnum} from "../models";

jest.mock("../services", () => ({
    notificationAPI: {createBulkNotifications: jest.fn()},
    userAPI: {findByRole: jest.fn()}
}));
const stableTranslation = {t: (key: string) => key};
jest.mock("react-i18next", () => ({useTranslation: () => stableTranslation}));

let finish: ((values: any) => void) | undefined;
const formApi = {resetFields: jest.fn(), setFieldsValue: jest.fn()};
jest.mock("antd", () => {
    const Form = ({children, onFinish}: { children: ReactNode; onFinish: (v: any) => void }) => {
        finish = onFinish;
        return <form>{children}</form>;
    };
    Form.Item = ({children, label}: { children: ReactNode; label?: string }) => <label>{label}{children}</label>;
    Form.useForm = () => [formApi];
    const Input = ({placeholder}: any) => <input placeholder={placeholder}/>;
    Input.TextArea = ({placeholder}: any) => <textarea placeholder={placeholder}/>;
    const Radio = ({children, value, onChange}: any) => <label><input type="radio" value={value} onChange={onChange}/>{children}</label>;
    Radio.Group = ({children, onChange}: any) => <div>{React.Children.map(children, (c: any) => React.cloneElement(c, {onChange}))}</div>;
    return {
        Button: ({children, onClick, htmlType}: any) => <button type={htmlType === "submit" ? "submit" : "button"} onClick={onClick}>{children}</button>,
        Form, Input, InputNumber: (p: any) => <input {...p}/>,
        Radio,
        Select: ({options = [], onChange, placeholder}: any) => <select aria-label={placeholder}
                                                                        onChange={e => onChange?.(e.target.value)}>{options.map((o: any) => <option
                key={o.value} value={o.value}>{o.label}</option>)}</select>,
        Space: ({children}: any) => <div>{children}</div>, Spin: ({children}: any) => <div>{children}</div>,
        Typography: {Title: ({children}: any) => <h2>{children}</h2>, Text: ({children}: any) => <span>{children}</span>},
        message: {useMessage: () => [{success: jest.fn(), error: jest.fn()}, <i key="holder"/>]}
    };
});

const api = jest.requireMock("../services");

beforeEach(() => {
    jest.clearAllMocks();
    finish = undefined;
    api.userAPI.findByRole.mockResolvedValue([{id: 2, name: "User"}]);
    api.notificationAPI.createBulkNotifications.mockResolvedValue({status: UpdateStatusEnum.OK});
});

describe("admin notification mode and API behavior", () => {
    it("submits all modes and handles response and rejection", async () => {
        render(<AdminNotifications/>);
        await act(async () => {
            await Promise.resolve();
        });
        finish?.({title: "T", message: "message", notificationMode: "sendAll"});
        await act(async () => {
            await Promise.resolve();
        });
        expect(api.notificationAPI.createBulkNotifications).toHaveBeenCalledWith(expect.objectContaining({sendAll: true}));
        finish?.({title: "T", message: "message", notificationMode: "group", notificationGroup: NotificationGroupEnum.ALL_REGISTERED});
        await act(async () => {
            await Promise.resolve();
        });
        expect(api.notificationAPI.createBulkNotifications).toHaveBeenCalledWith(expect.objectContaining({
            notificationGroup: NotificationGroupEnum.ALL_REGISTERED,
            sendAll: false
        }));
        api.notificationAPI.createBulkNotifications.mockResolvedValueOnce({status: UpdateStatusEnum.FAIL, message: "bad"});
        finish?.({title: "T", message: "message", notificationMode: "recipients", recipients: [2]});
        await act(async () => {
            await Promise.resolve();
        });
        api.notificationAPI.createBulkNotifications.mockRejectedValueOnce(new Error("offline"));
        finish?.({title: "T", message: "message", notificationMode: "recipients", recipients: [2]});
        await act(async () => {
            await Promise.resolve();
        });
    });

    it("guards missing groups, inactive days, and recipients and supports reset", async () => {
        render(<AdminNotifications/>);
        await act(async () => {
            await Promise.resolve();
        });
        finish?.({title: "T", message: "message", notificationMode: "group"});
        finish?.({title: "T", message: "message", notificationMode: "group", notificationGroup: NotificationGroupEnum.INACTIVE_DAYS});
        finish?.({title: "T", message: "message", notificationMode: "recipients"});
        expect(api.notificationAPI.createBulkNotifications).not.toHaveBeenCalled();
        const resetButtons = screen.getAllByRole("button", {name: "AdminNotifications.form.reset"});
        fireEvent.click(resetButtons[resetButtons.length - 1]);
        expect(formApi.resetFields).toHaveBeenCalled();
        expect(RoleEnum.ROLE_USER).toBeDefined();
    });
});
