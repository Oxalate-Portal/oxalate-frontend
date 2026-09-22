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
    message: {useMessage: () => [{success: jest.fn(), error: jest.fn()}, <span key="message-holder"/>]},
    Button: ({children, onClick}: { children: ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
    Grid: {useBreakpoint: () => ({})},
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
        getPortalTimezone: () => "UTC",
        getPortalConfigurationValue: () => "false"
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
        event_dive_count: 1,
        created_at: dayjs(),
        payments: [{
            id,
            user_id: id,
            payment_type: PaymentTypeEnum.PERIODICAL,
            payment_count: 1,
            start_date: dayjs().subtract(1, "month"),
            end_date: dayjs().add(1, "month"),
            created: dayjs().subtract(1, "month"),
            bound_events: []
        }],
        membership_active: true,
        user_type: UserTypeEnum.SCUBA_DIVER,
        tags: []
    };
}

function createOrganizer(): UserResponse {
    return {
        id: 500,
        username: "organizer@example.com",
        first_name: "Org",
        last_name: "User",
        avatar_url: null,
        phone_number: "123456",
        registered: new Date(),
        language: "en",
        status: UserStatusEnum.ACTIVE,
        privacy: true,
        next_of_kin: "",
        approved_terms: true,
        health_statement_id: 1,
        primary_user_type: UserTypeEnum.SCUBA_DIVER,
        dive_count: 0,
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
        start_time: dayjs().add(2, "day"),
        event_duration: 2,
        max_duration: 120,
        max_depth: 20,
        max_participants: 4,
        status: DiveEventStatusEnum.PUBLISHED,
        organizer: createOrganizer(),
        participants: [createListUser(10, "Participant One")],
        waiting_list: waitingList,
        event_comment_id: 5
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
        event.start_time = dayjs().subtract(2, "day");

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
