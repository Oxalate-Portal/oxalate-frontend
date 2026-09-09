import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import type {ReactNode} from "react";
import {DiveEvent} from "../components";
import type {DiveGroupResponse} from "../models";

const mockFindById = jest.fn();
const mockGetDiveGroupsByEventId = jest.fn();
const mockJoinDiveGroup = jest.fn();
const mockLeaveDiveGroup = jest.fn();
const mockDeleteDiveGroup = jest.fn();
const mockGetPortalConfigurationValue = jest.fn();
const mockCheckRoles = jest.fn();

const session = {
    userSession: {id: 1, primaryUserType: "SCUBA_DIVER", healthStatementId: 1, roles: ["ROLE_USER"]} as Record<string, unknown> | null
};

let params: { paramId?: string } = {paramId: "42"};

const baseEvent = {
    id: 42,
    title: "Dive event",
    startTime: "2099-01-01T10:00:00.000Z",
    eventDuration: 2,
    maxParticipants: 10,
    status: "PUBLISHED",
    organizer: {id: 99},
    participants: [{id: 1, name: "Me"}, {id: 20, name: "Diver Twenty"}],
    waitingList: [],
    eventCommentId: 1
};

function group(overrides: Partial<DiveGroupResponse> = {}): DiveGroupResponse {
    return {
        id: 7,
        eventId: 42,
        name: "Team Sidemount",
        ownerId: 20,
        ownerName: "Diver Twenty",
        createdAt: "2026-05-30T12:00:00Z",
        updatedAt: null,
        members: [{userId: 20, name: "Diver Twenty", userType: "SCUBA_DIVER", owner: true, joinedAt: null}],
        ...overrides
    } as unknown as DiveGroupResponse;
}

jest.mock("react-router-dom", () => ({
    useParams: () => params
}));

jest.mock("../session", () => ({
    useSession: () => ({
        userSession: session.userSession,
        getPortalTimezone: () => "Europe/Helsinki",
        getPortalConfigurationValue: (...args: unknown[]) => mockGetPortalConfigurationValue(...args)
    })
}));

jest.mock("../tools", () => ({
    checkRoles: (...args: unknown[]) => mockCheckRoles(...args)
}));

jest.mock("../services", () => ({
    diveEventAPI: {
        findById: (...args: unknown[]) => mockFindById(...args),
        joinWaitingList: jest.fn(),
        leaveWaitingList: jest.fn(),
        subscribeUserToEvent: jest.fn(),
        unsubscribeUserToEvent: jest.fn()
    },
    membershipAPI: {findByUserId: jest.fn().mockResolvedValue([])},
    paymentAPI: {findByUserId: jest.fn().mockResolvedValue({payments: []})},
    diveGroupAPI: {
        getDiveGroupsByEventId: (...args: unknown[]) => mockGetDiveGroupsByEventId(...args),
        joinDiveGroup: (...args: unknown[]) => mockJoinDiveGroup(...args),
        leaveDiveGroup: (...args: unknown[]) => mockLeaveDiveGroup(...args),
        deleteDiveGroup: (...args: unknown[]) => mockDeleteDiveGroup(...args)
    }
}));

jest.mock("../components/Commenting", () => ({CommentCanvas: () => <div>comments</div>}));
jest.mock("../components/DiveEvent/DiveEventDetails", () => ({DiveEventDetails: () => <div>details</div>}));
jest.mock("../components/main", () => ({HealthStatementConfirmationModal: () => null}));

jest.mock("../components/DiveEvent/DiveGroupTable", () => ({
    findDiveGroupOwnedByUser: (diveGroups: DiveGroupResponse[], userId: number) =>
            diveGroups.find((diveGroup) => diveGroup.ownerId === userId) ?? null,
    DiveGroupTable: ({diveGroups, loading, currentUserId, onJoin, onLeave, onDelete}: {
        diveGroups: DiveGroupResponse[];
        loading: boolean;
        currentUserId: number;
        onJoin: (id: number) => void;
        onLeave: (id: number) => void;
        onDelete: (id: number) => void;
    }) => (
            <div data-testid="dive-group-table">
                <span>groups:{diveGroups.length}</span>
                <span>loading:{String(loading)}</span>
                <span>user:{currentUserId}</span>
                <button onClick={() => onJoin(7)}>table-join</button>
                <button onClick={() => onLeave(7)}>table-leave</button>
                <button onClick={() => onDelete(7)}>table-delete</button>
            </div>
    )
}));

jest.mock("../components/DiveEvent/DiveGroupFormModal", () => ({
    DiveGroupFormModal: ({open, eventId, canAssignOwner, participants, onCancel, onCreated}: {
        open: boolean;
        eventId: number;
        canAssignOwner: boolean;
        participants: Array<{ id: number }>;
        onCancel: () => void;
        onCreated: () => void;
    }) => open ? (
            <div data-testid="dive-group-modal">
                <span>event:{eventId}</span>
                <span>assignOwner:{String(canAssignOwner)}</span>
                <span>participants:{participants.length}</span>
                <button onClick={onCancel}>modal-cancel</button>
                <button onClick={onCreated}>modal-created</button>
            </div>
    ) : null
}));

