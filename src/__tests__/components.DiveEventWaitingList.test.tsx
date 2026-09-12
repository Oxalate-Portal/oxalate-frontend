import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import type {ReactNode} from "react";
import {DiveEvent} from "../components";
import {PaymentTypeEnum, PortalConfigGroupEnum} from "../models";

const mockFindById = jest.fn();
const mockJoinWaitingList = jest.fn();
const mockLeaveWaitingList = jest.fn();
const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();
const mockFindMembershipByUserId = jest.fn();
const mockFindPaymentByUserId = jest.fn();
const mockGetDiveGroupsByEventId = jest.fn();
const mockGetPortalConfigurationValue = jest.fn();
const mockUserSession = {
    id: 1,
    primaryUserType: "SCUBA_DIVER",
    healthStatementId: 1,
    roles: ["ROLE_USER"]
};

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
        userSession: mockUserSession,
        getPortalConfigurationValue: mockGetPortalConfigurationValue
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
        findByUserId: (...args: unknown[]) => mockFindMembershipByUserId(...args)
    },
    paymentAPI: {
        findByUserId: (...args: unknown[]) => mockFindPaymentByUserId(...args)
    },
    diveGroupAPI: {
        getDiveGroupsByEventId: (...args: unknown[]) => mockGetDiveGroupsByEventId(...args)
    }
}));

jest.mock("../components/Commenting", () => ({
    CommentCanvas: () => <div>comment-canvas</div>
}));

jest.mock("../components/DiveEvent/DiveEventFiles", () => ({
    DiveEventFiles: () => null
}));

jest.mock("../components/DiveEvent/DiveEventDetails", () => ({
    DiveEventDetails: () => null
}));

jest.mock("../components/Notification", () => ({
    AdminNotifications: () => null
}));

jest.mock("../components/main", () => ({
    ...jest.requireActual("../components/main"),
    HealthStatementConfirmationModal: () => null
}));

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key
    })
}));

jest.mock("@ant-design/icons", () => ({
    LinkOutlined: () => <span>link</span>
}));

