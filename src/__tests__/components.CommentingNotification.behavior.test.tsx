import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {CommentCanvas} from "../components/Commenting/CommentCanvas";
import {CommentCard} from "../components/Commenting/CommentCard";
import {CommentEditor} from "../components/Commenting/CommentEditor";
import {CommentList} from "../components/Commenting/CommentList";
import {CommentModerationActions} from "../components/Commenting/CommentModerationActions";
import {DisplayCommentThread} from "../components/Commenting/DisplayCommentThread";
import {Forum} from "../components/Commenting/Forum";
import {ReportCard} from "../components/Commenting/ReportCard";
import {NotificationDropdown} from "../components/Notification/NotificationDropdown";
import {NotificationList} from "../components/Notification/NotificationList";
import {UpdateStatusEnum} from "../models";

jest.mock("../services", () => ({
    commentAPI: {
        findAllForParentId: jest.fn(), create: jest.fn(), report: jest.fn(),
        cancelReport: jest.fn(), rejectComment: jest.fn(), rejectReports: jest.fn(),
        acceptReport: jest.fn(), dismissReport: jest.fn(), findFilteredComments: jest.fn(),
        findAllForParentIdWithDepth: jest.fn()
    },
    notificationAPI: {
        getUnreadNotifications: jest.fn(), markNotificationsAsRead: jest.fn(),
        getAllNotifications: jest.fn(), createBulkNotifications: jest.fn()
    },
    userAPI: {findAll: jest.fn(), findByRole: jest.fn()}
}));
const mockCommentAPI = jest.requireMock("../services").commentAPI;
const mockNotificationAPI = jest.requireMock("../services").notificationAPI;
const mockUserAPI = jest.requireMock("../services").userAPI;
const stableTranslation = {t: (key: string) => key};
jest.mock("react-i18next", () => ({useTranslation: () => stableTranslation}));

const comment = (overrides: Record<string, unknown> = {}) => ({
    id: 7, parentCommentId: 9, title: "Title", body: "Body", username: "User",
    commentStatus: "PENDING", commentType: "USER_COMMENT",
    avatarUrl: "", createdAt: "2024-01-02T03:04:00Z", childCount: 1,
    childComments: [], userHasReported: false, ...overrides
}) as never;
const notification = (id: number, read = false) => ({
    id, title: `Notice ${id}`, message: id === 1 ? "Short" : "A".repeat(60),
    createdAt: "2024-01-02T03:04:00Z", read
}) as never;

beforeEach(() => {
    jest.clearAllMocks();
    mockCommentAPI.create.mockResolvedValue({});
    mockCommentAPI.report.mockResolvedValue({status: UpdateStatusEnum.OK});
    mockCommentAPI.cancelReport.mockResolvedValue({status: UpdateStatusEnum.OK});
    mockCommentAPI.rejectComment.mockResolvedValue({});
    mockCommentAPI.rejectReports.mockResolvedValue({});
    mockCommentAPI.acceptReport.mockResolvedValue({});
    mockCommentAPI.dismissReport.mockResolvedValue({});
    mockNotificationAPI.markNotificationsAsRead.mockResolvedValue({});
    mockNotificationAPI.createBulkNotifications.mockResolvedValue({status: UpdateStatusEnum.OK});
    mockUserAPI.findAll.mockResolvedValue([]);
    mockUserAPI.findByRole.mockResolvedValue([]);
});

