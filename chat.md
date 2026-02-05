# Tài liệu hướng dẫn tích hợp và cấu hình Chatbot cho ứng dụng Mobile

## Tổng quan

Tài liệu này hướng dẫn cách tích hợp và cấu hình chatbot vào ứng dụng mobile PhongTro123, cho phép người dùng tương tác với trợ lý AI để tìm kiếm phòng trọ ngay trong ứng dụng.

## Kiến trúc hệ thống

```
Ứng dụng Mobile (React Native/Expo)
    ↓ (HTTP requests)
Dịch vụ Chatbot (Python/Flask) - cổng 8000
    ↓ (truy vấn dữ liệu)
Vector Database (ChromaDB/MongoDB)
    ↓ (dữ liệu phòng trọ)
Dữ liệu từ API chính - cổng 3000
```

## Yêu cầu hệ thống

- Máy chủ: Python 3.8+, Node.js 16+
- Thiết bị mobile: Android hoặc iOS
- Mạng: Cả máy chủ và thiết bị mobile phải cùng mạng LAN

## Cài đặt và cấu hình dịch vụ chatbot

### 1. Cài đặt môi trường cho dịch vụ chatbot

```bash
cd chatbot_service
python -m venv venv
source venv/bin/activate  # Trên Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Cấu hình biến môi trường

Tạo file `.env` trong thư mục `chatbot_service`:

```env
# Database Configuration
CONNECT_DB=mongodb://localhost:27017/phongtro

# LLM Configuration - Set only one of these
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
USE_OPENAI=true

# OR for Google Gemini
# GOOGLE_API_KEY=your_google_api_key_here
# GEMINI_MODEL=gemini-pro
# USE_OPENAI=false

# Server Configuration
HOST=0.0.0.0
PORT=8000

# API Configuration for fetching data
API_URL=http://192.168.48.1:3000/api/get-posts
```

### 3. Khởi động dịch vụ chatbot

```bash
cd chatbot_service
python main.py
```

Dịch vụ sẽ chạy trên cổng 8000 và bạn có thể kiểm tra bằng cách truy cập: `http://localhost:8000/health`

## Cấu hình ứng dụng mobile

### 1. Cấu hình URL dịch vụ chatbot

Trong file `mobile-app/services/chatbotService.ts`, cập nhật URL:

```typescript
// Define the chatbot API URL
// For real devices: use your computer's IP address on the local network
const CHATBOT_API_URL = 'http://192.168.48.1:8000'; // Thay bằng IP thực tế của máy bạn
```

### 2. Cấu hình mạng (cho iOS)

Trong file `mobile-app/app.json`, thêm cấu hình bảo mật mạng:

```json
{
  "expo": {
    // ... các cấu hình khác ...
    "ios": {
      // ... các cấu hình ios khác ...
      "infoPlist": {
        "NSAppTransportSecurity": {
          "NSAllowsArbitraryLoads": true
        }
      }
    }
  }
}
```

## Cách sử dụng

### 1. Truy cập chatbot trong ứng dụng

- Chatbot được tích hợp vào màn hình chính (trang chủ)
- Có nút nổi hình bong bóng chat ở góc dưới bên phải
- Nhấn vào nút để mở giao diện chatbot

### 2. Tính năng chatbot

- Hỗ trợ tìm kiếm phòng trọ theo khu vực, giá cả, tiện nghi
- Trả về danh sách phòng phù hợp dưới dạng card
- Hiển thị hình ảnh, tiêu đề, giá, địa điểm và diện tích
- Tự động cuộn đến tin nhắn mới nhất

### 3. Ví dụ câu hỏi

Người dùng có thể hỏi các câu như:
- "Tôi muốn tìm phòng trọ ở khu vực Hà Nội giá dưới 3 triệu"
- "Có nhà nguyên căn nào gần trường đại học?"
- "Tìm cho tôi căn hộ chung cư có máy lạnh"

## Cấu hình mạng cho thiết bị mobile