jest.mock("antd", () => {
    const SelectMock = ({children}: { children: ReactNode }) => <div>{children}</div>;
    SelectMock.Option = ({children}: { children: ReactNode }) => <div>{children}</div>;

    const FormMock = ({children}: { children: ReactNode }) => <form>{children}</form>;
    FormMock.Item = ({children}: { children: ReactNode }) => <div>{children}</div>;
    FormMock.useForm = () => [{resetFields: jest.fn(), setFieldsValue: jest.fn(), getFieldValue: jest.fn()}];

    return {
        message: {useMessage: () => [{success: jest.fn(), error: jest.fn()}, <span key="message-holder"/>]},
        Alert: ({title}: { title: string }) => <div>{title}</div>,
        Button: ({children, onClick}: { children: ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
        Divider: ({children}: { children: ReactNode }) => <div>{children}</div>,
        Form: FormMock,
        Input: (props: Record<string, unknown>) => <input {...props}/>,
        Modal: ({open, children}: { open: boolean; children: ReactNode }) => open ? <div>{children}</div> : null,
        Popconfirm: ({children}: { children: ReactNode }) => <div>{children}</div>,
        Select: SelectMock,
        Space: ({children}: { children: ReactNode }) => <div>{children}</div>,
        Spin: ({children}: { children: ReactNode }) => <div>{children}</div>,
        Table: ({dataSource}: { dataSource: Array<Record<string, unknown>> }) => (
                <div>{dataSource.map((record, index) => <div key={String(record.id ?? index)}>{Object.values(record).map(String).join(" ")}</div>)}</div>
        ),
        Tooltip: ({children}: { children: ReactNode }) => <>{children}</>
    };
});


describe("DiveEvent waiting list button", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        mockGetPortalConfigurationValue.mockImplementation((_group: string, key: string) => {
            if (key === "commenting-enabled") {
                return "false";
            }
            if (key === "commenting-enabled-features") {
                return "";
            }
            return "false";
        });

        mockFindMembershipByUserId.mockResolvedValue([]);
        mockFindPaymentByUserId.mockResolvedValue({payments: []});
        mockGetDiveGroupsByEventId.mockResolvedValue([]);

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

    it("hides join button when payment count is zero even with active membership", async () => {
        mockFindById.mockResolvedValue({...baseEvent, maxParticipants: 5, waitingList: []});
        mockFindMembershipByUserId.mockResolvedValue([{id: 58, status: "ACTIVE"}]);
        mockFindPaymentByUserId.mockResolvedValue({
            payments: [{
                id: 760,
                userId: 1,
                paymentType: PaymentTypeEnum.ONE_TIME,
                paymentCount: 0,
                startDate: "2026-01-01",
                endDate: "2099-01-01",
                created: "2026-09-02T15:09:30.011Z",
                boundEvents: []
            }]
        });
        mockGetPortalConfigurationValue.mockImplementation((group: string, key: string) => {
            if (key === "commenting-enabled") {
                return "false";
            }
            if (key === "commenting-enabled-features") {
                return "";
            }
            if (group === PortalConfigGroupEnum.MEMBERSHIP && key === "event-require-membership") {
                return "true";
            }
            if (group === PortalConfigGroupEnum.PAYMENT && key === "event-require-payment") {
                return "true";
            }
            return "false";
        });

        await act(async () => {
            render(<DiveEvent/>);
        });

        await waitFor(() => expect(screen.getByText("DiveEvent.requiresPaymentAtEvent")).toBeInTheDocument());
        expect(screen.queryByText("DiveEvent.subscribe.button")).toBeNull();
    });

    it("shows payment and membership warnings when they expire before the event", async () => {
        mockFindById.mockResolvedValue({...baseEvent, maxParticipants: 5, waitingList: []});
        mockFindMembershipByUserId.mockResolvedValue([{
            id: 58,
            status: "ACTIVE",
            startDate: "2026-01-01",
            endDate: "2027-01-01"
        }]);
        mockFindPaymentByUserId.mockResolvedValue({
            payments: [{
                paymentType: PaymentTypeEnum.PERIODICAL,
                paymentCount: null,
                startDate: "2026-01-01",
                endDate: "2027-01-01"
            }]
        });
        mockGetPortalConfigurationValue.mockImplementation((group: string, key: string) => {
            if (key === "commenting-enabled") {
                return "false";
            }
            if (key === "commenting-enabled-features") {
                return "";
            }
            if (group === PortalConfigGroupEnum.MEMBERSHIP && key === "event-require-membership") {
                return "true";
            }
            if (group === PortalConfigGroupEnum.PAYMENT && key === "event-require-payment") {
                return "true";
            }
            if (group === PortalConfigGroupEnum.PAYMENT
                    && (key === "periodical-payment-method-type" || key === "one-time-expiration-type")) {
                return "ENABLED";
            }
            return "false";
        });

        render(<DiveEvent/>);

        await waitFor(() => {
            expect(screen.getByText("DiveEvent.requiresMembershipAtEvent")).toBeInTheDocument();
            expect(screen.getByText("DiveEvent.requiresPaymentAtEvent")).toBeInTheDocument();
        });
        expect(screen.queryByText("DiveEvent.subscribe.button")).toBeNull();
    });

    it("does not show the payment warning while a payment check is pending", async () => {
        let resolvePayment: ((value: { payments: Array<Record<string, unknown>> }) => void) | undefined;
        jest.useFakeTimers({now: new Date("2026-09-12T13:13:54.260+03:00")});
        mockFindById.mockResolvedValue({
            ...baseEvent,
            startTime: "2028-09-23T09:00:00Z",
            maxParticipants: 5,
            waitingList: []
        });
        mockFindPaymentByUserId.mockImplementation(() => new Promise(resolve => {
            resolvePayment = resolve;
        }));
        mockGetPortalConfigurationValue.mockImplementation((group: string, key: string) => {
            if (key === "commenting-enabled") {
                return "false";
            }
            if (key === "commenting-enabled-features") {
                return "";
            }
            if (group === PortalConfigGroupEnum.PAYMENT && key === "event-require-payment") {
                return "true";
            }
            if (group === PortalConfigGroupEnum.PAYMENT && (key === "periodical-payment-method-type" || key === "one-time-expiration-type")) {
                return "ENABLED";
            }
            return "false";
        });

        try {
            render(<DiveEvent/>);
            await act(async () => {
                await Promise.resolve();
                await Promise.resolve();
            });
            expect(mockFindPaymentByUserId).toHaveBeenCalledWith(1);
            expect(screen.queryByText("DiveEvent.requiresPaymentAtEvent")).toBeNull();

            await act(async () => {
                resolvePayment?.({
                    payments: [{
                        paymentType: PaymentTypeEnum.PERIODICAL,
                        paymentCount: null,
                        endDate: "2029-01-01"
                    }]
                });
                await Promise.resolve();
                await Promise.resolve();
            });

            expect(screen.getByText("DiveEvent.subscribe.button")).toBeInTheDocument();
            expect(screen.queryByText("DiveEvent.requiresPaymentAtEvent")).toBeNull();
        } finally {
            jest.useRealTimers();
        }
    });

    it("shows the payment warning after a payment response without a valid payment", async () => {
        mockFindById.mockResolvedValue({...baseEvent, maxParticipants: 5, waitingList: []});
        mockFindPaymentByUserId.mockResolvedValue({payments: []});
        mockGetPortalConfigurationValue.mockImplementation((group: string, key: string) => {
            if (key === "commenting-enabled") {
                return "false";
            }
            if (key === "commenting-enabled-features") {
                return "";
            }
            if (group === PortalConfigGroupEnum.PAYMENT && key === "event-require-payment") {
                return "true";
            }
            if (group === PortalConfigGroupEnum.PAYMENT && (key === "periodical-payment-method-type" || key === "one-time-expiration-type")) {
                return "ENABLED";
            }
            return "false";
        });

        render(<DiveEvent/>);

        await waitFor(() => expect(screen.getByText("DiveEvent.requiresPaymentAtEvent")).toBeInTheDocument());
        expect(screen.queryByText("DiveEvent.subscribe.button")).toBeNull();
    });

    it("shows the payment warning when the payment check times out", async () => {
        jest.useFakeTimers();
        mockFindById.mockResolvedValue({...baseEvent, maxParticipants: 5, waitingList: []});
        mockFindPaymentByUserId.mockReturnValue(new Promise(() => undefined));
        mockGetPortalConfigurationValue.mockImplementation((group: string, key: string) => {
            if (key === "commenting-enabled") {
                return "false";
            }
            if (key === "commenting-enabled-features") {
                return "";
            }
            if (group === PortalConfigGroupEnum.PAYMENT && key === "event-require-payment") {
                return "true";
            }
            if (group === PortalConfigGroupEnum.PAYMENT && (key === "periodical-payment-method-type" || key === "one-time-expiration-type")) {
                return "ENABLED";
            }
            return "false";
        });

        try {
            render(<DiveEvent/>);
            await act(async () => {
                await Promise.resolve();
                await Promise.resolve();
            });
            expect(mockFindPaymentByUserId).toHaveBeenCalledWith(1);
            expect(screen.queryByText("DiveEvent.requiresPaymentAtEvent")).toBeNull();

            await act(async () => {
                jest.advanceTimersByTime(10000);
                await Promise.resolve();
            });

            expect(screen.getByText("DiveEvent.requiresPaymentAtEvent")).toBeInTheDocument();
        } finally {
            jest.useRealTimers();
        }
    });
});
