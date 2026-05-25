// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Ensure dayjs plugins are active in test env
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn()
        })
    });
}

if (!window.ResizeObserver) {
    class ResizeObserverMock {
        observe() {
            // no-op in jsdom
        }

        unobserve() {
            // no-op in jsdom
        }

        disconnect() {
            // no-op in jsdom
        }
    }

    Object.defineProperty(window, 'ResizeObserver', {
        writable: true,
        value: ResizeObserverMock
    });
}