### 1. Xác định IP máy chủ

Trên máy chủ, chạy lệnh:
- Windows: `ipconfig`
- Mac/Linux: `ifconfig` hoặc `ip addr`

Tìm địa chỉ IPv4 trong mạng LAN (thường bắt đầu bằng 192.168.x.x hoặc 10.x.x.x)

### 2. Cập nhật URL trong ứng dụng

Thay thế `192.168.48.1` trong file `chatbotService.ts` bằng IP thực tế của máy bạn.

### 3. Kiểm tra kết nối

Trước khi chạy ứng dụng, kiểm tra xem thiết bị có thể truy cập dịch vụ không:
- Mở trình duyệt trên thiết bị
- Truy cập `http://[IP_MÁY_CHỦ]:8000/health`
- Nếu thấy phản hồi `{"service": "chatbot-api", "status": "healthy"}`, kết nối thành công

## Gỡ lỗi

### 1. "Network request failed"

Nguyên nhân phổ biến và cách khắc phục:
- Dịch vụ chatbot chưa chạy → Khởi động lại dịch vụ
- IP không đúng → Kiểm tra lại IP máy chủ
- Thiết bị không cùng mạng → Đảm bảo cả máy chủ và thiết bị cùng mạng LAN
- Firewall chặn cổng 8000 → Kiểm tra cấu hình firewall

### 2. Chatbot không phản hồi

- Kiểm tra log của dịch vụ chatbot
- Đảm bảo API keys được cấu hình đúng
- Kiểm tra kết nối database

### 3. Không thấy nút chatbot

- Kiểm tra file `app/(tabs)/index.tsx` để đảm bảo nút chat được thêm vào
- Đảm bảo component `<ChatBot>` được render đúng cách

## Triển khai sản phẩm

### 1. Cho môi trường phát triển

- Đảm bảo cả máy chủ và thiết bị cùng mạng LAN
- Sử dụng IP LAN thay vì localhost
- Kiểm tra kết nối trước khi chạy ứng dụng

### 2. Cho môi trường sản phẩm

- Cân nhắc chạy dịch vụ chatbot trên máy chủ công cộng
- Sử dụng HTTPS thay vì HTTP
- Cấu hình xác thực người dùng nếu cần

## Lưu ý quan trọng

- Cả thiết bị mobile và máy chạy dịch vụ chatbot phải cùng mạng LAN
- Cổng 8000 phải được mở và không bị firewall chặn
- API keys phải được bảo mật và không commit vào source code
- Nên sử dụng reverse proxy (nginx) trong môi trường sản phẩm để quản lý SSL và load balancing

## Cập nhật ứng dụng

Khi thay đổi IP máy chủ:
1. Cập nhật trong file `chatbotService.ts`
2. Restart lại ứng dụng mobile hoàn toàn
3. Quét lại mã QR nếu dùng Expo Go

---

Tài liệu này giúp bạn hiểu cách tích hợp và cấu hình chatbot cho ứng dụng mobile PhongTro123, đặc biệt là cách thiết lập kết nối đến dịch vụ chatbot chạy trên cổng 8000 với IP cụ thể như `http://192.168.48.1:8000`.





#####

