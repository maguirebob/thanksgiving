// URL polyfill for Jest tests
const { URL, URLSearchParams } = require('url');

// Make URL available globally for pg-connection-string
global.URL = URL;
global.URLSearchParams = URLSearchParams;
