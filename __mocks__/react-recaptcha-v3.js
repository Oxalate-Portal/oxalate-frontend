const React = require("react");

function GoogleReCaptchaProvider({children}) {
    return React.createElement(React.Fragment, null, children);
}

function useReCaptcha() {
    return {
        executeRecaptcha: async () => "mock-recaptcha-token"
    };
}

module.exports = {
    GoogleReCaptchaProvider,
    useReCaptcha
};

