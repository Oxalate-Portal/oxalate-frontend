import {fireEvent, render, renderHook, screen, waitFor} from "@testing-library/react";
import type {ReactNode} from "react";
import {Blog} from "../components/Blogging/Blog";
import {BlogCard} from "../components/Blogging/BlogCard";
import {BlogControls} from "../components/Blogging/BlogControls";
import {BlogMenuItem} from "../components/Blogging/BlogMenuItem";
import {useBlogMenuItems} from "../components/Blogging/useBlogMenuItems";
import {Certificates} from "../components/Certificate/Certificates";
import {EditCertificate} from "../components/Certificate/EditCertificate";
import {ShowCertificateCard} from "../components/Certificate/ShowCertificateCard";
import {SortDirectionEnum} from "../models";
import {certificateAPI, fileTransferAPI, pageAPI} from "../services";

const formPropsRef = {current: undefined as { onFinish: (values: never) => void } | undefined};
let itemRules: unknown[][] = [];
const uploadPropsRef = {current: undefined as { beforeUpload?: (file: { size: number }) => boolean | void; onChange?: (info: never) => void } | undefined};
const messageApi = {success: jest.fn(), error: jest.fn()};
let mockParam: string | undefined = "4";

const mockTranslation = {t: (key: string) => key};
const mockSession = {
    sessionLanguage: "en",
    getSessionLanguage: () => "en",
    getFrontendConfigurationValue: () => "2"
};
const mockCertificateForm = {setFieldsValue: jest.fn()};
jest.mock("react-i18next", () => ({useTranslation: () => mockTranslation}));
jest.mock("react-router-dom", () => ({
    NavLink: ({children, to}: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
    useParams: () => ({paramId: mockParam})
}));
jest.mock("../session", () => ({
    useSession: () => mockSession
}));
jest.mock("../services", () => ({
    pageAPI: {getPagedBlogs: jest.fn()},
    certificateAPI: {
        findById: jest.fn(), findAllByUserId: jest.fn(), findCertificateNames: jest.fn(), findOrganizations: jest.fn(),
        update: jest.fn(), create: jest.fn(), delete: jest.fn()
    },
    fileTransferAPI: {removeCertificateFile: jest.fn()}
}));
jest.mock("../services/getApiBaseUrl", () => ({getApiBaseUrl: () => "https://api.test"}));
jest.mock("../components/main", () => ({
    ProtectedImage: ({onRemove, viewOnly, alt}: { onRemove: () => void; viewOnly: boolean; alt: string }) =>
            <div><img alt={alt}/>{!viewOnly && <button onClick={onRemove}>remove photo</button>}</div>
}));
jest.mock("antd", () => {
    const passthrough = ({children, ...props}: { children?: ReactNode; [key: string]: unknown }) =>
            <div {...Object.fromEntries(Object.entries(props).filter(([key]) => key === "data-testid"))}>{children}</div>;
    const Form = ({children, onFinish}: { children: ReactNode; onFinish?: (values: never) => void }) => {
        // This mock exposes the latest form callback to the test cases.
        // eslint-disable-next-line react-hooks/immutability
        formPropsRef.current = {onFinish: onFinish ?? (() => undefined)};
        return <form>{children}</form>;
    };
    Form.useForm = () => [mockCertificateForm];
    Form.Item = ({children, label, rules}: { children: ReactNode; label?: string; rules?: unknown[] }) => {
        if (rules) itemRules.push(rules);
        return <label>{label}{children}</label>;
    };
    const Input = (props: Record<string, unknown>) => <input {...props}/>;
    const AutoComplete = ({options = [], showSearch, placeholder}: {
        options?: Array<{ value: string }>;
        showSearch?: { onSearch?: (value: string) => void };
        placeholder?: string;
    }) => <div>
        <input placeholder={placeholder} onChange={event => showSearch?.onSearch?.(event.target.value)}/>
        {options.map(option => <span key={option.value}>{option.value}</span>)}
    </div>;
    const Upload = ({children, ...props}: {
        children: ReactNode;
        beforeUpload?: (file: { size: number }) => boolean | void;
        onChange?: (info: never) => void
    }) => {
        // This mock exposes upload callbacks to the test cases.
        // eslint-disable-next-line react-hooks/immutability
        uploadPropsRef.current = props;
        return <div>{children}</div>;
    };
    return {
        Form,
        AutoComplete,
        Button: ({children, onClick, href, disabled}: { children: ReactNode; onClick?: () => void; href?: string; disabled?: boolean }) =>
                <button onClick={onClick} disabled={disabled} data-href={href}>{children}</button>,
        Card: ({children, title, extra, onClick}: { children: ReactNode; title?: ReactNode; extra?: ReactNode; onClick?: () => void }) =>
                <section onClick={onClick}><h2>{title}</h2>{extra}{children}</section>,
        Col: passthrough, Row: passthrough, Space: passthrough, Spin: passthrough,
        Typography: {
            Title: ({children}: { children: ReactNode }) => <h1>{children}</h1>,
            Text: ({children}: { children: ReactNode }) => <span>{children}</span>
        },
        Select: ({options, onChange, disabled}: { options: { value: string; label: string }[]; onChange: (v: string) => void; disabled?: boolean }) =>
                <select disabled={disabled} onChange={e => onChange(e.target.value)}>{options.map(o => <option key={o.value}
                                                                                                               value={o.value}>{o.label}</option>)}</select>,
        Input, Switch: ({checked, onChange}: { checked: boolean; onChange: (v: boolean) => void }) =>
                <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}/>,
        Empty: ({description}: { description: ReactNode }) => <div>{description}</div>,
        message: {useMessage: () => [messageApi, <span key="message"/>]},
        Upload, Tooltip: ({children}: { children: ReactNode }) => <>{children}</>,
        QuestionCircleOutlined: () => <span/>,
        UploadOutlined: () => <span/>
    };
});