describe("comment editor, canvas, and thread behavior", () => {
    it("rejects blank comments and submits valid comments", async () => {
        const refresh = jest.fn();
        render(<CommentEditor parentCommentId={4} refreshCommentList={refresh}/>);
        fireEvent.click(screen.getByRole("button"));
        expect(mockCommentAPI.create).not.toHaveBeenCalled();
        fireEvent.change(screen.getByPlaceholderText("CommentEditor.form.title.placeholder"), {target: {value: "A title"}});
        fireEvent.change(screen.getByPlaceholderText("CommentEditor.form.textarea.placeholder"), {target: {value: " A body "}});
        fireEvent.click(screen.getByRole("button"));
        await waitFor(() => expect(mockCommentAPI.create).toHaveBeenCalledWith(expect.objectContaining({
            parentCommentId: 4,
            title: "A title",
            body: " A body "
        })));
        expect(refresh).toHaveBeenCalled();
    });

    it("refreshes canvas for root children and ordinary comments, including failures", async () => {
        const child = comment({id: 8});
        mockCommentAPI.findAllForParentId.mockResolvedValueOnce({parentCommentId: 1, childComments: [child]});
        const {rerender} = render(<CommentCanvas commentId={10} allowComment={false}/>);
        await waitFor(() => expect(screen.getByText("User (#8)")).toBeInTheDocument());
        mockCommentAPI.findAllForParentId.mockResolvedValueOnce(comment({parentCommentId: 20}));
        rerender(<CommentCanvas commentId={11} allowComment/>);
        await waitFor(() => expect(mockCommentAPI.findAllForParentId).toHaveBeenCalledWith(11));
        mockCommentAPI.findAllForParentId.mockRejectedValueOnce(new Error("offline"));
        rerender(<CommentCanvas commentId={12} allowComment={false}/>);
        await waitFor(() => expect(mockCommentAPI.findAllForParentId).toHaveBeenCalledWith(12));
    });

    it("covers empty, root, nested, and expandable thread branches", () => {
        const refresh = jest.fn();
        const {rerender} = render(<DisplayCommentThread comment={null as never} refreshCommentList={refresh}/>);
        expect(screen.getByText("No comments available.")).toBeInTheDocument();
        const rootEmpty = comment({parentCommentId: 1, childComments: []});
        rerender(<DisplayCommentThread comment={rootEmpty} refreshCommentList={refresh}/>);
        fireEvent.click(screen.getByRole("button", {name: "Be first to comment"}));
        expect(screen.getByPlaceholderText("CommentEditor.form.textarea.placeholder")).toBeInTheDocument();
        const nested = comment({parentCommentId: 9, childComments: [comment({id: 12, childComments: [comment({id: 13})]})]});
        rerender(<DisplayCommentThread comment={nested} refreshCommentList={refresh}/>);
        fireEvent.click(screen.getByRole("button", {name: /Show Replies/}));
        expect(screen.getByText("User (#13)")).toBeInTheDocument();
        rerender(<DisplayCommentThread key="root" comment={comment({parentCommentId: 1, childComments: [comment({id: 14})]})} refreshCommentList={refresh}/>);
        fireEvent.click(screen.getByRole("button", {name: "Add a new comment"}));
        expect(screen.getAllByPlaceholderText("CommentEditor.form.textarea.placeholder").length).toBeGreaterThan(0);
    });
});

