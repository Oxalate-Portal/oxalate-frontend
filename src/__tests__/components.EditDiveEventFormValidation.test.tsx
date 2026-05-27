import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import dayjs from "dayjs";
import type {ReactNode, TextareaHTMLAttributes} from "react";
import {
    type DiveEventResponse,
    DiveEventStatusEnum,
    DiveTypeEnum,
    type ListUserResponse,
    PaymentTypeEnum,
    RoleEnum,
    type UserResponse,
    UserStatusEnum,
    UserTypeEnum
} from "../models";
import {EditDiveEvent} from "../components/DiveEvent/EditDiveEvent";
import * as test from "node:test";
import * as test from "node:test";

type MessageListener = (event: { data: unknown }) => void;

class MockMessagePort {
    onmessage: MessageListener | null = null;
    private peer: MockMessagePort | null = null;

    setPeer(peer: MockMessagePort) {
        this.peer = peer;
    }

    postMessage(data: unknown) {
        if (!this.peer) {
            return;
        }

        queueMicrotask(() => {
            this.peer?.onmessage?.({data});
        });
    }

    addEventListener(type: string, listener: MessageListener) {
        if (type === "message") {
            this.onmessage = listener;
        }
    }

    removeEventListener(type: string, listener: MessageListener) {
        if (type === "message" && this.onmessage === listener) {
            this.onmessage = null;
        }
    }

    start() {
        return undefined;
    }

    close() {
        this.onmessage = null;
        this.peer = null;
    }
}

class MockMessageChannel {
    port1: MockMessagePort;
    port2: MockMessagePort;

    constructor() {
        this.port1 = new MockMessagePort();
        this.port2 = new MockMessagePort();
        this.port1.setPeer(this.port2);
        this.port2.setPeer(this.port1);
    }
}

Object.defineProperty(globalThis, "MessageChannel", {
    writable: true,
    value: MockMessageChannel
});

jest.mock("antd", () => {
    const actual = jest.requireActual("antd");
    return {
        ...actual,
        message: {
            ...actual.message,
            useMessage: () => [{success: jest.fn(), error: jest.fn()}, null as ReactNode]
        }
    };
});

const mockNavigate = jest.fn();
const findByIdMock = jest.fn();
const findByRoleMock = jest.fn();
const findAllBlockedDatesMock = jest.fn();
const updateDiveEventMock = jest.fn();
const tMock = (key: string) => key;

const getPortalTimezoneMock = () => "UTC";
const getFrontendConfigurationValueMock = (key: string) => {
    switch (key) {
        case "max-depth":
            return "40";
        case "max-dive-length":
            return "120";
        case "min-event-length":
            return "1";
        case "max-event-length":
            return "6";
        case "min-participants":
            return "1";
        case "max-participants":
            return "8";
        case "types-of-event":
            return "surface,boat";
        default:
            return "";
    }
};
const getPortalConfigurationValueMock = () => "false";

jest.mock("../services", () => ({
    blockedDatesAPI: {
        findAll: (...args: unknown[]) => findAllBlockedDatesMock(...args)
    },
    diveEventAPI: {
        findById: (...args: unknown[]) => findByIdMock(...args),
        update: (...args: unknown[]) => updateDiveEventMock(...args)
    },
    userAPI: {
        findByRole: (...args: unknown[]) => findByRoleMock(...args)
    }
}));

jest.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
    useParams: () => ({paramId: "42"})
}));

jest.mock("antd/es/input/TextArea", () => (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
        <textarea {...props} />
));

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: tMock
    })
}));

jest.mock("../session", () => ({
    useSession: () => ({
        getPortalTimezone: getPortalTimezoneMock,
        getFrontendConfigurationValue: getFrontendConfigurationValueMock,
        getPortalConfigurationValue: getPortalConfigurationValueMock
    })
}));

function createListUser(id: number, name: string): ListUserResponse {
    return {
        id,
        name,
        eventDiveCount: 0,
        createdAt: dayjs(),
        payments: [{
            id,
            userId: id,
            paymentType: PaymentTypeEnum.PERIODICAL,
            paymentCount: 1,
            startDate: dayjs().subtract(1, "month"),
            endDate: dayjs().add(6, "month"),
            created: dayjs().subtract(1, "month"),
            boundEvents: []
        }],
        membershipActive: true,
        userType: UserTypeEnum.SCUBA_DIVER,
        tags: []
    };
}

function createOrganizerUser(id: number): UserResponse {
    return {
        id,
        username: "organizer@example.com",
        firstName: "Org",
        lastName: "User",
        avatarUrl: null,
        phoneNumber: "",
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

function createDiveEventResponse(): DiveEventResponse {
    const participants = [
        createListUser(1, "User 1"),
        createListUser(2, "User 2"),
        createListUser(3, "User 3"),
        createListUser(4, "User 4")
    ];

    return {
        id: 42,
        title: "Valid event title",
        description: "This event description is long enough for all built-in validation rules.",
        type: DiveTypeEnum.SURFACE,
        startTime: dayjs().add(3, "day").toISOString(),
        eventDuration: 2,
        maxDuration: 60,
        maxDepth: 20,
        maxParticipants: 4,
        status: DiveEventStatusEnum.PUBLISHED,
        organizer: createOrganizerUser(100),
        participants,
        waitingList: [],
        eventCommentId: 0
    };
}

describe("EditDiveEvent Ant Form participant validators", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        findByIdMock.mockResolvedValue(createDiveEventResponse());
        findByRoleMock.mockImplementation((role: string) => {
            if (role === RoleEnum.ROLE_ORGANIZER) {
                return Promise.resolve([createListUser(100, "Organizer User")]);
            }

            return Promise.resolve([
                createListUser(1, "User 1"),
                createListUser(2, "User 2"),
                createListUser(3, "User 3"),
                createListUser(4, "User 4"),
                createListUser(5, "User 5")
            ]);
        });
        findAllBlockedDatesMock.mockResolvedValue([]);
        updateDiveEventMock.mockResolvedValue({id: 42});
    });

    test("allows submit when selected participants equals max participants", async () => {
        render(<EditDiveEvent/>);

        const submitButton = await screen.findByRole("button", {name: "EditEvent.form.submitButton.update"});
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(updateDiveEventMock).toHaveBeenCalledTimes(1);
        });
        expect(screen.queryByText("EditEvent.form.maxDepth.rules.maxParticipants")).toBeNull();
    });

    test("shows validation error when max participants is lowered below selected participants", async () => {
        render(<EditDiveEvent/>);

        await screen.findByRole("button", {name: "EditEvent.form.submitButton.update"});

        const maxParticipantsLabel = screen.getByText("EditEvent.form.maxParticipants.label");
        const maxParticipantsItem = maxParticipantsLabel.closest(".ant-form-item");
        expect(maxParticipantsItem).not.toBeNull();

        const maxParticipantsSlider = within(maxParticipantsItem as HTMLElement).getByRole("slider");
        fireEvent.focus(maxParticipantsSlider);
        fireEvent.keyDown(maxParticipantsSlider, {key: "ArrowLeft", code: "ArrowLeft", keyCode: 37});

        fireEvent.click(screen.getByRole("button", {name: "EditEvent.form.submitButton.update"}));

        const maxParticipantErrors = await screen.findAllByText("EditEvent.form.maxDepth.rules.maxParticipants");
        expect(maxParticipantErrors.length).toBeGreaterThan(0);
        expect(updateDiveEventMock).not.toHaveBeenCalled();
    });
});