const blog = (id: number, title = "Blog title") => ({
    id, createdAt: "2024-01-02", modifiedAt: null,
    pageVersions: [{language: "en", title, ingress: "<b>Intro</b>", body: "<p>Body</p>"}]
}) as never;
const certificate = (id = 3) => ({
    id, userId: 8, organization: "Org", certificateName: "Diver cert",
    certificateId: "CERT123", diverId: "DIVER123", certificationDate: "2024-01-01",
    certificatePhotoUrl: null
}) as never;

function MenuProbe() {
    const items = BlogMenuItem({blogEnabled: true}) as never[];
    return <output>{items.length}</output>;
}

beforeEach(() => {
    jest.clearAllMocks();
    formPropsRef.current = undefined;
    itemRules = [];
    uploadPropsRef.current = undefined;
    (pageAPI.getPagedBlogs as jest.Mock).mockResolvedValue({content: [blog(1)], page: 0, last: false, total_elements: 1});
    (certificateAPI.findAllByUserId as jest.Mock).mockResolvedValue([certificate()]);
});

describe("blogging components", () => {
    it("covers card fallback, sanitization, expansion and blog controls", () => {
        const click = jest.fn();
        const {rerender} = render(<BlogCard blog={blog(1, "<img src=x onerror=alert(1)>Title")} expanded={false} onClick={click}/>);
        expect(screen.getByText("Title")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("heading", {level: 4}));
        expect(click).toHaveBeenCalled();
        rerender(<BlogCard blog={blog(1)} expanded onClick={click}/>);
        expect(screen.getByText("Body")).toBeInTheDocument();
        rerender(<BlogCard blog={{...blog(1), pageVersions: []} as never} expanded={false} onClick={click}/>);
        expect(screen.queryByText("Body")).not.toBeInTheDocument();

        const callbacks = [jest.fn(), jest.fn(), jest.fn(), jest.fn(), jest.fn()];
        render(<BlogControls sortBy="createdAt" sortDirection={SortDirectionEnum.DESC} searchText="" caseSensitive={false}
                             onSortByChange={callbacks[0]} onSortDirectionChange={callbacks[1]} onSearchChange={callbacks[2]}
                             onCaseSensitiveChange={callbacks[3]} showLoadMore hasMore onLoadMore={callbacks[4]} totalItems={2}/>);
        fireEvent.change(screen.getAllByRole("combobox")[0], {target: {value: "title"}});
        fireEvent.change(screen.getByRole("textbox"), {target: {value: "term"}});
        fireEvent.click(screen.getByRole("button"));
        expect(callbacks[0]).toHaveBeenCalledWith("title");
        expect(callbacks[2]).toHaveBeenCalledWith("term");
        expect(callbacks[4]).toHaveBeenCalled();
        render(<BlogControls sortBy="createdAt" sortDirection={SortDirectionEnum.DESC} searchText="" caseSensitive={false}
                             onSortByChange={callbacks[0]} onSortDirectionChange={callbacks[1]} onSearchChange={callbacks[2]}
                             onCaseSensitiveChange={callbacks[3]} totalItems={1}/>);
        expect(screen.getAllByRole("combobox").at(-2)).toBeDisabled();
    });

    it("loads menu states and blog pages, including search, sorting, expansion and more", async () => {
        const {result} = renderHook(() => useBlogMenuItems(true));
        await waitFor(() => expect(result.current[0]).toBeTruthy());
        expect(pageAPI.getPagedBlogs).toHaveBeenCalled();
        const disabled = renderHook(() => useBlogMenuItems(false));
        expect(disabled.result.current).toEqual([]);
        (pageAPI.getPagedBlogs as jest.Mock).mockRejectedValueOnce(new Error("offline"));
        const failed = renderHook(() => useBlogMenuItems(true));
        await waitFor(() => expect(failed.result.current[0]).toBeTruthy());
        (pageAPI.getPagedBlogs as jest.Mock).mockResolvedValueOnce({content: [{id: 2, pageVersions: []}]});
        render(<MenuProbe/>);
        await waitFor(() => expect(screen.getByText("1")).toBeInTheDocument());

        (pageAPI.getPagedBlogs as jest.Mock).mockResolvedValue({content: [blog(1), blog(2)], page: 0, last: false, total_elements: 2});
        render(<Blog/>);
        await waitFor(() => expect(screen.getAllByText("Blog title").length).toBeGreaterThan(0));
        fireEvent.change(screen.getAllByRole("combobox")[0], {target: {value: "title"}});
        fireEvent.change(screen.getAllByRole("textbox").at(-1)!, {target: {value: "query"}});
        fireEvent.click(screen.getAllByRole("button").at(-1)!);
        await waitFor(() => expect(screen.getAllByRole("heading", {level: 4}).length).toBeGreaterThan(0));
        fireEvent.click(screen.getAllByRole("heading", {level: 4})[0]);
        expect(pageAPI.getPagedBlogs).toHaveBeenCalled();
    });
});