describe("comment cards and moderation", () => {
    it("supports reply, report success/failure, cancel report, and display-only permissions", async () => {
        const refresh = jest.fn();
        const {rerender} = render(<CommentCard comment={comment({childCount: 1})} refreshCommentList={refresh}/>);
        fireEvent.click(screen.getByRole("button", {name: "common.button.respond"}));
        expect(screen.getByPlaceholderText("CommentEditor.form.textarea.placeholder")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", {name: "common.button.cancel"}));
        fireEvent.click(screen.getByRole("button", {name: "CommentCard.button.report-comment"}));
        fireEvent.change(screen.getByPlaceholderText("CommentCard.modal.placeholder"), {target: {value: "spam"}});
        fireEvent.click(screen.getByRole("button", {name: "common.button.send"}));
        await waitFor(() => expect(mockCommentAPI.report).toHaveBeenCalledWith({commentId: 7, reportReason: "spam"}));
        mockCommentAPI.report.mockResolvedValueOnce({status: UpdateStatusEnum.FAIL});
        fireEvent.click(screen.getByRole("button", {name: "CommentCard.button.report-comment"}));
        fireEvent.change(screen.getByPlaceholderText("CommentCard.modal.placeholder"), {target: {value: "again"}});
        fireEvent.click(screen.getByRole("button", {name: "common.button.send"}));
        await waitFor(() => expect(mockCommentAPI.report).toHaveBeenCalledTimes(2));
        rerender(<CommentCard comment={comment({userHasReported: true})} refreshCommentList={refresh}/>);
        fireEvent.click(screen.getByRole("button", {name: "CommentCard.button.cancel-report"}));
        await waitFor(() => expect(mockCommentAPI.cancelReport).toHaveBeenCalledWith(7));
        rerender(<CommentCard comment={comment()} displayOnly refreshCommentList={refresh}/>);
        expect(screen.queryByRole("button", {name: "CommentCard.button.report-comment"})).not.toBeInTheDocument();
    });

    it("handles moderation confirmation, success, and API failures", async () => {
        window.confirm = jest.fn(() => false);
        const refresh = jest.fn();
        render(<CommentModerationActions commentId={3} childCount={2} refreshModerationList={refresh}/>);
        fireEvent.click(screen.getByRole("button", {name: "CommentModerationActions.button.reject-comment"}));
        expect(mockCommentAPI.rejectComment).not.toHaveBeenCalled();
        (window.confirm as jest.Mock).mockReturnValue(true);
        fireEvent.click(screen.getByRole("button", {name: "CommentModerationActions.button.reject-comment"}));
        await waitFor(() => expect(mockCommentAPI.rejectComment).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
        render(<ReportCard report={{id: 1, reporter: "R", reporterId: 2, reason: "spam", createdAt: "2024-01-01", status: "OPEN"} as never}
                           refreshModerationList={refresh}/>);
        fireEvent.click(screen.getByRole("button", {name: "ReportCard.button.accept"}));
        fireEvent.click(screen.getByRole("button", {name: "ReportCard.button.dismiss"}));
        await waitFor(() => expect(refresh).toHaveBeenCalled());
        mockCommentAPI.acceptReport.mockRejectedValueOnce(new Error("x"));
        mockCommentAPI.dismissReport.mockRejectedValueOnce(new Error("x"));
        fireEvent.click(screen.getByRole("button", {name: "ReportCard.button.accept"}));
        fireEvent.click(screen.getByRole("button", {name: "ReportCard.button.dismiss"}));
        await waitFor(() => expect(mockCommentAPI.dismissReport).toHaveBeenCalledTimes(2));
    });
});

describe("forum and comment administration", () => {
    it("loads forum data and handles failure", async () => {
        mockCommentAPI.findAllForParentIdWithDepth.mockResolvedValueOnce({childComments: [comment({parentCommentId: 3})]});
        const {unmount} = render(<Forum/>);
        await waitFor(() => expect(screen.getByText("Title")).toBeInTheDocument());
        unmount();
        mockCommentAPI.findAllForParentIdWithDepth.mockRejectedValueOnce(new Error("offline"));
        render(<Forum/>);
        await waitFor(() => expect(mockCommentAPI.findAllForParentIdWithDepth).toHaveBeenCalledTimes(2));
    });

    it("loads users, applies filters, searches, and handles API failures", async () => {
        mockUserAPI.findAll.mockResolvedValueOnce([{id: 1, firstName: "A", lastName: "B", username: ""}]);
        mockCommentAPI.findFilteredComments.mockResolvedValueOnce([comment()]);
        const {unmount} = render(<CommentList/>);
        await waitFor(() => expect(screen.getAllByText("CommentList.title").length).toBeGreaterThan(0));
        fireEvent.change(screen.getByPlaceholderText("CommentList.filters.titleSearch"), {target: {value: "x"}});
        fireEvent.change(screen.getByPlaceholderText("CommentList.filters.bodySearch"), {target: {value: "y"}});
        fireEvent.click(screen.getByRole("button", {name: "common.button.search"}));
        await waitFor(() => expect(mockCommentAPI.findFilteredComments).toHaveBeenCalled());
        expect(mockCommentAPI.findFilteredComments).toHaveBeenCalled();
    });
});

describe("notification list and dropdown", () => {
    it("loads notifications, marks unread items, and paginates", async () => {
        const data = Array.from({length: 101}, (_, i) => notification(i + 1, i === 0));
        mockNotificationAPI.getAllNotifications.mockResolvedValueOnce(data);
        render(<MemoryRouter><NotificationList/></MemoryRouter>);
        await waitFor(() => expect(screen.getByText("Notice 2")).toBeInTheDocument());
        fireEvent.click(screen.getByText("Notice 2"));
        await waitFor(() => expect(mockNotificationAPI.markNotificationsAsRead).toHaveBeenCalledWith({messageIds: [2]}));
        mockNotificationAPI.getAllNotifications.mockRejectedValueOnce(new Error("offline"));
        render(<MemoryRouter><NotificationList/></MemoryRouter>);
        await waitFor(() => expect(mockNotificationAPI.getAllNotifications).toHaveBeenCalledTimes(2));
    });

    it("fetches unread notifications, opens details, navigates, and handles read failures", async () => {
        mockNotificationAPI.getUnreadNotifications.mockResolvedValueOnce([notification(1), notification(2)]);
        render(<MemoryRouter><NotificationDropdown pollInterval={100000}/></MemoryRouter>);
        await waitFor(() => expect(mockNotificationAPI.getUnreadNotifications).toHaveBeenCalled());
        fireEvent.click(screen.getByRole("img"));
        await waitFor(() => expect(screen.getByText("NotificationDropdown.title")).toBeInTheDocument());
        fireEvent.click(screen.getByText("Notice 1"));
        await waitFor(() => expect(mockNotificationAPI.markNotificationsAsRead).toHaveBeenCalledWith({messageIds: [1]}));
        mockNotificationAPI.markNotificationsAsRead.mockRejectedValueOnce(new Error("offline"));
        fireEvent.click(screen.getAllByText("Notice 2")[0]);
        await waitFor(() => expect(mockNotificationAPI.markNotificationsAsRead).toHaveBeenCalledTimes(2));
    });
});
