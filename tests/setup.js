// Test setup for photo component tests
const { JSDOM } = require('jsdom');

// Mock TextEncoder/TextDecoder for Node.js compatibility
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock DOM environment
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head></head>
<body>
    <div id="photoComponentContainer"></div>
</body>
</html>
`, {
    url: 'http://localhost:3000',
    pretendToBeVisual: true,
    resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock fetch
global.fetch = jest.fn();

// Mock console methods
global.console = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
};

// Mock alert
global.alert = jest.fn();

// Mock setTimeout and setInterval
global.setTimeout = jest.fn((fn, delay) => {
    return setTimeout(fn, delay);
});

global.setInterval = jest.fn((fn, delay) => {
    return setInterval(fn, delay);
});

// Clean up after each test
afterEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset DOM
    document.body.innerHTML = '<div id="photoComponentContainer"></div>';
    
    // Remove any modals
    const modals = document.querySelectorAll('[id*="modal"]');
    modals.forEach(modal => modal.remove());
});
