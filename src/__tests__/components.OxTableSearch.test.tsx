import {fireEvent, render, screen} from "@testing-library/react";
import {OxTableSearch} from "../components";

jest.mock("react-i18next", () => ({useTranslation: () => ({t: (key: string) => key})}));

describe("OxTableSearch", () => {
    it("renders the translated placeholder, reports trimmed searches and clears", () => {
        const onSearch = jest.fn();
        render(<OxTableSearch onSearch={onSearch}/>);

        const input = screen.getByPlaceholderText("common.table.search.placeholder");
        fireEvent.change(input, {target: {value: "  ada  "}});
        fireEvent.keyDown(input, {key: "Enter", code: "Enter"});
        expect(onSearch).toHaveBeenCalledWith("ada");

        fireEvent.click(screen.getByRole("button", {name: /search/i}));
        expect(onSearch).toHaveBeenCalledTimes(2);

        fireEvent.click(screen.getByRole("button", {name: /close-circle/i}));
        expect(onSearch).toHaveBeenLastCalledWith("");
    });

    it("shows the applied value, a custom placeholder and no switch without a case-sensitivity handler", () => {
        render(<OxTableSearch value="wreck" onSearch={jest.fn()} placeholder="Events.search.placeholder"/>);

        expect(screen.getByPlaceholderText("Events.search.placeholder")).toHaveValue("wreck");
        expect(screen.queryByRole("switch")).not.toBeInTheDocument();
        expect(screen.queryByText("common.table.search.caseSensitive")).not.toBeInTheDocument();
    });

    it("renders the case-sensitive switch with its label and forwards the toggle", () => {
        const onCaseSensitiveChange = jest.fn();
        render(<OxTableSearch onSearch={jest.fn()} caseSensitive={false} onCaseSensitiveChange={onCaseSensitiveChange}/>);

        expect(screen.getByText("common.table.search.caseSensitive")).toBeInTheDocument();
        const toggle = screen.getByRole("switch", {name: "common.table.search.caseSensitive"});
        expect(toggle).toHaveAttribute("aria-checked", "false");
        fireEvent.click(toggle);
        expect(onCaseSensitiveChange).toHaveBeenCalledWith(true);
    });

    it("renders extra controls in front of the field and fills the width without a fixed pixel width", () => {
        const {container} = render(
            <OxTableSearch onSearch={jest.fn()}>
                <select aria-label="column">
                    <option>userName</option>
                </select>
            </OxTableSearch>
        );

        const bar = container.querySelector(".ox-table-search") as HTMLElement;
        expect(bar.firstElementChild).toBe(screen.getByLabelText("column"));
        expect(bar.style.width).toBe("100%");
        expect(bar.style.maxWidth).toBe("720px");
        expect(bar.style.flexWrap).toBe("wrap");
    });
});