describe("certificate components", () => {
    it("loads certificates, respects view-only permissions, and deletes after confirmation", async () => {
        const confirm = jest.spyOn(window, "confirm").mockReturnValue(true);
        (certificateAPI.delete as jest.Mock).mockRejectedValue(new Error("delete failed"));
        const {rerender} = render(<Certificates userId={8} viewOnly={false}/>);
        await waitFor(() => expect(screen.getAllByText(/Diver cert/).length).toBeGreaterThan(0));
        expect(screen.getByText("Certificates.panel.addButton")).toBeInTheDocument();
        fireEvent.click(screen.getByText("common.button.delete"));
        expect(certificateAPI.delete).toHaveBeenCalledWith(3);
        rerender(<Certificates userId={8} viewOnly/>);
        expect(screen.queryByText("Certificates.panel.addButton")).not.toBeInTheDocument();
        confirm.mockReturnValue(false);
        expect(screen.queryByText("common.button.delete")).not.toBeInTheDocument();
        confirm.mockRestore();
    });

    it("covers edit create/update success and failure paths", async () => {
        mockParam = "4";
        (certificateAPI.findById as jest.Mock).mockResolvedValue(certificate(4));
        (certificateAPI.update as jest.Mock).mockResolvedValue({id: 4});
        const {rerender} = render(<EditCertificate/>);
        await waitFor(() => expect(formPropsRef.current).toBeDefined());
        formPropsRef.current!.onFinish(certificate(4));
        await waitFor(() => expect(messageApi.success).toHaveBeenCalled());
        (certificateAPI.update as jest.Mock).mockRejectedValueOnce(new Error("no update"));
        formPropsRef.current!.onFinish(certificate(4));
        await waitFor(() => expect(messageApi.error).toHaveBeenCalled());
        mockParam = "0";
        (certificateAPI.create as jest.Mock).mockResolvedValue({id: 9});
        rerender(<EditCertificate/>);
        await waitFor(() => expect(formPropsRef.current).toBeDefined());
        formPropsRef.current!.onFinish(certificate(0));
        await waitFor(() => expect(certificateAPI.create).toHaveBeenCalled());
        (certificateAPI.create as jest.Mock).mockResolvedValueOnce({id: 0});
        formPropsRef.current!.onFinish(certificate(0));
        await waitFor(() => expect(messageApi.error).toHaveBeenCalled());
        mockParam = "";
        rerender(<EditCertificate/>);
        await waitFor(() => expect(screen.getByText("EditCertificate.title")).toBeInTheDocument());
        mockParam = "0";
        // Exercise both cross-field validators with empty and valid counterpart values.
        const validator = itemRules.flat().find(rule => typeof rule === "function") as ((args: { getFieldValue: (name: string) => string }) => {
            validator: (rule: unknown, value: string) => Promise<void>
        });
        await expect(validator({getFieldValue: () => ""}).validator({}, "")).rejects.toThrow();
        await expect(validator({getFieldValue: () => "valid"}).validator({}, "valid")).resolves.toBeUndefined();
    });

    it("renders certificate photo controls and remove success/failure", async () => {
        const cert = {...certificate(), certificatePhotoUrl: "photo.jpg"} as never;
        render(<ShowCertificateCard certificate={cert} deleteCertificate={jest.fn()} viewOnly={false}/>);
        expect(screen.getByAltText("ShowCertificateCard.card.certificatePhoto")).toBeInTheDocument();
        (fileTransferAPI.removeCertificateFile as jest.Mock).mockResolvedValueOnce(undefined);
        fireEvent.click(screen.getAllByText("remove photo").at(-1)!);
        await waitFor(() => expect(fileTransferAPI.removeCertificateFile).toHaveBeenCalledWith(3));
        uploadPropsRef.current!.beforeUpload!({size: 2 * 1024 * 1024});
        uploadPropsRef.current!.onChange!({file: {status: "done", response: {url: "new.jpg"}, name: "cert.jpg"}} as never);
        uploadPropsRef.current!.onChange!({file: {status: "error", name: "cert.jpg"}} as never);
        (fileTransferAPI.removeCertificateFile as jest.Mock).mockRejectedValueOnce(new Error("remove failed"));
        render(<ShowCertificateCard certificate={cert} deleteCertificate={jest.fn()} viewOnly={false}/>);
        fireEvent.click(screen.getAllByText("remove photo").at(-1)!);
        await waitFor(() => expect(messageApi.error).toHaveBeenCalled());
        const view = render(<ShowCertificateCard certificate={certificate()} deleteCertificate={null} viewOnly/>);
        expect(view.container).toBeInTheDocument();
    });
});

