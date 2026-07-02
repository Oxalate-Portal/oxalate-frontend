import {fireEvent, render, screen} from "@testing-library/react";
import dayjs from "dayjs";
import type {ReactNode} from "react";
import {
    type DiveEventResponse,
    DiveEventStatusEnum,
    DiveTypeEnum,
    type ListUserResponse,
    PaymentTypeEnum,
    type UserResponse,
    UserStatusEnum,
    UserTypeEnum
} from "../models";
import {DiveEventDetails} from "../components";

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key
    })
}));

jest.mock("react-router-dom", () => ({
    Link: ({children, to}: { children: ReactNode; to: string }) => <a href={to}>{children}</a>
}));

jest.mock("antd", () => ({
    Button: ({children, onClick}: { children: ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
    Modal: ({open, children, title, onCancel}: {
        open: boolean;
        children: ReactNode;
        title: ReactNode;
        onCancel: () => void;
    }) => open ? (
            <div>
                <h2>{title}</h2>
                <button onClick={onCancel}>modal-cancel</button>
                {children}
            </div>
    ) : null,
    Space: ({children}: { children: ReactNode }) => <div>{children}</div>,
    Spin: ({children}: { children: ReactNode }) => <div>{children}</div>,
    Tooltip: ({children}: { children: ReactNode }) => <>{children}</>,
    Table: ({dataSource}: { dataSource: Array<Record<string, unknown>> }) => (
            <div>
                {dataSource.map((record, index) => (
                        <div key={String(record.id ?? index)}>
                            {Object.values(record).map((value, valueIndex) => {
                                if (value === null || value === undefined || typeof value === "object") {
                                    return null;
                                }

                                return <span key={String(record.id ?? index) + "-" + valueIndex}>{String(value)}</span>;
                            })}
                        </div>
                ))}
            </div>
    )
}));

const mockAdminNotifications = jest.fn(({participantIds}: { participantIds: number[] }) => (
        <div>admin-notifications-{participantIds.join(",")}</div>
));

jest.mock("../tools", () => ({
    checkRoles: (haystack: string[] | null, needles: string[]) => !!haystack?.some(role => needles.includes(role)),
    diveTypeEnum2Tag: (type: string) => <span>{type}</span>,
    paymentTypeEnum2Tag: (type: string) => <span>{type}</span>,
    userTypeEnum2Tag: (type: string) => <span>{type}</span>
}));

const mockUserSession = {
    id: 1,
    roles: ["ROLE_USER"]
};

jest.mock("../session", () => ({
    useSession: () => ({
        userSession: mockUserSession,
        getPortalTimezone: () => "UTC"
    })
}));

jest.mock("../components/DiveEvent/DiveEventFiles", () => ({
    DiveEventFiles: () => null
}));

jest.mock("../components/Notification", () => ({
    AdminNotifications: (props: { participantIds: number[] }) => mockAdminNotifications(props)
}));

function createListUser(id: number, name: string): ListUserResponse {
    return {
        id,
        name,
        eventDiveCount: 1,
        createdAt: dayjs(),
        payments: [{
            id,
            userId: id,
            paymentType: PaymentTypeEnum.PERIODICAL,
            paymentCount: 1,
            startDate: dayjs().subtract(1, "month"),
            endDate: dayjs().add(1, "month"),
            created: dayjs().subtract(1, "month"),
            boundEvents: []
        }],
        membershipActive: true,
        userType: UserTypeEnum.SCUBA_DIVER,
        tags: []
    };
}

function createOrganizer(): UserResponse {
    return {
        id: 500,
        username: "organizer@example.com",
        firstName: "Org",
        lastName: "User",
        avatarUrl: null,
        phoneNumber: "123456",
        registered: new Date(),
        language: "en",
        status: UserStatusEnum.ACTIVE,
        privacy: true,
        nextOfKin: "",
        approvedTerms: true,
        healthStatementId: 1,
        primaryUserType: UserTypeEnum.SCUBA_DIVER,
        diveCount: 0,
        payments: [],
        memberships: [],
        tags: []
    };
}

function createEvent(waitingList: ListUserResponse[]): DiveEventResponse {
    return {
        id: 240,
        title: "Queue test event",
        description: "Description",
        type: DiveTypeEnum.SURFACE,
        startTime: dayjs().add(2, "day"),
        eventDuration: 2,
        maxDuration: 120,
        maxDepth: 20,
        maxParticipants: 4,
        status: DiveEventStatusEnum.PUBLISHED,
        organizer: createOrganizer(),
        participants: [createListUser(10, "Participant One")],
        waitingList,
        eventCommentId: 5
    };
}

describe("DiveEventDetails waiting list", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUserSession.roles = ["ROLE_USER"];
    });

    it("renders a separate waiting-list table when queued divers exist", () => {
        render(<DiveEventDetails eventInfo={createEvent([createListUser(100, "Queued Diver")])}/>);

        expect(screen.getByText("EventDetails.waitingList.title: (1):")).toBeInTheDocument();
        expect(screen.getByText("Queued Diver")).toBeInTheDocument();
        expect(screen.getByText("Participant One")).toBeInTheDocument();
    });

    it("does not render the waiting-list table when no queued divers exist", () => {
        render(<DiveEventDetails eventInfo={createEvent([])}/>);

        expect(screen.queryByText(/EventDetails\.waitingList\.title/)).toBeNull();
    });
});

describe("DiveEventDetails participant notifications", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUserSession.roles = ["ROLE_USER"];
    });

    it("shows notify button only to organizer/admin on future events", () => {
        mockUserSession.roles = ["ROLE_ORGANIZER"];
        render(<DiveEventDetails eventInfo={createEvent([createListUser(100, "Queued Diver")])}/>);
        expect(screen.getByText("EventDetails.notificationModal.button")).toBeInTheDocument();
    });

    it("does not show notify button for non-organizer roles", () => {
        render(<DiveEventDetails eventInfo={createEvent([createListUser(100, "Queued Diver")])}/>);
        expect(screen.queryByText("EventDetails.notificationModal.button")).toBeNull();
    });

    it("does not show notify button for past events", () => {
        mockUserSession.roles = ["ROLE_ADMIN"];
        const event = createEvent([createListUser(100, "Queued Diver")]);
        event.startTime = dayjs().subtract(2, "day");

        render(<DiveEventDetails eventInfo={event}/>);
        expect(screen.queryByText("EventDetails.notificationModal.button")).toBeNull();
    });

    it("opens and closes participant notification modal", () => {
        mockUserSession.roles = ["ROLE_ADMIN"];
        render(<DiveEventDetails eventInfo={createEvent([createListUser(100, "Queued Diver")])}/>);

        fireEvent.click(screen.getByText("EventDetails.notificationModal.button"));
        expect(screen.getByText("EventDetails.notificationModal.title")).toBeInTheDocument();
        expect(screen.getByText("admin-notifications-10")).toBeInTheDocument();

        fireEvent.click(screen.getByText("modal-cancel"));
        expect(screen.queryByText("EventDetails.notificationModal.title")).toBeNull();
    });
});
