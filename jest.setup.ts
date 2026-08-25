// Setup global test environment variables
process.env.VITE_APP_API_URL = 'http://localhost:8080/api';

// react-router uses the Web API encoder, which is not provided by jsdom.
if (!globalThis.TextEncoder) {
    const {TextEncoder} = require('util');
    globalThis.TextEncoder = TextEncoder;
}
