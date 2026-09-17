import {render, screen} from "@testing-library/react";
import {ShowCertificateCard} from "../components";
import type {CertificateResponse} from "../models";

const mockUseBreakpoint = jest.fn();

jest.mock("antd", () => {
    const actual = jest.requireActual("antd");
    return {
        ...actual,
        Grid: {
            ...actual.Grid,
            useBreakpoint: () => mockUseBreakpoint()
        }
    };
});

jest.mock("react-i18next", () => ({
    useTranslation: () => ({t: (key: string) => key})
}));

jest.mock("../services", () => ({
    fileTransferAPI: {removeCertificateFile: jest.fn()},
    getApiBaseUrl: () => "http://localhost/api"
}));

jest.mock("../components/Certificate/EditCertificate", () => ({
    EditCertificate: () => null
}));

const certificate = {
    id: 5,
    organization: "PADI",
    certificateName: "Open Water",
    certificateId: "OW-1",
    diverId: "D-1",
    certificationDate: "2024-01-01",
    certificatePhotoUrl: null,
    classificationTitle: null
} as unknown as CertificateResponse;

const WIDE = {xs: false, sm: true, md: true, lg: true, xl: false, xxl: false};
const NARROW = {xs: true, sm: false, md: false, lg: false, xl: false, xxl: false};

describe("ShowCertificateCard responsive header", () => {
    it("places the action buttons in the card header on a wide screen", () => {
        mockUseBreakpoint.mockReturnValue(WIDE);

        render(<ShowCertificateCard certificate={certificate} deleteCertificate={jest.fn()} viewOnly={false}/>);

        const actions = screen.getByTestId("certificate-card-actions");
        expect(actions.closest(".ant-card-extra")).not.toBeNull();
        expect(screen.queryByTestId("certificate-card-actions-row")).toBeNull();
        expect(screen.getByText("common.button.update")).toBeInTheDocument();
    });

    it("moves the action buttons to their own row inside the card body on a narrow screen", () => {
        mockUseBreakpoint.mockReturnValue(NARROW);

        render(<ShowCertificateCard certificate={certificate} deleteCertificate={jest.fn()} viewOnly={false}/>);

        const actions = screen.getByTestId("certificate-card-actions");
        expect(actions.closest(".ant-card-extra")).toBeNull();
        expect(actions.closest("[data-testid='certificate-card-actions-row']")).not.toBeNull();
        expect(actions.closest(".ant-card-body")).not.toBeNull();
        expect(screen.getByText("common.button.delete")).toBeInTheDocument();
    });

    it("renders no action row on a narrow screen when the card is read only", () => {
        mockUseBreakpoint.mockReturnValue(NARROW);

        render(<ShowCertificateCard certificate={certificate} deleteCertificate={null} viewOnly={true}/>);

        expect(screen.queryByTestId("certificate-card-actions-row")).toBeNull();
        expect(screen.queryByTestId("certificate-card-actions")).toBeNull();
        expect(screen.getByText(/ShowCertificateCard.card.organization/)).toBeInTheDocument();
    });

    it("stacks the detail and photo columns on a narrow screen", () => {
        mockUseBreakpoint.mockReturnValue(NARROW);

        render(<ShowCertificateCard certificate={certificate} deleteCertificate={null} viewOnly={true}/>);

        const columns = document.querySelectorAll(".ant-card-body .ant-row > .ant-col-xs-24");
        expect(columns.length).toBe(2);
    });
});
