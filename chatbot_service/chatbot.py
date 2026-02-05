import os
import logging
from typing import Dict, Any, List, Optional
from vector_store import VectorStore
from openai import OpenAI
from google.generativeai import GenerativeModel
import google.generativeai as genai
import json

logger = logging.getLogger(__name__)

class ChatBot:
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
                # Create different calls based on model type to handle parameter compatibility
                if self.model == "o1-preview" or self.model.startswith("o1-") or self.model.startswith("gpt-4o"):
                    # Some newer models might not support temperature or may have specific requirements
                    # They also might not support system messages, so we include instructions in the user prompt
                    response = self.llm_client.chat.completions.create(
                        model=self.model,
                        messages=[
                            {"role": "user", "content": prompt}
                        ]
                    )
                else:
                    # Standard models support temperature and max_completion_tokens
                    response = self.llm_client.chat.completions.create(
                        model=self.model,
                        messages=[
                            {"role": "system", "content": "Bạn là một trợ lý chuyên nghiệp hỗ trợ tìm các loại hình nhà ở bao gồm phòng trọ, nhà nguyên căn, căn hộ chung cư, căn hộ mini và ở ghép. Trả lời tự nhiên và thân thiện. LUÔN LUÔN dựa trên thông tin từ các bài đăng được cung cấp để trả lời."},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.3,  # Giảm nhiệt độ để tăng tính chính xác
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

    def _extract_category_from_question(self, question: str) -> str:
        """Extract property category from question if present"""
        question_lower = question.lower()

        # Category mappings
        category_keywords = {
            'phong-tro': ['phòng trọ', 'phong tro', 'tro', 'phong'],
            'nha-nguyen-can': ['nhà nguyên căn', 'nha nguyen can', 'nhà nguyên can', 'nha nguyen căn', 'nguyên căn', 'nguyen can'],
            'can-ho-chung-cu': ['căn hộ chung cư', 'can ho chung cu', 'căn hộ', 'can ho', 'chung cư', 'chung cu'],
            'can-ho-mini': ['căn hộ mini', 'can ho mini', 'căn hộ nhỏ', 'can ho nho'],
            'o-ghep': ['ở ghép', 'o ghep', 'ghép', 'ghep', 'người ở ghép', 'nguoi o ghep']
        }

        for category, keywords in category_keywords.items():
            for keyword in keywords:
                if keyword in question_lower:
                    return category

        return ""

    def _extract_area_range_from_question(self, question: str) -> Optional[tuple]:
        """Extract min and max area from question if present"""
        import re

        question_lower = question.lower()

        # Common Vietnamese area terms - improved patterns to match "từ 25-30 m2" format
        area_patterns = [
            r'(?:khoảng|tầm|gần|diện tích|khoảng\s+từ)?\s*(\d+(?:[,\.]\d+)?)\s*(?:m2|m²|met vuông|vuông)\s*(?:đến|đến khoảng)?\s*(\d+(?:[,\.]\d+)?)?(?:m2|m²|met vuông|vuông)?',
            r'(?:từ|trên)\s*(\d+(?:[,\.]\d+)?)\s*(?:-|đến)\s*(\d+(?:[,\.]\d+)?)\s*(?:m2|m²|met vuông|vuông)',  # Pattern for "từ 25-30 m2"
            r'(?:từ|trên)\s*(\d+(?:[,\.]\d+)?)\s*(?:m2|m²|met vuông|vuông)\s*(?:đến|đến khoảng)?\s*(\d+(?:[,\.]\d+)?)?(?:m2|m²|met vuông|vuông)?',
            r'(\d+(?:[,\.]\d+)?)\s*(?:m2|m²|met vuông|vuông)\s*(?:đến|đến khoảng)\s*(\d+(?:[,\.]\d+)?)\s*(?:m2|m²|met vuông|vuông)',
            r'(?:dưới|ít hơn)\s*(\d+(?:[,\.]\d+)?)\s*(?:m2|m²|met vuông|vuông)',
            r'(?:trên|nhiều hơn)\s*(\d+(?:[,\.]\d+)?)\s*(?:m2|m²|met vuông|vuông)',
        ]

        for pattern in area_patterns:
            matches = re.findall(pattern, question_lower)
            if matches:
                for match in matches:
                    if isinstance(match, tuple):
                        if len(match) == 2 and match[0] and match[1]:  # Range
                            min_area = float(match[0].replace(',', '.'))
                            max_area = float(match[1].replace(',', '.'))
                            return (min_area, max_area)
                        elif len(match) == 1 and match[0]:  # Single area or first in range
                            # For "dưới" or "trên" patterns, we need to interpret differently
                            area = float(match[0].replace(',', '.'))
                            if 'dưới' in question_lower or 'ít hơn' in question_lower:
                                return (0, area)
                            elif 'trên' in question_lower or 'nhiều hơn' in question_lower:
                                return (area, float('inf'))
                            else:
                                # For "khoảng", allow some flexibility
                                return (area - 2, area + 2)
                    else:
                        # Single value matched
                        area = float(match.replace(',', '.'))
                        return (area - 2, area + 2)

        return None

    def _extract_amenities_from_question(self, question: str) -> List[str]:
        """Extract amenities from question if present"""
        question_lower = question.lower()

        # Amenity mappings
        amenity_keywords = {
            'có gác': ['có gác', 'co gac', 'gác', 'gac'],
            'có máy lạnh': ['có máy lạnh', 'co may lanh', 'máy lạnh', 'may lanh', 'điều hòa', 'dieu hoa'],
            'đầy đủ nội thất': ['đầy đủ nội thất', 'day du noi that', 'đầy đủ', 'day du', 'nội thất', 'noi that'],
            'không chung chủ': ['không chung chủ', 'khong chung chu', 'không chung', 'khong chung'],
            'giờ giấc tự do': ['giờ giấc tự do', 'gio gic tu do', 'giờ tự do', 'gio tu do'],
            'có ban công': ['có ban công', 'co ban cong', 'ban công', 'ban cong'],
            'có nội thất': ['có nội thất', 'co noi that', 'nội thất', 'noi that'],
            'có an ninh': ['có an ninh', 'co an ninh', 'an ninh', 'bảo vệ', 'bao ve'],
            'có thang máy': ['có thang máy', 'co thang may', 'thang máy', 'thang may'],
            'có kệ bếp': ['có kệ bếp', 'co ke bep', 'kệ bếp', 'ke bep'],
            'có máy giặt': ['có máy giặt', 'co may giat', 'máy giặt', 'may giat'],
            'có hầm để xe': ['có hầm để xe', 'co ham de xe', 'hầm để xe', 'ham de xe', 'chỗ để xe', 'cho de xe']
        }

        found_amenities = []
        for standard_amenity, keywords in amenity_keywords.items():
            for keyword in keywords:
                if keyword in question_lower and standard_amenity not in found_amenities:
                    found_amenities.append(standard_amenity)

        return found_amenities

    def process_question(self, question: str, user_id: Optional[str] = None, session_id: Optional[str] = None) -> Dict[str, Any]:
        """Process a user question using RAG - with detailed debugging"""
        try:
            logger.info(f"Processing question: {question}")

            # Determine if the user is asking for rental listings
            is_rental_request = self._is_rental_request(question)
            logger.info(f"Is rental request: {is_rental_request}")

            # Extract location, price range, area range, category and amenities from question for better targeting
            extracted_location = self._extract_location_from_question(question)
            price_range = self._extract_price_range_from_question(question)
            area_range = self._extract_area_range_from_question(question)
            extracted_category = self._extract_category_from_question(question)
            extracted_amenities = self._extract_amenities_from_question(question)
            logger.info(f"Extracted location: '{extracted_location}', price range: {price_range}, area range: {area_range}, category: '{extracted_category}', amenities: {extracted_amenities}")

            # Search for relevant documents
            # Enhance the search query with location, area, category, and amenities for better results
            search_query = question
            if extracted_location:
                # Only add location if it's not already in the question
                if extracted_location.lower() not in question.lower():
                    search_query = f"{search_query} {extracted_location}"
            if area_range:
                search_query = f"{search_query} {area_range[0]}m2 đến {area_range[1]}m2"
            if extracted_category:
                # Only add category if it's not already in the question
                if extracted_category.replace('-', ' ') not in question.lower():
                    search_query = f"{search_query} {extracted_category.replace('-', ' ')}"
            if extracted_amenities:
                search_query = f"{search_query} {' '.join(extracted_amenities)}"

            logger.info(f"Search query: {search_query}")

            relevant_docs = self.vector_store.search(search_query, top_k=15)
            logger.info(f"Found {len(relevant_docs)} relevant documents")

            # Log the content of relevant documents for debugging
            for i, doc in enumerate(relevant_docs[:3]):  # Just log first 3 for brevity
                logger.info(f"Relevant doc {i+1}: ID={doc['id']}, Title={doc['title'][:100]}, Location={doc['location'][:50]}, Price={doc['price']}, Category={doc['metadata'].get('category', '')}")

            # Filter results based on extracted criteria if available
            filtered_docs = self._filter_documents_by_criteria(relevant_docs, extracted_location, price_range, area_range, extracted_category, extracted_amenities)
            logger.info(f"Found {len(filtered_docs)} filtered documents after applying criteria")

            # Log the content of filtered documents for debugging
            for i, doc in enumerate(filtered_docs[:3]):  # Just log first 3 for brevity
                logger.info(f"Filtered doc {i+1}: ID={doc['id']}, Title={doc['title'][:100]}, Location={doc['location'][:50]}, Price={doc['price']}, Category={doc['metadata'].get('category', '')}")

            # Format relevant documents for the LLM in a structured way
            formatted_docs = []
            for idx, doc in enumerate(filtered_docs):
                formatted_doc = (
                    f"--- Bài đăng #{idx+1} ---\n"
                    f"ID: {doc['id']}\n"
                    f"Tiêu đề: {doc['title']}\n"
                    f"Giá: {doc['price']}\n"
                    f"Địa điểm: {doc['location']}\n"
                    f"Danh mục: {doc['metadata'].get('category', 'phòng trọ')}\n"
                    f"Diện tích: {doc['area']} m²\n"
                    f"Tiện nghi: {', '.join(doc['options']) if isinstance(doc.get('options'), list) and doc.get('options') else 'Không có'}\n"
                    f"Chi tiết: {doc['description'][:200] if doc.get('description') else 'Không có mô tả'}...\n"
                    f"Độ tương đồng: {doc['similarity']:.2f}\n"
                    f"------------------------"
                )
                formatted_docs.append(formatted_doc)

            docs_text = "\n\n".join(formatted_docs) if formatted_docs else "KHÔNG CÓ BÀI ĐĂNG NÀO PHÙ HỢP VỚI YÊU CẦU CỦA BẠN"

            if not filtered_docs:
                # If no relevant documents found, respond generically
                logger.info("No relevant documents found, responding generically")
                prompt = f"""
                BẠN CHỈ ĐƯỢC TRẢ LỜI DỰA TRÊN THÔNG TIN TRONG DỮ LIỆU ĐƯỢC CUNG CẤP.

                HIỆN TẠI KHÔNG CÓ BÀI ĐĂNG NÀO PHÙ HỢP VỚI YÊU CẦU CỦA NGƯỜI DÙNG.

                Câu hỏi của khách hàng: {question}

                Xin lỗi bạn, hiện tại chúng tôi không có bài đăng nào phù hợp với yêu cầu của bạn.
                Vui lòng thử lại với tiêu chí tìm kiếm khác (khu vực khác, mức giá khác, danh mục khác, hoặc điều chỉnh các tiện nghi yêu cầu).

                Nếu bạn cần hỗ trợ thêm, vui lòng liên hệ đội ngũ hỗ trợ để được tư vấn cụ thể hơn.
                """

                response_text = self._call_llm(prompt)

                return {
                    "response": response_text,
                    "type": "text",
                    "rooms": None,
                    "sources": []
                }

            # Create prompt for LLM with structured retrieved documents
            if is_rental_request or extracted_location:
                # Special handler when we detect a rental request or location is mentioned
                if len(filtered_docs) > 0:
                    # Take top 5 relevant results
                    selected_rooms = filtered_docs[:5]
                    selected_room_ids = [doc['id'] for doc in selected_rooms]

                    # Log the selected rooms
                    logger.info(f"Selected room IDs: {selected_room_ids}")

                    # Create structured prompt with clear instructions
                    prompt = f"""
                    BẠN CHỈ ĐƯỢC TRẢ LỜI DỰA TRÊN THÔNG TIN TRONG DỮ LIỆU ĐƯỢC CUNG CẤP DƯỚI ĐÂY.
                    KHÔNG ĐƯỢC Bịa đặt thông tin hoặc đưa ra thông tin không có trong dữ liệu được cung cấp.

                    Dưới đây là các bài đăng phù hợp với yêu cầu của người dùng:
                    {docs_text}

                    Câu hỏi của khách hàng: {question}

                    Vui lòng cung cấp thông tin về các bài đăng phù hợp với yêu cầu của khách hàng dựa hoàn toàn trên các bài đăng được cung cấp ở trên.
                    QUAN TRỌNG: Nếu bài đăng có danh mục là 'nhà nguyên căn', 'căn hộ chung cư', 'căn hộ mini', hoặc 'ở ghép', bạn PHẢI ghi rõ danh mục này trong câu trả lời, không gọi chung là 'phòng trọ'.
                    Nếu có thể, hãy sắp xếp theo mức độ phù hợp và đưa ra lựa chọn tốt nhất đầu tiên.
                    Nếu người dùng yêu cầu tìm bài đăng, hãy trả lời theo định dạng sau:
                    __SHOW_ROOMS__::{{"message": "Dưới đây là các bài đăng phù hợp với yêu cầu của bạn:", "roomIds": {json.dumps(selected_room_ids)}}}

                    Nếu không thể trả lời dựa trên dữ liệu có sẵn, vui lòng thông báo rõ ràng cho người dùng biết.
                    """

                    logger.info(f"Sending rental request prompt to LLM, context length: {len(docs_text)} chars")
                    response_text = self._call_llm(prompt)

                    # Check if the response contains room show instruction
                    show_rooms_prefix = "__SHOW_ROOMS__::"
                    if show_rooms_prefix in response_text:
                        logger.info("Response contains room show instruction")
                        return self._format_room_response(response_text, filtered_docs)
                    else:
                        logger.info("Response does not contain room show instruction")
                        # Return as text response with room information
                        return {
                            "response": response_text,
                            "type": "text",
                            "rooms": [self._format_room_for_response(doc) for doc in selected_rooms],
                            "sources": filtered_docs
                        }
                else:
                    # No relevant documents found - inform the user
                    prompt = f"""
                    BẠN CHỈ ĐƯỢC TRẢ LỜI DỰA TRÊN THÔNG TIN TRONG DỮ LIỆU ĐƯỢC CUNG CẤP.

                    HIỆN TẠI KHÔNG CÓ BÀI ĐĂNG NÀO PHÙ HỢP VỚI YÊU CẦU CỦA NGƯỜI DÙNG.

                    Người dùng đang tìm kiếm bài đăng tại khu vực {extracted_location or 'không xác định'} với mức giá {price_range or 'không xác định'}.
                    Câu hỏi của khách hàng: {question}

                    Xin lỗi bạn, hiện tại chúng tôi không có bài đăng nào phù hợp với yêu cầu của bạn.
                    Vui lòng thử lại với tiêu chí tìm kiếm khác (khu vực khác, mức giá khác, danh mục khác, hoặc điều chỉnh các tiện nghi yêu cầu).
                    """

                    response_text = self._call_llm(prompt)
                    return {
                        "response": response_text,
                        "type": "text",
                        "rooms": None,
                        "sources": []
                    }
            else:
                # Standard handler for other queries
                prompt = f"""
                BẠN CHỈ ĐƯỢC TRẢ LỜI DỰA TRÊN THÔNG TIN TRONG DỮ LIỆU ĐƯỢC CUNG CẤP DƯỚI ĐÂY.
                KHÔNG ĐƯỢC Bịa đặt thông tin hoặc đưa ra thông tin không có trong dữ liệu được cung cấp.

                Dưới đây là một số bài đăng liên quan đến câu hỏi của người dùng:
                {docs_text}

                Câu hỏi của khách hàng: {question}

                Trả lời câu hỏi dựa trên thông tin từ các bài đăng được cung cấp. Nếu không liên quan đến bài đăng nào, trả lời một cách tự nhiên và thân thiện.
                """

                logger.info(f"Sending standard query prompt to LLM, context length: {len(docs_text)} chars")
                response_text = self._call_llm(prompt)

                # Check if the response contains room show instruction
                show_rooms_prefix = "__SHOW_ROOMS__::"
                if show_rooms_prefix in response_text:
                    logger.info("Response contains room show instruction")
                    return self._format_room_response(response_text, filtered_docs)
                else:
                    logger.info("Response does not contain room show instruction")
                    # Return as text response
                    return {
                        "response": response_text,
                        "type": "text",
                        "rooms": None,
                        "sources": filtered_docs
                    }

        except Exception as e:
            logger.error(f"Error processing question: {e}")
            return {
                "response": "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.",
                "type": "text",
                "rooms": None,
                "sources": []
            }

    def _format_room_for_response(self, doc: Dict) -> Dict:
        """Format a document for room response"""
        # Parse images from metadata (stored as comma-separated string)
        images_str = doc["metadata"].get("images", "")
        images = []
        if images_str:
            # Split by comma and clean up whitespace
            images = [img.strip() for img in images_str.split(",") if img.strip()]

        return {
            "_id": doc["id"],
            "title": doc["title"],
            "description": doc["description"],
            "location": doc["location"],
            "price": doc["price"],
            "area": doc["area"],
            "options": doc["options"],
            "category": doc["metadata"].get("category", "phòng trọ"),
            "images": images,
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

                            # Parse images from metadata (stored as comma-separated string)
                            images_str = room_doc["metadata"].get("images", "")
                            images = []
                            if images_str:
                                # Split by comma and clean up whitespace
                                images = [img.strip() for img in images_str.split(",") if img.strip()]

                            room_doc_with_score = {
                                "_id": room_doc["id"],
                                "title": room_doc["title"],
                                "description": room_doc["description"],
                                "location": room_doc["location"],
                                "price": room_doc["price"],
                                "area": room_doc["area"],
                                "options": room_doc["options"],
                                "category": room_doc["metadata"].get("category", "phòng trọ"),
                                "images": images,
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

    def _extract_location_from_question(self, question: str) -> str:
        """Extract location from question if present"""
        import re
        # Common ways people specify location in Vietnamese
        question_lower = question.lower()

        # Look for location keywords and extract what follows
        for keyword in ['ở', 'tại', 'khu vực', 'khu vuc', 'quận', 'phường', 'huyện', 'xã', 'gần', 'thuộc']:
            pos = question_lower.find(keyword)
            if pos != -1:
                # Extract the portion after the location keyword
                after_keyword = question[pos + len(keyword):].strip()

                # Use regex to extract location more precisely
                # Look for patterns like "khu vực phú lương", "ở quận thanh xuân", etc.
                # Stop at common non-location words like "diện tích", "giá", "có", etc.
                stop_words = ['diện tích', 'dien tich', 'giá', 'gia', 'và', 'va', 'có', 'co', 'không', 'khong',
                             'm2', 'triệu', 'triệu/tháng', 'triệu/thang', 'tr/tháng', 'tr/thang']

                # Split into words and stop at first stop word
                words = after_keyword.split()
                location_words = []

                for word in words:
                    # Check if this word is a stop word
                    is_stop_word = any(stop_word in word or word in stop_word for stop_word in stop_words)
                    if is_stop_word:
                        break
                    location_words.append(word)
                    # Limit to reasonable length
                    if len(location_words) >= 4:  # Usually location names don't exceed 4 words
                        break

                location = ' '.join(location_words).strip('.,!?')

                # Additional cleanup: remove common Vietnamese address words that might not be part of the location
                location = re.sub(r'\b(từ|với|có|giá|diện tích|và|trên|dưới|khoảng|tầm|gần|ở)\b', '', location).strip()

                return location

        # If no specific location keyword found, return empty string
        return ""

    def _is_rental_request(self, question: str) -> bool:
        """Check if the user question is a rental request - now includes all property types and amenities"""
        question_lower = question.lower().strip()

        # Keywords that indicate rental/housing requests
        rental_keywords = [
            'tìm phòng', 'tìm trọ', 'tìm nhà', 'tìm ở', 'tìm chỗ', 'tìm thuê',
            'muốn thuê', 'muốn ở', 'muốn tìm', 'cần thuê', 'cần tìm', 'cần ở',
            'cho thuê', 'phòng trọ', 'nhà trọ', 'chỗ ở', 'cho ở', 'ở thuê',
            'thuê phòng', 'thuê trọ', 'thuê nhà', 'tìm người ở ghép', 'ở ghép',
            'tôi muốn tìm', 'tôi cần tìm', 'tôi đang tìm', 'có phòng nào', 'có chỗ nào',
            'có nhà nào', 'có trọ nào', 'room', 'phòng', 'nhà', 'chỗ ở',
            'tôi muốn', 'muốn', 'cần', 'tìm kiếm', 'tìm giúp', 'giúp tìm',
            'phòng cho thuê', 'nhà cho thuê', 'tìm phòng trọ', 'tìm nhà trọ',
            # Property categories
            'nhà nguyên căn', 'căn hộ chung cư', 'căn hộ mini', 'ở ghép',
            'nhà nguyên can', 'can ho chung cu', 'can ho mini', 'o ghep',
            # Amenities
            'có gác', 'có máy lạnh', 'đầy đủ nội thất', 'không chung chủ',
            'giờ giấc tự do', 'có ban công', 'có nội thất', 'có an ninh',
            'có thang máy', 'có kệ bếp', 'có máy giặt', 'có hầm để xe',
            'co gac', 'co may lanh', 'day du noi that', 'khong chung chu',
            'gio gic tu do', 'co ban cong', 'co noi that', 'co an ninh',
            'co thang may', 'co ke bep', 'co may giat', 'co ham de xe',
        ]

        # Check if it contains rental keywords
        has_rental_keyword = any(keyword in question_lower for keyword in rental_keywords)

        # A rental request is identified by having rental-related keywords
        return has_rental_keyword

    def _extract_price_range_from_question(self, question: str) -> Optional[tuple]:
        """Extract min and max price from question if present"""
        import re

        question_lower = question.lower()

        # Handle raw numbers (VND) first - this should come first
        raw_price_patterns = [
            r'(?:từ|trên)\s*(\d{6,})\s*(?:đến|đến khoảng)?\s*(\d{6,})?',  # From X to Y (large numbers for VND)
            r'(\d{6,})\s*(?:đến|->|–|–)\s*(\d{6,})',  # X đến Y
            r'(?:dưới|ít hơn)\s*(\d{6,})',  # Under X VND
            r'(?:trên|nhiều hơn)\s*(\d{6,})',  # Over X VND
        ]

        for pattern in raw_price_patterns:
            matches = re.findall(pattern, question_lower)
            if matches:
                match = matches[0]
                if isinstance(match, tuple) and len(match) >= 2 and match[0] and match[1]:
                    min_price = int(match[0])
                    max_price = int(match[1])
                    return (min_price, max_price)
                elif isinstance(match, tuple) and len(match) >= 1 and match[0]:
                    price = int(match[0])
                    if 'dưới' in question_lower or 'ít hơn' in question_lower:
                        return (0, price)
                    elif 'trên' in question_lower or 'nhiều hơn' in question_lower:
                        return (price, float('inf'))
                    else:
                        return (price - 500000, price + 500000)  # Allow ±500k buffer

        # Then handle "triệu" patterns and convert to VND
        price_patterns = [
            r'(?:tầm|khoảng|gần|ngân sách|trong khoảng)\s*(\d+(?:[,\.]\d+)?)\s*(?:triệu|tr)',
            r'(?:từ|trên)\s*(\d+(?:[,\.]\d+)?)\s*(?:triệu|tr)\s*(?:đến|đến khoảng)?\s*(\d+(?:[,\.]\d+)?)?(?:triệu|tr)?',
            r'(\d+(?:[,\.]\d+)?)\s*(?:triệu|tr)\s*(?:đến|đến khoảng)\s*(\d+(?:[,\.]\d+)?)\s*(?:triệu|tr)',
            r'(?:dưới|ít hơn)\s*(\d+(?:[,\.]\d+)?)\s*(?:triệu|tr)',
            r'(?:trên|nhiều hơn)\s*(\d+(?:[,\.]\d+)?)\s*(?:triệu|tr)',
        ]

        for pattern in price_patterns:
            matches = re.findall(pattern, question_lower)
            if matches:
                match = matches[0]
                if isinstance(match, tuple):
                    if len(match) == 2 and match[0] and match[1]:  # Range
                        min_price = float(match[0].replace(',', '.')) * 1000000  # Convert to VND
                        max_price = float(match[1].replace(',', '.')) * 1000000
                        return (min_price, max_price)
                    elif len(match) == 1 and match[0]:  # Single price or first in range
                        # For "dưới" or "trên" patterns, we need to interpret differently
                        price = float(match[0].replace(',', '.')) * 1000000
                        if 'dưới' in question_lower or 'ít hơn' in question_lower:
                            return (0, price)
                        elif 'trên' in question_lower or 'nhiều hơn' in question_lower:
                            return (price, float('inf'))
                        else:
                            # For "khoảng", allow some flexibility
                            return (price - 500000, price + 500000)
                else:
                    # Single value matched
                    price = float(match.replace(',', '.')) * 1000000
                    return (price - 500000, price + 500000)

        return None

    def _filter_documents_by_criteria(self, docs: List[Dict], location: str, price_range: Optional[tuple], area_range: Optional[tuple] = None, category: str = "", amenities: List[str] = []) -> List[Dict]:
        """Filter documents based on location, price range, area range, category, and amenities"""
        filtered_docs = []

        for doc in docs:
            doc_location = doc.get('location', '').lower()
            doc_price_str = str(doc.get('price', '0'))
            doc_area_str = str(doc.get('area', '0'))
            doc_category = doc.get('metadata', {}).get('category', '').lower()
            doc_options = [opt.lower() for opt in doc.get('options', [])]

            # Extract price from document with improved parsing
            doc_price = 0
            import re
            try:
                # Handle various price formats
                doc_price_str_clean = doc_price_str.lower().replace(',', '').replace('.', '')

                # Look for million VND first
                price_match = re.search(r'(\d+(?:[,.]\d+)?)\s*(?:triệu|tr|trieu)', doc_price_str_clean)
                if price_match:
                    doc_price = float(price_match.group(1).replace(',', '.')) * 1000000
                else:
                    # Look for thousand VND
                    price_match = re.search(r'(\d+(?:[,.]\d+)?)\s*(?:ngàn|k|nghìn|ngan)', doc_price_str_clean)
                    if price_match:
                        doc_price = float(price_match.group(1).replace(',', '.')) * 1000
                    else:
                        # Look for raw numbers (could be in VND)
                        # Only consider numbers that look like prices (greater than 100,000 VND)
                        numeric_matches = re.findall(r'(\d{6,})', doc_price_str_clean)
                        if numeric_matches:
                            # Take the largest number that looks like a monthly rent
                            possible_prices = [int(num) for num in numeric_matches if int(num) >= 100000]
                            if possible_prices:
                                doc_price = max(possible_prices)
                            else:
                                doc_price = int(numeric_matches[0]) if numeric_matches else 0
                        else:
                            # Last resort: extract any number
                            numeric_match = re.search(r'(\d+(?:[,.]\d+)?)', doc_price_str_clean)
                            if numeric_match:
                                doc_price = float(numeric_match.group(1).replace(',', '.')) * 1000000  # Assume million
            except ValueError:
                doc_price = 0

            # Extract area from document
            doc_area = 0
            try:
                doc_area = float(doc_area_str)
            except ValueError:
                # If area is not a number, try to extract from string
                area_match = re.search(r'(\d+(?:[,.]\d+)?)', doc_area_str)
                if area_match:
                    doc_area = float(area_match.group(1).replace(',', '.'))

            # Location filtering - improved matching
            location_matches = True
            if location:
                location_lower = location.lower().strip()
                if location_lower:
                    # Split location into parts and check if most parts exist in document location
                    location_parts = [part.strip() for part in location_lower.split() if len(part.strip()) > 1]

                    if location_parts:
                        # Count how many location parts match
                        matching_parts = sum(1 for part in location_parts if part in doc_location)
                        # Require at least half of the location parts to match
                        location_matches = matching_parts >= max(1, len(location_parts) // 2)

            # Price range filtering
            price_matches = True
            if price_range:
                min_price, max_price = price_range
                if max_price == float('inf'):
                    price_matches = doc_price >= min_price
                else:
                    price_matches = min_price <= doc_price <= max_price

            # Area range filtering
            area_matches = True
            if area_range:
                min_area, max_area = area_range
                if max_area == float('inf'):
                    area_matches = doc_area >= min_area
                else:
                    area_matches = min_area <= doc_area <= max_area

            # Category filtering
            category_matches = True
            if category:
                category_matches = doc_category == category.lower()

            # Amenities filtering - improved matching for Vietnamese amenities
            amenities_matches = True
            if amenities:
                for amenity in amenities:
                    amenity_lower = amenity.lower()
                    # Check if the amenity exists in the document options
                    amenity_found = any(amenity_lower in doc_option or doc_option in amenity_lower for doc_option in doc_options)

                    # If not found directly, try fuzzy matching or synonyms
                    if not amenity_found:
                        # Define common synonyms for Vietnamese amenities
                        synonym_map = {
                            'máy lạnh': ['máy lạnh', 'may lanh', 'điều hòa', 'dieu hoa'],
                            'gác': ['gác', 'gac', 'lửng', 'mezzanine'],
                            'nội thất': ['nội thất', 'noi that', 'đồ đạc', 'do dac'],
                            'an ninh': ['an ninh', 'an ninh', 'bảo vệ', 'bao ve', 'camera'],
                            'thang máy': ['thang máy', 'thang may', 'elevator', 'máy nâng']
                        }

                        # Find synonyms for the requested amenity
                        synonyms = [amenity_lower]  # Start with the original term
                        for key, values in synonym_map.items():
                            if any(amenity_lower in val or val in amenity_lower for val in values):
                                synonyms.extend(values)
                                break

                        # Check if any synonym matches
                        amenity_found = any(
                            any(synonym in doc_option or doc_option in synonym for synonym in synonyms)
                            for doc_option in doc_options
                        )

                    if not amenity_found:
                        amenities_matches = False
                        break  # If any amenity is not found, the whole match fails

            # Only add if location, price, and area match, and if category/amenities were specified, they also match
            # If no category or amenities were specified, don't filter by them
            if location_matches and price_matches and area_matches:
                # If category was specified, it must match
                # If amenities were specified, they must match
                # If neither were specified, just match location, price and area
                if (not category or category_matches) and (not amenities or amenities_matches):
                    filtered_docs.append(doc)

        return filtered_docs