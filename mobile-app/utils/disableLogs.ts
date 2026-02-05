import { LogBox } from 'react-native';

// Ẩn warning & error cụ thể
LogBox.ignoreLogs([
  'Text strings must be rendered within a <Text> component',
]);
// Safe logger to prevent Base64 and large data from flooding the console
const createSafeLogger = () => {
  // Check if we're in production mode
  if (!__DEV__) {
    // Completely disable all console methods in production
    console.log = () => { };
    console.error = () => { };
    console.warn = () => { };
    console.info = () => { };
    console.debug = () => { };
    return;
  }

  // Create safe versions of console methods
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;
  const originalDebug = console.debug;

  // Helper function to sanitize data
  const sanitizeData = (data) => {
    if (typeof data === 'string') {
      // Check if it's a Base64 string (starts with data:image/ or looks like Base64)
      if (data.startsWith('data:image/')) {
        return '[IMAGE BASE64 OMITTED - TOO LONG]';
      }

      // Check if it looks like a Base64 string (contains only Base64 characters and has high length)
      if (data.length > 100 && /^[A-Za-z0-9+/]*={0,2}$/.test(data.replace(/\s/g, ''))) {
        return `[BASE64 STRING OMITTED - LENGTH: ${data.length}]`;
      }

      // Check if it's a URL with Base64 embedded
      if (data.includes('data:image')) {
        return data.replace(/(data:image\/[a-zA-Z]+;base64,)[^"'\s]*/g, '$1[BASE64 OMITTED]');
      }
    } else if (typeof data === 'object' && data !== null) {
      // If it's an object, check its properties for Base64 strings
      try {
        return JSON.parse(JSON.stringify(data, (key, value) => {
          if (typeof value === 'string') {
            if (value.startsWith('data:image/')) {
              return '[IMAGE BASE64 OMITTED - TOO LONG]';
            }
            if (value.length > 100 && /^[A-Za-z0-9+/]*={0,2}$/.test(value.replace(/\s/g, ''))) {
              return `[BASE64 STRING OMITTED - LENGTH: ${value.length}]`;
            }
            if (value.includes('data:image')) {
              return value.replace(/(data:image\/[a-zA-Z]+;base64,)[^"'\s]*/g, '$1[BASE64 OMITTED]');
            }
          }
          return value;
        }));
      } catch (e) {
        // If JSON parsing fails, return original item
        return data;
      }
    }
    return data;
  };

  // Override console.log with safe version
  console.log = (...args) => {
    const sanitizedArgs = args.map(arg => sanitizeData(arg));
    originalLog(...sanitizedArgs);
  };

  // Override console.error with safe version
  console.error = (...args) => {
    const sanitizedArgs = args.map(arg => sanitizeData(arg));
    originalError(...sanitizedArgs);
  };

  // Override console.warn with safe version
  console.warn = (...args) => {
    const sanitizedArgs = args.map(arg => sanitizeData(arg));
    originalWarn(...sanitizedArgs);
  };

  // Override console.info with safe version
  console.info = (...args) => {
    const sanitizedArgs = args.map(arg => sanitizeData(arg));
    originalInfo(...sanitizedArgs);
  };

  // Override console.debug with safe version
  console.debug = (...args) => {
    const sanitizedArgs = args.map(arg => sanitizeData(arg));
    originalDebug(...sanitizedArgs);
  };
};

createSafeLogger();