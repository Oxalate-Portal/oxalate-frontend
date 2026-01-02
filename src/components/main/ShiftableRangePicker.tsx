import type {ComponentProps} from "react";
import {ArrowLeftOutlined, ArrowRightOutlined} from "@ant-design/icons";
import {Button, DatePicker, Space} from "antd";
import dayjs, {type Dayjs, type ManipulateType} from "dayjs";
import {ChronoUnitEnum} from "../../models";

const {RangePicker} = DatePicker;

// AntD RangePicker shape we rely on (no generics to avoid TS errors)
export type RangeValue = [Dayjs | null, Dayjs | null] | null;
export type OnChange = (dates: RangeValue, dateStrings: [string, string]) => void;

type Props = {
    periodType: ChronoUnitEnum;
    value?: RangeValue;
    onChange?: OnChange;
} & Omit<ComponentProps<typeof RangePicker>, "value" | "onChange">;

const unitMap: Record<ChronoUnitEnum, ManipulateType> = {
    [ChronoUnitEnum.YEARS]: "year",
    [ChronoUnitEnum.MONTHS]: "month",
    [ChronoUnitEnum.DAYS]: "day"
};

export function ShiftableRangePicker({periodType, value, onChange, ...rest}: Props) {
    const unit: ManipulateType = unitMap[periodType] ?? "day";
    const rangeValue = value ?? null;
    const start = Array.isArray(rangeValue) ? (rangeValue[0] as Dayjs | null) : null;
    const end = Array.isArray(rangeValue) ? (rangeValue[1] as Dayjs | null) : null;
    const hasRange = !!(start && end);
    const now = dayjs();

    const isCurrentInside =
            hasRange &&
            !now.isBefore(start!, "day") &&
            !now.isAfter(end!, "day");

    function shift(direction: "past" | "future") {
        console.debug("Shifting range", direction, "Start:", start?.format("YYYY-MM-DD"), "End:", end?.format("YYYY-MM-DD"), "Unit:", unit, "PeriodType:", periodType);
        if (!hasRange) return;
        const delta = direction === "past" ? -1 : 1;
        const newRange: [Dayjs, Dayjs] = [start!.add(delta, unit), end!.add(delta, unit)];
        const formatStr = typeof rest.format === "string" ? rest.format : "YYYY-MM-DD";
        onChange?.(
                newRange,
                [newRange[0].format(formatStr), newRange[1].format(formatStr)]
        );
    }

    return (
            <Space>
                <Button
                        icon={<ArrowLeftOutlined/>}
                        disabled={isCurrentInside}
                        onClick={() => shift("past")}
                />
                <RangePicker
                        {...rest}
                        value={rangeValue as RangeValue}
                        onChange={onChange}
                />
                <Button
                        icon={<ArrowRightOutlined/>}
                        onClick={() => shift("future")}
                />
            </Space>
    );
}
