#!/usr/bin/env python3
"""
Simplified Chatbot following the specified flow:

User Question
 ↓
Embedding câu hỏi
 ↓
Vector Search (top_k documents)
 ↓
Lấy nội dung bài đăng (context)
 ↓
Gộp context + question
 ↓
Gửi vào LLM
 ↓
LLM trả lời dựa trên bài đăng
"""

import os
import logging
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
from vector_store import VectorStore
from openai import OpenAI
import google.generativeai as genai
from google.generativeai import GenerativeModel
import json

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger(__name__)

class SimpleChatBot:
    def __init__(self, vector_store: VectorStore):
        self.vector_store = vector_store
        self.llm_client = None
        self.model = None
        self.use_openai = os.getenv("USE_OPENAI", "true").lower() == "true"

    def init_chatbot(self):
        """Initialize the LLM client"""
        try:
            if self.use_openai:
                # Initialize OpenAI
                openai_api_key = os.getenv("OPENAI_API_KEY")
                if not openai_api_key:
                    raise Exception("OPENAI_API_KEY environment variable not set")

                self.llm_client = OpenAI(api_key=openai_api_key)
                self.model = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
                logger.info(f"Initialized OpenAI with model: {self.model}")
            else:
                # Initialize Gemini
                google_api_key = os.getenv("GOOGLE_API_KEY")
                if not google_api_key:
                    raise Exception("GOOGLE_API_KEY environment variable not set")

                genai.configure(api_key=google_api_key)
                self.model = GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-pro"))
                logger.info(f"Initialized Gemini with model: {self.model.model_name}")

        except Exception as e:
            logger.error(f"Error initializing chatbot: {e}")
            raise

    def _call_llm(self, prompt: str) -> str:
        """Call the LLM with the given prompt"""
        try:
            logger.info(f"Sending prompt to LLM (first 200 chars): {prompt[:200]}...")

            if self.use_openai:
                response = self.llm_client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "Bạn là một trợ lý chuyên nghiệp hỗ trợ tìm phòng trọ. Trả lời tự nhiên và thân thiện. LUÔN LUÔN dựa trên thông tin từ các bài đăng được cung cấp để trả lời."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    max_completion_tokens=1500
                )
                result = response.choices[0].message.content
                logger.info(f"LLM response received (first 200 chars): {result[:200]}...")
                return result
            else:
                # For Gemini
                chat = self.model.start_chat()
                logger.info("Calling Gemini model...")
                response = chat.send_message(prompt)
                result = response.text
                logger.info(f"Gemini response received (first 200 chars): {result[:200]}...")
                return result

        except Exception as e:
            logger.error(f"Error calling LLM: {e}")
            raise

    def process_question(self, question: str) -> Dict[str, Any]:
        """
        Main chatbot processing flow:
        1. User Question
        2. Embedding câu hỏi
        3. Vector Search (top_k documents)
        4. Lấy nội dung bài đăng (context)
        5. Gộp context + question
        6. Gửi vào LLM
        7. LLM trả lời dựa trên bài đăng
        """
        try:
            logger.info(f"Processing question: {question}")
            
            # Step 2: Embedding câu hỏi
            logger.info("Step 2: Generating embedding for the question")
            
            # Step 3: Vector Search (top_k documents)
            logger.info("Step 3: Performing vector search")
            relevant_docs = self.vector_store.search(question, top_k=10)
            logger.info(f"Found {len(relevant_docs)} relevant documents")
            
            # Step 4: Lấy nội dung bài đăng (context)
            logger.info("Step 4: Formatting context from relevant documents")
            context = self._format_context_from_docs(relevant_docs)
            
            # Step 5: Gộp context + question
            logger.info("Step 5: Merging context with question")
            final_prompt = self._create_prompt(context, question)
            
            # Step 6: Gửi vào LLM
            logger.info("Step 6: Sending prompt to LLM")
            response_text = self._call_llm(final_prompt)
            
            # Step 7: LLM trả lời dựa trên bài đăng
            logger.info("Step 7: LLM responded based on posts")
            
            # Check if the response contains room show instruction
            show_rooms_prefix = "__SHOW_ROOMS__::"
            if show_rooms_prefix in response_text:
                logger.info("Response contains room show instruction")
                return self._format_room_response(response_text, relevant_docs)
            else:
                logger.info("Response does not contain room show instruction")
                return {
                    "response": response_text,
                    "type": "text",
                    "rooms": [self._format_room_for_response(doc) for doc in relevant_docs[:5]] if relevant_docs else None,
                    "sources": relevant_docs
                }

        except Exception as e:
            logger.error(f"Error processing question: {e}")
            return {
                "response": "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.",
                "type": "text",
                "rooms": None,
                "sources": []
            }

    def _format_context_from_docs(self, docs: List[Dict]) -> str:
        """Format context from documents following the flow"""
        if not docs:
            return "KHÔNG CÓ BÀI ĐĂNG NÀO PHÙ HỢP VỚI YÊU CẦU CỦA BẠN"

        formatted_docs = []
        for idx, doc in enumerate(docs):
            formatted_doc = (
                f"--- Bài đăng #{idx+1} ---\n"
                f"ID: {doc['id']}\n"
                f"Tiêu đề: {doc['title']}\n"
                f"Giá: {doc['price']}\n"
                f"Địa điểm: {doc['location']}\n"
                f"Diện tích: {doc['area']} m²\n"
                f"Tiện nghi: {doc['options'] if doc.get('options') else 'Không có'}\n"
                f"Ảnh: {', '.join(doc['images']) if doc.get('images') and isinstance(doc['images'], list) else 'Không có ảnh'}\n"
                f"Chi tiết: {doc['description'][:200] if doc.get('description') else 'Không có mô tả'}...\n"
                f"Độ tương đồng: {doc['similarity']:.2f}\n"
                f"------------------------"
            )
            formatted_docs.append(formatted_doc)

        return "\n\n".join(formatted_docs)

    def _create_prompt(self, context: str, question: str) -> str:
        """Create the final prompt combining context and question"""
        prompt = f"""
BẠN CHỈ ĐƯỢC TRẢ LỜI DỰA TRÊN THÔNG TIN TRONG DỮ LIỆU ĐƯỢC CUNG CẤP DƯỚI ĐÂY.
KHÔNG ĐƯỢC Bịa đặt thông tin hoặc đưa ra thông tin không có trong dữ liệu được cung cấp.

Dưới đây là các bài đăng phòng trọ liên quan đến câu hỏi của bạn:
{context}

Câu hỏi của khách hàng: {question}

Vui lòng cung cấp thông tin về các phòng trọ phù hợp với yêu cầu của khách hàng dựa hoàn toàn trên các bài đăng được cung cấp ở trên.
Nếu có thể, hãy sắp xếp theo mức độ phù hợp và đưa ra lựa chọn tốt nhất đầu tiên.
Trả lời một cách tự nhiên và thân thiện.
"""
        return prompt

    def _format_room_for_response(self, doc: Dict) -> Dict:
        """Format a document for room response"""
        return {
            "_id": doc["id"],
            "title": doc["title"],
            "description": doc["description"],
            "location": doc["location"],
            "price": doc["price"],
            "area": doc["area"],
            "options": doc["options"],
            "images": doc.get("images", []),
            "similarity": doc["similarity"]
        }

    def _format_room_response(self, response_text: str, relevant_docs: List[Dict]):
        """Extract and format room data from the LLM response"""
        try:
            # Check if the response contains room show instruction
            show_rooms_prefix = "__SHOW_ROOMS__::"
            if show_rooms_prefix in response_text:
                # Extract the JSON part
                parts = response_text.split(show_rooms_prefix)
                text_before = parts[0].strip() if len(parts) > 0 and parts[0].strip() else ""
                json_part = parts[1].strip()

                # Parse the JSON data
                rooms_data = json.loads(json_part)

                # Get the room IDs and fetch full details
                room_ids = rooms_data.get("roomIds", [])
                rooms = []

                if room_ids:
                    # Get full room details from vector store
                    for room_id in room_ids:
                        room_doc = self.vector_store.get_document_by_id(room_id)
                        if room_doc:
                            # Add the document score/similarity for ranking
                            matching_doc = next((doc for doc in relevant_docs if doc['id'] == room_id), None)
                            room_doc_with_score = {
                                "_id": room_doc["id"],
                                "title": room_doc["title"],
                                "description": room_doc["description"],
                                "location": room_doc["location"],
                                "price": room_doc["price"],
                                "area": room_doc["area"],
                                "options": room_doc["options"],
                                "images": room_doc.get("images", []),
                                "similarity": matching_doc["similarity"] if matching_doc else 0
                            }
                            rooms.append(room_doc_with_score)

                return {
                    "response": (text_before + " " + rooms_data.get("message", "")).strip(),
                    "type": "show_rooms",
                    "rooms": rooms,
                    "sources": relevant_docs
                }
            else:
                # If no room format found, return as text
                return {
                    "response": response_text,
                    "type": "text",
                    "rooms": None,
                    "sources": relevant_docs
                }
        except Exception as parse_error:
            logger.error(f"Error parsing room data: {parse_error}")
            # If parsing fails, return as text
            return {
                "response": response_text,
                "type": "text",
                "rooms": None,
                "sources": relevant_docs
            }


if __name__ == "__main__":
    # Example usage
    print("Simple ChatBot - Following the specified flow")
    print("="*50)

    # Initialize vector store
    vector_store = VectorStore()
    vector_store.init_store()

    # Initialize chatbot
    chatbot = SimpleChatBot(vector_store)
    chatbot.init_chatbot()

    # Example question
    question = "Toi muon tim phong tro gia re"
    print(f"Question: {question}")

    # Process the question
    response = chatbot.process_question(question)
    print(f"Response type: {response['type']}")
    if response['rooms']:
        print(f"Number of rooms returned: {len(response['rooms'])}")
        for i, room in enumerate(response['rooms'][:2]):
            # Handle Unicode by encoding to ASCII with replacement
            title = room['title'][:50].encode('ascii', 'replace').decode('ascii')
            location = room['location'][:30].encode('ascii', 'replace').decode('ascii')
            print(f"  {i+1}. Title: {title}...")
            print(f"     Location: {location} | Price: {room['price']}")
    else:
        print("No rooms returned")