Tài liệu hướng dẫn tích hợp và cấu hình Chatbot cho ứng dụng Mobile

  Tổng quan

  Tài liệu này hướng dẫn cách tích hợp và cấu hình chatbot vào ứng dụng mobile PhongTro123, cho phép người dùng tương tác với
  trợ lý AI để tìm kiếm phòng trọ ngay trong ứng dụng.

  Kiến trúc hệ thống

   1 Ứng dụng Mobile (React Native/Expo)
   2     ↓ (HTTP requests)
   3 Dịch vụ Chatbot (Python/Flask) - cổng 8000
   4     ↓ (truy vấn dữ liệu)
   5 Vector Database (ChromaDB/MongoDB)
   6     ↓ (dữ liệu phòng trọ)
   7 Dữ liệu từ API chính - cổng 3000

  Yêu cầu hệ thống

   - Máy chủ: Python 3.8+, Node.js 16+
   - Thiết bị mobile: Android hoặc iOS
   - Mạng: Cả máy chủ và thiết bị mobile phải cùng mạng LAN

  Cài đặt và cấu hình dịch vụ chatbot

  1. Cài đặt môi trường cho dịch vụ chatbot

   1 cd chatbot_service
   2 python -m venv venv
   3 source venv/bin/activate  # Trên Windows: venv\Scripts\activate
   4 pip install -r requirements.txt

  2. Cấu hình biến môi trường

  Tạo file .env trong thư mục chatbot_service:

    1 # Database Configuration
    2 CONNECT_DB=mongodb://localhost:27017/phongtro
    3 
    4 # LLM Configuration - Set only one of these
    5 OPENAI_API_KEY=your_openai_api_key_here
    6 OPENAI_MODEL=gpt-4o-mini
    7 USE_OPENAI=true
    8 
    9 # OR for Google Gemini
   10 # GOOGLE_API_KEY=your_google_api_key_here
   11 # GEMINI_MODEL=gemini-pro
   12 # USE_OPENAI=false
   13
   14 # Server Configuration
   15 HOST=0.0.0.0
   16 PORT=8000
   17
   18 # API Configuration for fetching data
   19 API_URL=http://192.168.48.1:3000/api/get-posts

  3. Khởi động dịch vụ chatbot

   1 cd chatbot_service
   2 python main.py

  Dịch vụ sẽ chạy trên cổng 8000 và bạn có thể kiểm tra bằng cách truy cập: http://localhost:8000/health

  Cấu hình ứng dụng mobile

  1. Cấu hình URL dịch vụ chatbot

  Trong file mobile-app/services/chatbotService.ts, cập nhật URL:

   1 // Define the chatbot API URL
   2 // For real devices: use your computer's IP address on the local network
   3 const CHATBOT_API_URL = 'http://192.168.48.1:8000'; // Thay bằng IP thực tế của máy bạn

  2. Cấu hình mạng (cho iOS)

  Trong file mobile-app/app.json, thêm cấu hình bảo mật mạng:

    1 {
    2   "expo": {
    3     // ... các cấu hình khác ...
    4     "ios": {
    5       // ... các cấu hình ios khác ...
    6       "infoPlist": {
    7         "NSAppTransportSecurity": {
    8           "NSAllowsArbitraryLoads": true
    9         }
   10       }
   11     }
   12   }
   13 }

  Cách sử dụng

  1. Truy cập chatbot trong ứng dụng

   - Chatbot được tích hợp vào màn hình chính (trang chủ)
   - Có nút nổi hình bong bóng chat ở góc dưới bên phải
   - Nhấn vào nút để mở giao diện chatbot

  2. Tính năng chatbot

   - Hỗ trợ tìm kiếm phòng trọ theo khu vực, giá cả, tiện nghi
   - Trả về danh sách phòng phù hợp dưới dạng card
   - Hiển thị hình ảnh, tiêu đề, giá, địa điểm và diện tích
   - Tự động cuộn đến tin nhắn mới nhất

  3. Ví dụ câu hỏi

  Người dùng có thể hỏi các câu như:
   - "Tôi muốn tìm phòng trọ ở khu vực Hà Nội giá dưới 3 triệu"
   - "Có nhà nguyên căn nào gần trường đại học?"
   - "Tìm cho tôi căn hộ chung cư có máy lạnh"

  Cấu hình mạng cho thiết bị mobile

  1. Xác định IP máy chủ

  Trên máy chủ, chạy lệnh:
   - Windows: ipconfig
   - Mac/Linux: ifconfig hoặc ip addr

  Tìm địa chỉ IPv4 trong mạng LAN (thường bắt đầu bằng 192.168.x.x hoặc 10.x.x.x)

  2. Cập nhật URL trong ứng dụng

  Thay thế 192.168.48.1 trong file chatbotService.ts bằng IP thực tế của máy bạn.

  3. Kiểm tra kết nối

  Trước khi chạy ứng dụng, kiểm tra xem thiết bị có thể truy cập dịch vụ không:
   - Mở trình duyệt trên thiết bị
   - Truy cập http://[IP_MÁY_CHỦ]:8000/health
   - Nếu thấy phản hồi {"service": "chatbot-api", "status": "healthy"}, kết nối thành công

  Gỡ lỗi

  1. "Network request failed"

  Nguyên nhân phổ biến và cách khắc phục:
   - Dịch vụ chatbot chưa chạy → Khởi động lại dịch vụ
   - IP không đúng → Kiểm tra lại IP máy chủ
   - Thiết bị không cùng mạng → Đảm bảo cả máy chủ và thiết bị cùng mạng LAN
   - Firewall chặn cổng 8000 → Kiểm tra cấu hình firewall

  2. Chatbot không phản hồi

   - Kiểm tra log của dịch vụ chatbot
   - Đảm bảo API keys được cấu hình đúng
   - Kiểm tra kết nối database

  3. Không thấy nút chatbot

   - Kiểm tra file app/(tabs)/index.tsx để đảm bảo nút chat được thêm vào
   - Đảm bảo component <ChatBot> được render đúng cách

  Triển khai sản phẩm

  1. Cho môi trường phát triển

   - Đảm bảo cả máy chủ và thiết bị cùng mạng LAN
   - Sử dụng IP LAN thay vì localhost
   - Kiểm tra kết nối trước khi chạy ứng dụng

  2. Cho môi trường sản phẩm

   - Cân nhắc chạy dịch vụ chatbot trên máy chủ công cộng
   - Sử dụng HTTPS thay vì HTTP
   - Cấu hình xác thực người dùng nếu cần

  Lưu ý quan trọng

   - Cả thiết bị mobile và máy chạy dịch vụ chatbot phải cùng mạng LAN
   - Cổng 8000 phải được mở và không bị firewall chặn
   - API keys phải được bảo mật và không commit vào source code
   - Nên sử dụng reverse proxy (nginx) trong môi trường sản phẩm để quản lý SSL và load balancing

  Cập nhật ứng dụng

  Khi thay đổi IP máy chủ:
   1. Cập nhật trong file chatbotService.ts
   2. Restart lại ứng dụng mobile hoàn toàn
   3. Quét lại mã QR nếu dùng Expo Go

  ---

  Tài liệu này giúp bạn hiểu cách tích hợp và cấu hình chatbot cho ứng dụng mobile PhongTro123, đặc biệt là cách thiết lập kết
  nối đến dịch vụ chatbot chạy trên cổng 8000 với IP cụ thể như http://192.168.48.1:8000.



  #################
  import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, Linking, Image, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChatBot } from '../hooks/useChatBot';
