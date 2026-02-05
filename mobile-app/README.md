# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

cau truc du an :

mobile -app/ 
│
├── app/
│   ├── _layout.tsx                 # Layout gốc
│   ├── index.tsx                   # Trang chủ (Home)
│   ├── auth/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── rooms/
│   │   ├── [id].tsx                # Chi tiết phòng
│   │   ├── create.tsx              # Đăng phòng
│   │   └── my-rooms.tsx            # Phòng đã đăng (của chủ trọ)
│   ├── chat/
│   │   ├── index.tsx               # Danh sách cuộc chat (chủ trọ ↔ người thuê)
│   │   ├── [chatId].tsx            # Màn hình chat chi tiết
│   │   └── chatbot.tsx             # Màn hình chat với ChatBot hỗ trợ tìm phòng
│   ├── favorites/
│   │   └── index.tsx
│   ├── search/
│   │   └── index.tsx
│   └── profile/
│       ├── index.tsx
│       └── edit.tsx
│
├── components/
│   ├── ChatBubble.tsx              # Tin nhắn hiển thị (của mình/người khác)
│   ├── ChatInput.tsx               # Ô nhập tin nhắn
│   ├── ChatHeader.tsx
│   ├── RoomCard.tsx
│   ├── SearchBar.tsx
│   ├── FilterModal.tsx
│   ├── MapView.tsx
│   ├── CustomButton.tsx
│   └── EmptyState.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useFavorites.ts
│   ├── useLocation.ts
│   ├── useFetchRooms.ts
│   ├── useChat.ts                  # Hook quản lý chat realtime
│   └── useChatBot.ts               # Hook tương tác với ChatBot API
│
├── store/
│   ├── useUserStore.ts
│   ├── useRoomStore.ts
│   ├── useFilterStore.ts
│   ├── useChatStore.ts
│   └── useChatBotStore.ts
│
├── services/
│   ├── api.ts
│   ├── authService.ts
│   ├── roomService.ts
│   ├── uploadService.ts
│   ├── favoriteService.ts
│   ├── chatService.ts              # Gọi API chat, socket, message
│   ├── chatbotService.ts           # Gọi API AI (ví dụ: OpenAI, Gemini,...)
│   └── notificationService.ts      # Gửi/push thông báo khi có tin nhắn mới
│
├── constants/
│   ├── colors.ts
│   ├── icons.ts
│   ├── images.ts
│   └── appConfig.ts
│
├── types/
│   ├── room.ts
│   ├── user.ts
│   ├── message.ts
│   ├── chat.ts
│   ├── chatbot.ts
│   ├── api.ts
│   └── index.ts
│
├── utils/
│   ├── formatPrice.ts
│   ├── formatDate.ts
│   ├── validators.ts
│   ├── locationHelper.ts
│   ├── storage.ts
│   └── socketHelper.ts             # Quản lý kết nối socket.io / realtime
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── app.json
├── package.json
├── tsconfig.json
└── README.md

