import {render, screen} from "@testing-library/react";
import {ErrorBoundary} from "../components";

/**
 * OWASP A10:2025 - Mishandling of Exceptional Conditions.
 *
 * Without a boundary, a single render failure unmounts the entire tree and leaves a blank page with no
 * indication of what happened. The boundary must also never put the error text on screen, because messages
 * originating from the backend can carry implementation detail.
 */
describe("OWASP A10: rendering failures are contained", () => {
    const consoleError = jest.spyOn(console, "error")
            .mockImplementation(() => undefined);

    afterAll(() => consoleError.mockRestore());

    function Exploding(): React.ReactElement {
        throw new Error("io.oxalate.backend.SecretlyDetailedFailure at line 42");
    }

    it("renders children when nothing fails", () => {
        render(<ErrorBoundary><span data-testid="child">fine</span></ErrorBoundary>);

        expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("renders a fallback instead of a blank page", () => {
        render(<ErrorBoundary><Exploding/></ErrorBoundary>);

        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(screen.getByText("Etwas ist schiefgelaufen")).toBeInTheDocument();
        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
        expect(screen.getByText("Algo salió mal")).toBeInTheDocument();
        expect(screen.getByText("Jokin meni pieleen")).toBeInTheDocument();
        expect(screen.getByText("Något gick fel")).toBeInTheDocument();
    });

    it("does not display the underlying error to the user", () => {
        const {container} = render(<ErrorBoundary><Exploding/></ErrorBoundary>);

        expect(container.textContent).not.toContain("io.oxalate");
        expect(container.textContent).not.toContain("line 42");
    });
});
