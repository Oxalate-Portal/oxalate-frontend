import {Component, type ErrorInfo, type ReactNode} from "react";

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

const fallbackMessages = [
    {
        language: "de",
        title: "Etwas ist schiefgelaufen",
        description: "Die Seite konnte nicht angezeigt werden. Bitte laden Sie die Seite neu und versuchen Sie es erneut.",
    },
    {
        language: "en",
        title: "Something went wrong",
        description: "The page could not be displayed. Please reload the page and try again.",
    },
    {
        language: "es",
        title: "Algo salió mal",
        description: "No se pudo mostrar la página. Vuelve a cargar la página e inténtalo de nuevo.",
    },
    {
        language: "fi",
        title: "Jokin meni pieleen",
        description: "Sivua ei voitu näyttää. Lataa sivu uudelleen ja yritä uudestaan.",
    },
    {
        language: "sv",
        title: "Något gick fel",
        description: "Sidan kunde inte visas. Ladda om sidan och försök igen.",
    },
];

/**
 * OWASP A10:2025 - Mishandling of Exceptional Conditions.
 *
 * React unmounts the whole component tree when a render throws and no boundary catches it, leaving a blank
 * page. Besides being unusable, a blank page hides the failure from the user while any half-applied state
 * stays in `localStorage`. This boundary renders a neutral message instead and keeps the stack trace in the
 * console only, so nothing about the implementation is put on screen.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {

    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {hasError: false};
    }

    static getDerivedStateFromError(): ErrorBoundaryState {
        return {hasError: true};
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error("Unhandled rendering error", error, errorInfo.componentStack);
    }

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                    <div role="alert" style={{padding: "2rem", textAlign: "center"}}>
                        {fallbackMessages.map(({language, title, description}) => (
                                <div key={language} lang={language}>
                                    <h1>{title}</h1>
                                    <p>{description}</p>
                                </div>
                        ))}
                        <button type="button" onClick={() => window.location.reload()}>
                            Neu laden / Reload / Recargar / Lataa uudelleen / Ladda om
                        </button>
                    </div>
            );
        }

        return this.props.children;
    }
}

export {ErrorBoundary};
