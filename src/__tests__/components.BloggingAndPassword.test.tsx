import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import type {ReactNode} from "react";
import {BlogCard} from "../components/Blogging/BlogCard";
import {BlogControls} from "../components/Blogging/BlogControls";
import {BlogMenuItem} from "../components/Blogging/BlogMenuItem";
import {PasswordFields} from "../components/User/PasswordFields";
import {PasswordRules} from "../components/User/PasswordRules";
import {SortDirectionEnum} from "../models";
import {pageAPI} from "../services";

const stableTranslation = {t: (key: string) => key};
jest.mock("react-i18next", () => ({useTranslation: () => stableTranslation}));
jest.mock("../session", () => ({
    useSession: () => ({sessionLanguage: "en", getSessionLanguage: () => "en"})
}));
jest.mock("../services", () => ({
    pageAPI: {getPagedBlogs: jest.fn()}
}));
jest.mock("antd", () => {
    const FormItem = ({children, label}: { children: ReactNode; label?: string }) =>
            <label>{label}{children}</label>;
    const Form = ({children}: { children: ReactNode }) => <form>{children}</form>;
    Form.Item = FormItem;
    const passthrough = ({children, ...props}: { children?: ReactNode; [key: string]: unknown }) =>
            <div {...Object.fromEntries(Object.entries(props).filter(([key]) => ["data-testid"].includes(key)))}>{children}</div>;
    return {
        Form, Input: Object.assign(({...props}: { [key: string]: unknown }) =>
                <input data-testid="search" {...props}/>, {Password: () => <input type="password"/>}),
        Card: ({children, title, extra, onClick}: { children: ReactNode; title?: ReactNode; extra?: ReactNode; onClick?: () => void }) =>
                <section onClick={onClick}><h2>{title}</h2>{extra}{children}</section>,
        Typography: {Text: ({children}: { children: ReactNode }) => <span>{children}</span>},
        Row: passthrough, Col: passthrough, Space: passthrough, Select: passthrough,
        InputNumber: passthrough, Switch: ({checked, onChange}: { checked: boolean; onChange: (v: boolean) => void }) =>
                <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}/>,
        Button: ({children, onClick, disabled}: { children: ReactNode; onClick?: () => void; disabled?: boolean }) =>
                <button onClick={onClick} disabled={disabled}>{children}</button>,
        Spin: passthrough
    };
});

describe("blog controls, cards, menu, and password guidance", () => {
    beforeEach(() => jest.clearAllMocks());

    it("renders card states and sanitizes/expands the selected version", () => {
        const blog = {
            id: 4, createdAt: "2024-01-02", modifiedAt: null,
            pageVersions: [{language: "en", title: "<b>Title</b>", ingress: "Intro", body: "<p>Body</p>"}]
        } as never;
        const click = jest.fn();
        render(<BlogCard blog={blog} expanded={false} onClick={click}/>);
        expect(screen.getByText(/BlogCard\.published/)).toBeInTheDocument();
        fireEvent.click(screen.getByRole("heading", {level: 4}));
        expect(click).toHaveBeenCalled();
        render(<BlogCard blog={blog} expanded onClick={click}/>);
        expect(screen.getByText("Body")).toBeInTheDocument();
        render(<BlogCard blog={{...(blog as object), pageVersions: []} as never} onClick={click} expanded={false}/>);
        expect(screen.queryByText("BlogCard.published")).not.toBeInTheDocument();
    });

    it("disables sorting for one item and supports load-more and search controls", () => {
        const callbacks = [jest.fn(), jest.fn(), jest.fn(), jest.fn(), jest.fn()];
        render(<BlogControls sortBy="createdAt" sortDirection={SortDirectionEnum.ASC} searchText=""
                             caseSensitive={false} onSortByChange={callbacks[0]} onSortDirectionChange={callbacks[1]}
                             onSearchChange={callbacks[2]} onCaseSensitiveChange={callbacks[3]}
                             showLoadMore hasMore onLoadMore={callbacks[4]} totalItems={1}/>);
        expect(screen.getByText("BlogControls.loadMore")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button"));
        expect(callbacks[4]).toHaveBeenCalled();
        fireEvent.change(screen.getByTestId("search"), {target: {value: "term"}});
        expect(callbacks[2]).toHaveBeenCalledWith("term");
        render(<BlogControls sortBy="title" sortDirection={SortDirectionEnum.DESC} searchText=""
                             caseSensitive onSortByChange={callbacks[0]} onSortDirectionChange={callbacks[1]}
                             onSearchChange={callbacks[2]} onCaseSensitiveChange={callbacks[3]}
                             showLoadMore hasMore={false} totalItems={2}/>);
        expect(screen.getByText("BlogControls.noMore")).toBeInTheDocument();
    });

    function MenuProbe({enabled}: { enabled: boolean }) {
        const items = BlogMenuItem({blogEnabled: enabled});
        return <output data-testid="menu-size">{items.length}</output>;
    }

    it("loads blog menu entries, empty state, and failure state", async () => {
        (pageAPI.getPagedBlogs as jest.Mock).mockResolvedValueOnce({content: [{id: 1, pageVersions: [{title: "Post"}]}]});
        const {rerender} = render(<MenuProbe enabled/>);
        await waitFor(() => expect(screen.getByTestId("menu-size")).toHaveTextContent("1"));
        rerender(<MenuProbe enabled={false}/>);
        expect(screen.getByTestId("menu-size")).toHaveTextContent("0");
        (pageAPI.getPagedBlogs as jest.Mock).mockRejectedValueOnce(new Error("offline"));
        rerender(<MenuProbe enabled/>);
        await waitFor(() => expect(screen.getByTestId("menu-size")).toHaveTextContent("1"));
    });

    it("renders translated password rules and fields", () => {
        render(<><PasswordRules/><PasswordFields/></>);
        expect(screen.getByText("PasswordRules.rule.1")).toBeInTheDocument();
        expect(screen.getByLabelText("PasswordFields.form.newPassword.label")).toHaveAttribute("type", "password");
        expect(screen.getByLabelText("PasswordFields.form.confirmPassword.label")).toHaveAttribute("type", "password");
    });
});