jest.mock("antd", () => {
    const passthrough = ({children}: { children?: ReactNode }) => <div>{children}</div>;

    return {
        Alert: ({title}: { title: string }) => <div>{title}</div>,
        Button: ({children, onClick}: { children: ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
        Divider: passthrough,
        Modal: ({open, children}: { open: boolean; children: ReactNode }) => open ? <div>{children}</div> : null,
        Select: passthrough,
        Space: passthrough,
        Spin: passthrough
    };
});

async function renderDiveEvent() {
    await act(async () => {
        render(<DiveEvent/>);
    });
}

describe("DiveEvent dive groups", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        params = {paramId: "42"};
        session.userSession = {id: 1, primaryUserType: "SCUBA_DIVER", healthStatementId: 1, roles: ["ROLE_USER"]};
        mockFindById.mockResolvedValue(baseEvent);
        mockGetPortalConfigurationValue.mockReturnValue("false");
        mockCheckRoles.mockReturnValue(false);
        mockGetDiveGroupsByEventId.mockResolvedValue([]);
        mockJoinDiveGroup.mockResolvedValue(group());
        mockLeaveDiveGroup.mockResolvedValue({status: "OK", message: ""});
        mockDeleteDiveGroup.mockResolvedValue({status: "OK", message: ""});
    });

    it("loads the dive groups of the event for an authenticated user", async () => {
        await renderDiveEvent();

        await waitFor(() => expect(mockGetDiveGroupsByEventId).toHaveBeenCalledWith(42));
    });

    it("shows the create button and hides the table when there are no dive groups", async () => {
        await renderDiveEvent();

        await waitFor(() => expect(screen.getByText("DiveEvent.diveGroup.createButton")).toBeInTheDocument());
        expect(screen.queryByTestId("dive-group-table")).toBeNull();
    });

    it("hides the create button when the user has not joined the event", async () => {
        mockFindById.mockResolvedValue({...baseEvent, participants: [{id: 20, name: "Diver Twenty"}]});

        await renderDiveEvent();

        await waitFor(() => expect(mockFindById).toHaveBeenCalledWith(42, null));
        expect(screen.queryByText("DiveEvent.diveGroup.createButton")).toBeNull();
    });

    it("shows the dive group table when groups exist", async () => {
        mockGetDiveGroupsByEventId.mockResolvedValue([group()]);

        await renderDiveEvent();

        await waitFor(() => expect(screen.getByTestId("dive-group-table")).toBeInTheDocument());
        expect(screen.getByText("groups:1")).toBeInTheDocument();
        expect(screen.getByText("loading:false")).toBeInTheDocument();
        expect(screen.getByText("user:1")).toBeInTheDocument();
        expect(screen.getByText("DiveEvent.diveGroup.createButton")).toBeInTheDocument();
    });

    it("hides the create button when the user already owns a dive group in the event", async () => {
        mockGetDiveGroupsByEventId.mockResolvedValue([group({ownerId: 1, ownerName: "Me"})]);

        await renderDiveEvent();

        await waitFor(() => expect(screen.getByTestId("dive-group-table")).toBeInTheDocument());
        expect(screen.queryByText("DiveEvent.diveGroup.createButton")).toBeNull();
    });

    it("does not load dive groups nor show the create button for an anonymous visitor", async () => {
        session.userSession = null;

        await renderDiveEvent();

        await waitFor(() => expect(mockFindById).toHaveBeenCalled());
        expect(mockGetDiveGroupsByEventId).not.toHaveBeenCalled();
        expect(screen.queryByText("DiveEvent.diveGroup.createButton")).toBeNull();
    });

    it("does not load dive groups when the event id is invalid", async () => {
        params = {paramId: "not-a-number"};
        jest.spyOn(console, "error").mockImplementation(() => undefined);

        await renderDiveEvent();

        expect(mockGetDiveGroupsByEventId).not.toHaveBeenCalled();
    });

    it("opens the create modal with the event participants and closes it on cancel", async () => {
        await renderDiveEvent();

        await waitFor(() => expect(screen.getByText("DiveEvent.diveGroup.createButton")).toBeInTheDocument());
        fireEvent.click(screen.getByText("DiveEvent.diveGroup.createButton"));

        await waitFor(() => expect(screen.getByTestId("dive-group-modal")).toBeInTheDocument());
        expect(screen.getByText("event:42")).toBeInTheDocument();
        expect(screen.getByText("participants:2")).toBeInTheDocument();
        expect(screen.getByText("assignOwner:false")).toBeInTheDocument();

        fireEvent.click(screen.getByText("modal-cancel"));

        await waitFor(() => expect(screen.queryByTestId("dive-group-modal")).toBeNull());
    });

    it("allows organizers and administrators to assign the dive group owner", async () => {
        mockCheckRoles.mockReturnValue(true);

        await renderDiveEvent();

        await waitFor(() => expect(screen.getByText("DiveEvent.diveGroup.createButton")).toBeInTheDocument());
        fireEvent.click(screen.getByText("DiveEvent.diveGroup.createButton"));

        await waitFor(() => expect(screen.getByText("assignOwner:true")).toBeInTheDocument());
    });

    it("closes the modal and reloads the dive groups after a group was created", async () => {
        await renderDiveEvent();

        await waitFor(() => expect(screen.getByText("DiveEvent.diveGroup.createButton")).toBeInTheDocument());
        fireEvent.click(screen.getByText("DiveEvent.diveGroup.createButton"));

        await waitFor(() => expect(screen.getByTestId("dive-group-modal")).toBeInTheDocument());

        mockGetDiveGroupsByEventId.mockResolvedValue([group({ownerId: 1})]);
        await act(async () => {
            fireEvent.click(screen.getByText("modal-created"));
        });

        await waitFor(() => expect(screen.queryByTestId("dive-group-modal")).toBeNull());
        expect(mockGetDiveGroupsByEventId).toHaveBeenCalledTimes(2);
    });

    it("joins a dive group and reloads the list", async () => {
        mockGetDiveGroupsByEventId.mockResolvedValue([group()]);

        await renderDiveEvent();

        await waitFor(() => expect(screen.getByTestId("dive-group-table")).toBeInTheDocument());
        await act(async () => {
            fireEvent.click(screen.getByText("table-join"));
        });

        expect(mockJoinDiveGroup).toHaveBeenCalledWith(7);
        expect(mockGetDiveGroupsByEventId).toHaveBeenCalledTimes(2);
    });

    it("leaves a dive group and reloads the list", async () => {
        mockGetDiveGroupsByEventId.mockResolvedValue([group()]);

        await renderDiveEvent();

        await waitFor(() => expect(screen.getByTestId("dive-group-table")).toBeInTheDocument());
        await act(async () => {
            fireEvent.click(screen.getByText("table-leave"));
        });

        expect(mockLeaveDiveGroup).toHaveBeenCalledWith(7);
        expect(mockGetDiveGroupsByEventId).toHaveBeenCalledTimes(2);
    });

    it("deletes a dive group and reloads the list", async () => {
        mockGetDiveGroupsByEventId.mockResolvedValue([group({ownerId: 1})]);

        await renderDiveEvent();

        await waitFor(() => expect(screen.getByTestId("dive-group-table")).toBeInTheDocument());
        await act(async () => {
            fireEvent.click(screen.getByText("table-delete"));
        });

        expect(mockDeleteDiveGroup).toHaveBeenCalledWith(7);
        expect(mockGetDiveGroupsByEventId).toHaveBeenCalledTimes(2);
    });

    it("still reloads the list when joining, leaving or deleting fails", async () => {
        jest.spyOn(console, "error").mockImplementation(() => undefined);
        mockGetDiveGroupsByEventId.mockResolvedValue([group()]);
        mockJoinDiveGroup.mockRejectedValue(new Error("join failed"));
        mockLeaveDiveGroup.mockRejectedValue(new Error("leave failed"));
        mockDeleteDiveGroup.mockRejectedValue(new Error("delete failed"));

        await renderDiveEvent();

        await waitFor(() => expect(screen.getByTestId("dive-group-table")).toBeInTheDocument());

        await act(async () => {
            fireEvent.click(screen.getByText("table-join"));
        });
        await act(async () => {
            fireEvent.click(screen.getByText("table-leave"));
        });
        await act(async () => {
            fireEvent.click(screen.getByText("table-delete"));
        });

        expect(mockGetDiveGroupsByEventId).toHaveBeenCalledTimes(4);
        expect(screen.getByTestId("dive-group-table")).toBeInTheDocument();
    });

    it("falls back to an empty list when loading the dive groups fails", async () => {
        jest.spyOn(console, "error").mockImplementation(() => undefined);
        mockGetDiveGroupsByEventId.mockRejectedValue(new Error("boom"));

        await renderDiveEvent();

        await waitFor(() => expect(mockGetDiveGroupsByEventId).toHaveBeenCalled());
        expect(screen.queryByTestId("dive-group-table")).toBeNull();
        expect(screen.getByText("DiveEvent.diveGroup.createButton")).toBeInTheDocument();
    });

    it("falls back to an empty list when the backend does not return an array", async () => {
        mockGetDiveGroupsByEventId.mockResolvedValue(undefined);

        await renderDiveEvent();

        await waitFor(() => expect(mockGetDiveGroupsByEventId).toHaveBeenCalled());
        expect(screen.queryByTestId("dive-group-table")).toBeNull();
    });
});
