import {render, screen} from "@testing-library/react";
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

jest.mock("../tools", () => ({
    checkRoles: (haystack: string[] | null, needles: string[]) => !!haystack?.some(role => needles.includes(role)),
    diveTypeEnum2Tag: (type: string) => <span>{type}</span>,
    paymentTypeEnum2Tag: (type: string) => <span>{type}</span>,
    userTypeEnum2Tag: (type: string) => <span>{type}</span>
}));

jest.mock("../session", () => ({
    useSession: () => ({
        userSession: {
            id: 1,
            roles: ["ROLE_USER"]
        },
        getPortalTimezone: () => "UTC"
    })
}));

jest.mock("../components/DiveEvent/DiveEventFiles", () => ({
    DiveEventFiles: () => null
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
