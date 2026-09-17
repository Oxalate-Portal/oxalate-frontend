import {render, screen} from "@testing-library/react";
import {Form, Input} from "antd";
import {resolveFormLayout, useResponsiveFormLayout} from "../components";

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

const WIDE = {xs: false, sm: true, md: true, lg: true, xl: false, xxl: false};
const NARROW = {xs: true, sm: false, md: false, lg: false, xl: false, xxl: false};

describe("resolveFormLayout", () => {
    it("is horizontal with the given spans on a wide screen", () => {
        expect(resolveFormLayout(WIDE, 8, 12)).toEqual({layout: "horizontal", labelCol: {span: 8}, wrapperCol: {span: 12}});
    });

    it("is vertical without column spans on a narrow screen", () => {
        expect(resolveFormLayout(NARROW, 8, 12)).toEqual({layout: "vertical"});
    });

    it("stays horizontal before the breakpoints are known and in jsdom", () => {
        expect(resolveFormLayout({}, 12, 16).layout).toBe("horizontal");
        expect(resolveFormLayout({xs: false, sm: false, md: false}, 12, 16).layout).toBe("horizontal");
    });

    it("honours a custom breakpoint", () => {
        expect(resolveFormLayout({xs: false, sm: false, md: true, lg: false, xl: false, xxl: false}, 8, 12, "lg").layout).toBe("vertical");
        expect(resolveFormLayout({xs: false, sm: false, md: true, lg: false, xl: false, xxl: false}, 8, 12, "md").layout).toBe("horizontal");
    });
});

function TestForm() {
    const layout = useResponsiveFormLayout(8, 12);

    return (
        <Form {...layout} data-testid={"form"}>
            <Form.Item label={"Name"} name={"name"}>
                <Input/>
            </Form.Item>
        </Form>
    );
}

describe("useResponsiveFormLayout", () => {
    it("renders a horizontal form on a wide screen", () => {
        mockUseBreakpoint.mockReturnValue(WIDE);

        render(<TestForm/>);

        expect(screen.getByTestId("form")).toHaveClass("ant-form-horizontal");
        expect(document.querySelector(".ant-form-item-label.ant-col-8")).not.toBeNull();
    });

    it("renders a vertical form on a narrow screen", () => {
        mockUseBreakpoint.mockReturnValue(NARROW);

        render(<TestForm/>);

        expect(screen.getByTestId("form")).toHaveClass("ant-form-vertical");
        expect(document.querySelector(".ant-form-item-label.ant-col-8")).toBeNull();
    });
});
