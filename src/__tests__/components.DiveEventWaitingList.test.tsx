import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import type {ReactNode} from "react";
import {DiveEvent} from "../components/DiveEvent/DiveEvent";

const mockFindById = jest.fn();
const mockJoinWaitingList = jest.fn();
const mockLeaveWaitingList = jest.fn();
const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();

const baseEvent = {
    id: 123,
    type: "cave",
    title: "Full event",
    description: "desc",
    startTime: "2099-01-01T10:00:00.000Z",
    eventDuration: 2,
    maxDuration: 120,
    maxDepth: 20,
    maxParticipants: 1,
    status: "PUBLISHED",
    organizer: {id: 99, firstName: "Org", lastName: "User"},
    participants: [{id: 2, name: "Other", eventDiveCount: 0, createdAt: "", payments: [], membershipActive: true, userType: "SCUBA_DIVER"}],
    waitingList: [],
    eventCommentId: 1
};

jest.mock("react-router-dom", () => ({
    useParams: () => ({paramId: "123"})
}));

jest.mock("../session", () => ({
    useSession: () => ({
        userSession: {
            id: 1,
            primaryUserType: "SCUBA_DIVER",
            healthStatementId: 1,
            roles: ["ROLE_USER"]
        },
        getPortalConfigurationValue: (_group: string, key: string) => {
            if (key === "commenting-enabled") {
                return "false";
            }
            if (key === "commenting-enabled-features") {
                return "";
            }
            return "false";
        }
    })
}));

jest.mock("../services", () => ({
    diveEventAPI: {
        findById: (...args: unknown[]) => mockFindById(...args),
        joinWaitingList: (...args: unknown[]) => mockJoinWaitingList(...args),
        leaveWaitingList: (...args: unknown[]) => mockLeaveWaitingList(...args),
        subscribeUserToEvent: (...args: unknown[]) => mockSubscribe(...args),
        unsubscribeUserToEvent: (...args: unknown[]) => mockUnsubscribe(...args)
    },
    membershipAPI: {
        findByUserId: jest.fn().mockResolvedValue([])
    },
    paymentAPI: {
        findByUserId: jest.fn().mockResolvedValue({payments: []})
    }
}));

jest.mock("../components/DiveEvent/DiveEventDetails", () => ({
    DiveEventDetails: () => <div>details</div>
}));

jest.mock("../components/Commenting", () => ({
    CommentCanvas: () => <div>comment-canvas</div>
}));

jest.mock("../components/main", () => ({
    HealthStatementConfirmationModal: () => null
}));

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key
    })
}));

jest.mock("antd", () => {
    const SelectMock = ({children}: { children: ReactNode }) => <div>{children}</div>;
    SelectMock.Option = ({children}: { children: ReactNode }) => <div>{children}</div>;

    return {
        Alert: ({title}: { title: string }) => <div>{title}</div>,
        Button: ({children, onClick}: { children: ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
        Divider: ({children}: { children: ReactNode }) => <div>{children}</div>,
        Modal: ({open, children}: { open: boolean; children: ReactNode }) => open ? <div>{children}</div> : null,
        Select: SelectMock,
        Space: ({children}: { children: ReactNode }) => <div>{children}</div>,
        Spin: ({children}: { children: ReactNode }) => <div>{children}</div>
    };
});

describe("DiveEvent waiting list button", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockJoinWaitingList.mockResolvedValue({...baseEvent, waitingList: [{id: 1}]});
        mockLeaveWaitingList.mockResolvedValue({...baseEvent, waitingList: []});
    });

    it("joinWaitingListValidOk", async () => {
        mockFindById.mockResolvedValue({...baseEvent, waitingList: []});

        await act(async () => {
            render(<DiveEvent/>);
        });

        await waitFor(() => expect(screen.getByText("DiveEvent.waitingList.joinButton")).toBeInTheDocument());
        fireEvent.click(screen.getByText("DiveEvent.waitingList.joinButton"));

        await waitFor(() => expect(mockJoinWaitingList).toHaveBeenCalledWith(123));
    });

    it("leaveWaitingListValidOk", async () => {
        mockFindById.mockResolvedValue({...baseEvent, waitingList: [{id: 1, name: "Me"}]});

        await act(async () => {
            render(<DiveEvent/>);
        });

        await waitFor(() => expect(screen.getByText("DiveEvent.waitingList.leaveButton")).toBeInTheDocument());
        fireEvent.click(screen.getByText("DiveEvent.waitingList.leaveButton"));

        await waitFor(() => expect(mockLeaveWaitingList).toHaveBeenCalledWith(123));
    });
});