import { ChatbotMessage, RecommendationResponse } from '../../services/chatbotService';

interface ChatBotProps {
  visible: boolean;
  onClose: () => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ visible, onClose }) => {
  const { messages, isLoading, error, sendUserMessage, clearMessages } = useChatBot();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Scroll to the end when messages change
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      // Use a small delay to ensure the content has been rendered
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  if (!visible) return null;

  const handleSend = async () => {
    if (inputText.trim() === '') return;

    try {
      await sendUserMessage(inputText);
      setInputText('');
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn. Vui lòng thử lại.');
    }
  };

  const renderMessage = ({ item }: { item: ChatbotMessage }) => {
    const isUser = item.sender === 'user';

    // Handle room recommendation responses (similar to web version)
    if (typeof item.content !== 'string' && item.content.type === 'show_rooms' && item.content.rooms) {
      return (
        <View style={[styles.messageContainer, styles.botMessage]}>
          <View style={[styles.messageBubble, styles.botBubble]}>
            {/* Display the message text */}
            {item.content.message && item.content.message.trim() !== '' && (
              <Text style={[styles.messageText, styles.botText]}>{item.content.message}</Text>
            )}

            {/* Render room recommendations grid */}
            <View style={styles.roomRecommendationsContainer}>
              <FlatList
                data={item.content.rooms}
                horizontal={false}
                numColumns={1}
                keyExtractor={(room) => room._id}
                renderItem={({ item: room }) => (
                  <TouchableOpacity
                    style={styles.roomRecommendationItem}
                    onPress={() => handleRoomPress(room)}
                  >
                    <View style={styles.roomImageContainer}>
                      {room.images && room.images.length > 0 ? (
                        <Image
                          source={{ uri: room.images[0] }}
                          style={styles.roomImage}
                          resizeMode="cover"
                          onError={() => console.log('Failed to load image:', room.images[0])}
                        />
                      ) : (
                        <View style={styles.noImagePlaceholder}>
                          <Text style={styles.noImageText}>No Image</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.roomInfo}>
                      <Text style={styles.roomTitle} numberOfLines={2}>{room.title}</Text>

                      <View style={styles.roomDetails}>
                        <Text style={styles.roomPrice}>
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(room.price)}/tháng
                        </Text>

                        <Text style={styles.roomLocation} numberOfLines={1}>📍 {room.location}</Text>
                        <Text style={styles.roomArea}>📐 {room.area} m²</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.viewDetailButton}
                      onPress={() => handleRoomPress(room)}
                    >
                      <Text style={styles.viewDetailButtonText}>Xem chi tiết</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
              />
            </View>

            <Text style={styles.timestamp}>
              {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      );
    }

    // Handle regular text messages
    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.botMessage]}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
            {typeof item.content === 'string' ? item.content : item.content.message}
          </Text>
          <Text style={styles.timestamp}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const handleRoomPress = (room: any) => {
    // In a real app, navigate to room detail screen
    // For now, we'll just show an alert with room details
    Alert.alert(
      "Chi tiết phòng",
      `Tiêu đề: ${room.title}\nGiá: ${new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(room.price)}/tháng\nĐịa chỉ: ${room.location}\nDiện tích: ${room.area} m²`,
      [
        { text: "OK", style: "cancel" },
        {
          text: "Xem chi tiết",
          onPress: () => {
            // In a real app, navigate to room detail screen
            // For now, we'll just open a URL if available
            Alert.alert("Thông báo", "Chức năng xem chi tiết sẽ được triển khai trong phiên bản hoàn chỉnh.");
          }
        }
      ]
    );
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chat với Trợ lý AI</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => {
            // Auto scroll to bottom when content changes
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 10);
          }}
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Hỏi tôi về phòng trọ..."
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, inputText.trim() === '' && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={isLoading || inputText.trim() === ''}
          >
            {isLoading ? (
              <Ionicons name="time" size={24} color="#fff" />
            ) : (
              <Ionicons name="send" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    padding: 5,
  },
  messagesList: {
    flex: 1,
    marginBottom: 10,
  },
  messagesContent: {
    paddingVertical: 10,
    justifyContent: 'flex-end',
  },
  messageContainer: {
    marginVertical: 5,
    paddingHorizontal: 10,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  botMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 5,
  },
  botBubble: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  botText: {
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  roomRecommendationsContainer: {
    marginTop: 10,
    width: '100%',
  },
  roomRecommendationItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'column',
  },
  roomImageContainer: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
  },
  roomImage: {
    width: '100%',
    height: '100%',
  },
  noImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#999',
    fontSize: 14,
  },
  roomInfo: {
    flex: 1,
    marginBottom: 10,
  },
  roomTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 6,
    minHeight: 40,
  },
  roomDetails: {
    gap: 4,
  },
  roomPrice: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
  roomLocation: {
    fontSize: 12,
    color: '#666',
  },
  roomArea: {
    fontSize: 12,
    color: '#888',
  },
  viewDetailButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  viewDetailButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ChatBot;