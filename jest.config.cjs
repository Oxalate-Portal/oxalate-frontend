module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jest-environment-jsdom',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    setupFiles: ['<rootDir>/jest.setup.ts'],
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
        '\\?react$': '<rootDir>/__mocks__/fileMock.js',
        '^ckeditor5$': '<rootDir>/__mocks__/ckeditor5.js',
        '^@ckeditor/ckeditor5-react$': '<rootDir>/__mocks__/ckeditor5-react.js',
        '^@wojtekmaj/react-recaptcha-v3$': '<rootDir>/__mocks__/react-recaptcha-v3.js',
        '^\\./LoginWithCaptcha$': '<rootDir>/__mocks__/LoginWithCaptcha.js',
        '^\\./OxalateFooter$': '<rootDir>/__mocks__/OxalateFooter.js'
    },
    modulePaths: [
        '<rootDir>/src'
    ],
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/main.tsx',
        '!src/vite-env.d.ts'
    ],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: '<rootDir>/tsconfig.jest.json',
            diagnostics: false,
            useESM: true
        }]
    }
};