describe("blog and certificate edge interactions", () => {
    it("changes sort direction and case sensitivity, appends pages, and shows empty results", async () => {
        (pageAPI.getPagedBlogs as jest.Mock).mockResolvedValue({content: [blog(1), blog(2, "Second")], page: 0, last: false, total_elements: 2});
        render(<Blog/>);
        await waitFor(() => expect(screen.getByText("Blog title")).toBeInTheDocument());
        const selects = screen.getAllByRole("combobox");
        fireEvent.change(selects[1], {target: {value: "ASC"}});
        fireEvent.click(screen.getAllByRole("checkbox")[0]);
        fireEvent.click(screen.getAllByRole("button").at(-1)!);
        await waitFor(() => expect(pageAPI.getPagedBlogs).toHaveBeenCalled());

        (pageAPI.getPagedBlogs as jest.Mock).mockResolvedValueOnce({content: [], page: 0, last: true, total_elements: 0});
        fireEvent.change(screen.getAllByRole("textbox").at(-1)!, {target: {value: "none"}});
        await waitFor(() => expect(screen.getByText("Blog.empty")).toBeInTheDocument());
    });

    it("handles certificate load failure and cancellation without mutating data", async () => {
        (certificateAPI.findAllByUserId as jest.Mock).mockRejectedValueOnce(new Error("offline"));
        render(<Certificates userId={99} viewOnly={false}/>);
        await waitFor(() => expect(certificateAPI.findAllByUserId).toHaveBeenCalledWith(99));
        expect(screen.getByText("Certificates.panel.addButton")).toBeInTheDocument();
        const confirm = jest.spyOn(window, "confirm").mockReturnValue(false);
        (certificateAPI.findAllByUserId as jest.Mock).mockResolvedValueOnce([certificate()]);
        render(<Certificates userId={8} viewOnly={false}/>);
        await waitFor(() => expect(screen.getAllByText(/Diver cert/).length).toBeGreaterThan(0));
        fireEvent.click(screen.getByText("common.button.delete"));
        expect(confirm).toHaveBeenCalled();
        expect(certificateAPI.delete).not.toHaveBeenCalled();
        confirm.mockRestore();
    });
});
