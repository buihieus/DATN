export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

//   1 - // API constants                                                                                                             │
//  │     2 - let API_BASE_URL: string;                                                                                                    │
//  │     3 -                                                                                                                              │
//  │     4 - if (process.env.EXPO_PUBLIC_API_URL) {                                                                                       │
//  │     5 -   API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;                                                                            │
//  │     6 - } else if (process.env.API_URL) {                                                                                            │
//  │     7 -   API_BASE_URL = process.env.API_URL;                                                                                        │
//  │     8 - } else {                                                                                                                     │
//  │     9 -   // For development, allow configuration via environment variable or use default                                            │
//  │    10 -   // Common scenarios:                                                                                                       │
//  │    11 -   // 1. Android emulator: 10.0.2.2 (to reach host machine's localhost)                                                       │
//  │    12 -   // 2. iOS simulator: localhost (already connects to host machine)                                                          │
//  │    13 -   // 3. Real device: device must be on same network as server                                                                │
//  │    14 -   // This will fall back to http://10.0.2.2:3000 if no environment variables are set                                         │
//  │    15 -   API_BASE_URL = 'http://10.0.2.2:3000';                                                                                     │
//  │    16 - }                                                                                                                            │
//  │    17 -                                                                                                                              │
//  │    18 - export { API_BASE_URL };   