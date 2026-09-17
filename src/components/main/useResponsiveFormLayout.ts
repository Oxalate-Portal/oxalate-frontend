import {type FormProps, Grid} from "antd";
import type {Breakpoint} from "antd/es/_util/responsiveObserver";
import {isNarrowScreen} from "./OxTable";

export type ResponsiveFormLayout = Pick<FormProps, "layout" | "labelCol" | "wrapperCol">;

/**
 * Resolves the layout props of a form for the given breakpoint map: a horizontal form with the given label and
 * control spans on wide screens, and a vertical form (labels above the controls, full-width controls) on screens
 * narrower than the breakpoint. Exported separately from the hook so that it can be unit tested without rendering.
 */
export function resolveFormLayout(screens: Partial<Record<Breakpoint, boolean>>, labelSpan: number, wrapperSpan: number,
                                  collapseBelow: Breakpoint = "md"): ResponsiveFormLayout {
    if (isNarrowScreen(screens, collapseBelow)) {
        return {layout: "vertical"};
    }

    return {layout: "horizontal", labelCol: {span: labelSpan}, wrapperCol: {span: wrapperSpan}};
}

/**
 * Layout props for a form that is horizontal on wide screens and vertical on phones. Spread the result on the
 * `Form`: `<Form {...useResponsiveFormLayout(8, 12)} ...>`. The breakpoint matches the one OxTable collapses at.
 */
export function useResponsiveFormLayout(labelSpan: number, wrapperSpan: number, collapseBelow: Breakpoint = "md"): ResponsiveFormLayout {
    const screens = Grid.useBreakpoint();
    return resolveFormLayout(screens, labelSpan, wrapperSpan, collapseBelow);
}
