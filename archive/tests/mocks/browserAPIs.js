// Browser API mocks for Jest testing

// Mock FileReader
global.FileReader = jest.fn().mockImplementation(() => {
  const reader = {
    readAsDataURL: jest.fn().mockImplementation(function(file) {
      // Simulate async operation
      setTimeout(() => {
        this.result = 'data:image/jpeg;base64,' + btoa(file.content || 'test content');
        if (this.onload) this.onload({ target: this });
      }, 0);
    }),
    readAsText: jest.fn(),
    readAsArrayBuffer: jest.fn(),
    result: null,
    error: null,
    readyState: 0,
    onload: null,
    onerror: null,
    onloadend: null,
    onloadstart: null,
    onprogress: null,
    abort: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  };
  return reader;
});

// Mock File constructor
global.File = jest.fn().mockImplementation((content, filename, options = {}) => ({
  name: filename,
  type: options.type || '',
  size: content.length,
  lastModified: Date.now(),
  content: content,
  stream: jest.fn(),
  text: jest.fn().mockResolvedValue(content),
  arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(content.length)),
  slice: jest.fn()
}));

// Mock Blob constructor
global.Blob = jest.fn().mockImplementation((content, options = {}) => ({
  size: content.reduce((total, item) => total + (item.length || 0), 0),
  type: options.type || '',
  content: content,
  stream: jest.fn(),
  text: jest.fn().mockResolvedValue(content.join('')),
  arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
  slice: jest.fn()
}));

// Mock URL
global.URL = {
  createObjectURL: jest.fn().mockReturnValue('blob:mock-url'),
  revokeObjectURL: jest.fn()
};

// Mock Image constructor
global.Image = jest.fn().mockImplementation(() => ({
  src: '',
  width: 0,
  height: 0,
  naturalWidth: 0,
  naturalHeight: 0,
  complete: false,
  onload: null,
  onerror: null,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn()
}));

// Mock alert
global.alert = jest.fn();

// Mock TextEncoder
global.TextEncoder = jest.fn().mockImplementation(() => ({
  encode: jest.fn().mockImplementation((input) => {
    return new Uint8Array(Buffer.from(input, 'utf8'));
  })
}));

// Mock TextDecoder
global.TextDecoder = jest.fn().mockImplementation(() => ({
  decode: jest.fn().mockImplementation((input) => {
    return Buffer.from(input).toString('utf8');
  })
}));


// Mock document.createElement
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: jest.fn().mockReturnValue({
    drawImage: jest.fn(),
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(),
    putImageData: jest.fn(),
    createImageData: jest.fn(),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    closePath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    bezierCurveTo: jest.fn(),
    quadraticCurveTo: jest.fn(),
    arc: jest.fn(),
    arcTo: jest.fn(),
    rect: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    clip: jest.fn(),
    isPointInPath: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    translate: jest.fn(),
    transform: jest.fn(),
    setTransform: jest.fn(),
    resetTransform: jest.fn(),
    toDataURL: jest.fn().mockReturnValue('data:image/png;base64,mockdata')
  }),
  toDataURL: jest.fn().mockReturnValue('data:image/png;base64,mockdata'),
  toBlob: jest.fn().mockImplementation((callback) => {
    const blob = new Blob(['mockdata'], { type: 'image/png' });
    callback(blob);
  })
};

// Mock document methods (jsdom already provides document)
if (global.document) {
  global.document.createElement = jest.fn().mockImplementation((tagName) => {
    if (tagName === 'canvas') {
      return mockCanvas;
    }
    return {};
  });
  global.document.getElementById = jest.fn();
  global.document.querySelector = jest.fn();
  global.document.querySelectorAll = jest.fn().mockReturnValue([]);
  global.document.addEventListener = jest.fn();
  global.document.removeEventListener = jest.fn();
}

// Mock window (jsdom already provides window)
if (global.window) {
  global.window.FileReader = global.FileReader;
  global.window.File = global.File;
  global.window.Blob = global.Blob;
  global.window.URL = global.URL;
  global.window.Image = global.Image;
  global.window.alert = global.alert;
  global.window.TextEncoder = global.TextEncoder;
  global.window.TextDecoder = global.TextDecoder;
  global.window.addEventListener = jest.fn();
  global.window.removeEventListener = jest.fn();
}

// Mock fetch
global.fetch = jest.fn();

// Mock console methods
global.console = {
  ...console,
  error: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};
