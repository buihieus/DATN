# Hướng Dẫn Triển Khai Chatbot Hỗ Trợ Khách Hàng

## Giới thiệu

Trong dự án phòng trọ 123, việc triển khai một chatbot hỗ trợ khách hàng là rất quan trọng để cải thiện trải nghiệm người dùng và giảm tải cho bộ phận chăm sóc khách hàng. Tài liệu này sẽ hướng dẫn bạn từng bước triển khai hệ thống chatbot thông minh sử dụng công nghệ RAG (Retrieval Augmented Generation) và các mô hình ngôn ngữ lớn (LLM).

## Bước 1: Cài đặt Thư Viện Liên Quan

Trước tiên, chúng ta cần cài đặt các thư viện cần thiết cho chức năng chatbot. Trong thư mục `chatbot_service`, chạy lệnh:

```bash
pip install flask flask-cors pymongo openai google-generativeai python-dotenv numpy pandas tiktoken chromadb pymongo[encryption] motor
```

## Bước 2: Thiết Lập Cấu Hình Môi Trường

Tạo file `.env` trong thư mục `chatbot_service` với các biến môi trường cần thiết:

```env
# API Keys
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_API_KEY=your_google_api_key_here

# LLM Configuration
USE_OPENAI=true
OPENAI_MODEL=gpt-3.5-turbo
GEMINI_MODEL=gemini-pro

# Database Configuration
MONGO_URI=mongodb://localhost:27017/phongtro123
VECTOR_DB_PATH=./vector_store

# Server Configuration
HOST=0.0.0.0
PORT=8000
```

## Bước 3: Thiết Kế Cơ Sở Dữ Liệu Vector

Tạo file `vector_store.py` để quản lý cơ sở dữ liệu vector:

```python
import os
import logging
import chromadb
from chromadb.config import Settings
from typing import List, Dict, Any, Optional
import json
import requests
from pymongo import MongoClient
import numpy as np
import tiktoken

logger = logging.getLogger(__name__)

class VectorStore:
    def __init__(self):
        # Initialize ChromaDB client
        self.client = chromadb.PersistentClient(path=os.getenv("VECTOR_DB_PATH", "./vector_store"))
        self.collection_name = "rental_posts"
        self.collection = None
        
        # Initialize MongoDB connection for retrieving post data
        self.mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/phongtro123")
        self.mongo_client = MongoClient(self.mongo_uri)
        self.db = self.mongo_client["phongtro123"]
        self.posts_collection = self.db["posts"]
        
        # Initialize tokenizer for embedding preparation
        self.tokenizer = tiktoken.encoding_for_model("gpt-3.5-turbo")

    def init_store(self):
        """Initialize the vector store collection"""
        try:
            # Get or create collection
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}  # Using cosine similarity
            )
            
            # Index posts if collection is empty
            if self.collection.count() == 0:
                logger.info("Vector store is empty, indexing posts from database...")
                self.index_posts()
            else:
                logger.info(f"Loaded vector store with {self.collection.count()} documents")
                
        except Exception as e:
            logger.error(f"Error initializing vector store: {e}")
            raise

    def _prepare_document_content(self, post: Dict) -> str:
        """Prepare document content for embedding"""
        # Extract and format relevant information from the post
        content_parts = []
        
        # Title and description
        if post.get("title"):
            content_parts.append(f"Tiêu đề: {post['title']}")
        if post.get("description"):
            content_parts.append(f"Mô tả: {post['description']}")
        
        # Location information
        address_info = []
        if post.get("address"):
            addr = post["address"]
            if addr.get("province"):
                address_info.append(addr["province"])
            if addr.get("district"):
                address_info.append(addr["district"])
            if addr.get("ward"):
                address_info.append(addr["ward"])
            if addr.get("detail"):
                address_info.append(addr["detail"])
        
        if address_info:
            content_parts.append(f"Địa điểm: {' '.join(address_info)}")
        elif post.get("location"):
            content_parts.append(f"Địa điểm: {post['location']}")
        
        # Price and area
        if post.get("price") is not None:
            content_parts.append(f"Giá: {post['price']} VND")
        if post.get("area") is not None:
            content_parts.append(f"Diện tích: {post['area']} m²")
        
        # Category
        if post.get("category"):
            category_map = {
                "phong-tro": "Phòng trọ",
                "nha-nguyen-can": "Nhà nguyên căn",
                "can-ho": "Căn hộ",
                "mat-bang": "Mặt bằng"
            }
            category_display = category_map.get(post["category"], post["category"])
            content_parts.append(f"Danh mục: {category_display}")
        
        # Amenities
        amenities = []
        if post.get("amenities"):
            amenities.extend(post["amenities"])
        if post.get("utilities"):
            amenities.extend([k for k, v in post["utilities"].items() if v])
        if post.get("options"):
            if isinstance(post["options"], list):
                amenities.extend(post["options"])
            elif isinstance(post["options"], dict):
                amenities.extend([k for k, v in post["options"].items() if v])
        
        if amenities:
            content_parts.append(f"Tiện nghi: {', '.join(amenities)}")
        
        # Combine all parts
        content = ". ".join(content_parts)
        
        # Limit content length to prevent oversized embeddings
        tokens = self.tokenizer.encode(content)
        if len(tokens) > 2000:  # Limit to 2000 tokens
            tokens = tokens[:2000]
            content = self.tokenizer.decode(tokens)
        
        return content

    def index_posts(self, force: bool = False) -> int:
        """Index all rental posts from MongoDB into vector store"""
        try:
            if not force and self.collection and self.collection.count() > 0:
                logger.info("Vector store already populated. Skipping indexing.")
                return 0
            
            # Clear existing collection if force is True
            if force and self.collection:
                self.client.delete_collection(self.collection_name)
                self.collection = self.client.get_or_create_collection(name=self.collection_name)
            
            # Retrieve all active posts from MongoDB
            posts = list(self.posts_collection.find({"status": "active"}))
            logger.info(f"Found {len(posts)} active posts to index")
            
            # Prepare documents for indexing
            documents = []
            metadatas = []
            ids = []
            
            for post in posts:
                doc_id = str(post["_id"])
                
                # Prepare content for embedding
                content = self._prepare_document_content(post)
                
                # Prepare metadata
                metadata = {
                    "post_id": doc_id,
                    "title": post.get("title", ""),
                    "price": post.get("price", 0),
                    "area": post.get("area", 0),
                    "category": post.get("category", "unknown"),
                    "location": post.get("location", ""),
                    "created_at": str(post.get("createdAt", "")),
                    "updated_at": str(post.get("updatedAt", ""))
                }
                
                # Add to lists
                documents.append(content)
                metadatas.append(metadata)
                ids.append(doc_id)
            
            # Batch insert into vector store
            if documents:
                self.collection.add(
                    documents=documents,
                    metadatas=metadatas,
                    ids=ids
                )
                
                logger.info(f"Successfully indexed {len(documents)} posts into vector store")
                return len(documents)
            else:
                logger.warning("No documents to index")
                return 0
                
        except Exception as e:
            logger.error(f"Error indexing posts: {e}")
            raise

    def index_posts_from_api(self, force: bool = False) -> int:
        """Index posts from API endpoint (alternative method)"""
        try:
            # This would typically call your API to get posts
            # For now, we'll use the database method
            return self.index_posts(force)
        except Exception as e:
            logger.error(f"Error indexing posts from API: {e}")
            raise

    def search(self, query: str, top_k: int = 10) -> List[Dict]:
        """Search for relevant documents based on query"""
        try:
            if not self.collection:
                logger.error("Vector store not initialized")
                return []
            
            # Perform similarity search
            results = self.collection.query(
                query_texts=[query],
                n_results=top_k
            )
            
            # Format results
            formatted_results = []
            for i in range(len(results["ids"][0])):
                doc_id = results["ids"][0][i]
                distance = results["distances"][0][i]  # Lower is more similar
                similarity = 1 - distance  # Convert distance to similarity score
                
                # Get the full document from MongoDB for complete information
                post = self.posts_collection.find_one({"_id": doc_id})
                if post:
                    formatted_result = {
                        "id": doc_id,
                        "title": post.get("title", ""),
                        "description": post.get("description", ""),
                        "location": post.get("location", ""),
                        "price": post.get("price", 0),
                        "area": post.get("area", 0),
                        "options": post.get("amenities", []) + post.get("utilities", []),
                        "metadata": {
                            "category": post.get("category", ""),
                            "created_at": post.get("createdAt", ""),
                            "updated_at": post.get("updatedAt", "")
                        },
                        "similarity": similarity
                    }
                    formatted_results.append(formatted_result)
            
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error searching vector store: {e}")
            return []

    def get_document_by_id(self, doc_id: str) -> Optional[Dict]:
        """Get a specific document by its ID"""
        try:
            post = self.posts_collection.find_one({"_id": doc_id})
            if post:
                return {
                    "id": str(post["_id"]),
                    "title": post.get("title", ""),
                    "description": post.get("description", ""),
                    "location": post.get("location", ""),
                    "price": post.get("price", 0),
                    "area": post.get("area", 0),
                    "options": post.get("amenities", []) + post.get("utilities", []),
                    "metadata": {
                        "category": post.get("category", ""),
                        "created_at": post.get("createdAt", ""),
                        "updated_at": post.get("updatedAt", "")
                    }
                }
            return None
        except Exception as e:
            logger.error(f"Error getting document by ID: {e}")
            return None
```

## Bước 4: Triển Khai Chatbot Chính

Tạo file `chatbot.py` để xử lý logic trò chuyện:

```python
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
        return {
            "_id": doc["id"],
            "title": doc["title"],
            "description": doc["description"],
            "location": doc["location"],
            "price": doc["price"],
            "area": doc["area"],
            "options": doc["options"],
            "category": doc["metadata"].get("category", "phòng trọ"),
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
                                "category": room_doc["metadata"].get("category", "phòng trọ"),
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

                # Find the end position based on stop words
                end_pos = len(after_keyword)
                for stop_word in stop_words:
                    stop_pos = after_keyword.lower().find(stop_word)
                    if stop_pos != -1 and stop_pos < end_pos:
                        end_pos = stop_pos

                location = after_keyword[:end_pos].strip()
                # Clean up the location string
                location = re.sub(r'[^\w\s\u0103\u00E2\u00EA\u00F4\u01A1\u01B0\u0110\-]', ' ', location)
                location = ' '.join(location.split())  # Normalize whitespace

                if len(location) >= 2:  # At least 2 characters
                    return location

        # Alternative: look for specific location patterns
        location_patterns = [
            r'(?:phường|xa)\s+(\w+)',
            r'(?:quận|huyện)\s+(\w+)',
            r'(?:tp\.?|thành phố)\s+([^\d,]+?)(?:,|$)',
            r'(?:tỉnh|t\.+)\s+([^\d,]+?)(?:,|$)'
        ]

        for pattern in location_patterns:
            matches = re.findall(pattern, question_lower)
            if matches:
                return matches[0].strip()

        return ""

    def _extract_price_range_from_question(self, question: str) -> Optional[tuple]:
        """Extract min and max price from question if present"""
        import re

        question_lower = question.lower()

        # Common Vietnamese price terms
        price_patterns = [
            r'(?:khoảng|tầm|gần|giá|khoảng\s+từ)?\s*(\d+(?:[,\.]\d+)?)\s*(?:triệu|trieu|tr)\s*(?:đến|đến khoảng)?\s*(\d+(?:[,\.]\d+)?)?(?:triệu|trieu|tr)?',
            r'(?:từ|trên)\s*(\d+(?:[,\.]\d+)?)\s*(?:-|đến)\s*(\d+(?:[,\.]\d+)?)\s*(?:triệu|trieu|tr)',  # Pattern for "từ 2-3 triệu"
            r'(?:từ|trên)\s*(\d+(?:[,\.]\d+)?)\s*(?:triệu|trieu|tr)\s*(?:đến|đến khoảng)?\s*(\d+(?:[,\.]\d+)?)?(?:triệu|trieu|tr)?',
            r'(\d+(?:[,\.]\d+)?)\s*(?:triệu|trieu|tr)\s*(?:đến|đến khoảng)\s*(\d+(?:[,\.]\d+)?)\s*(?:triệu|trieu|tr)',
            r'(?:dưới|ít hơn)\s*(\d+(?:[,\.]\d+)?)\s*(?:triệu|trieu|tr)',
            r'(?:trên|nhiều hơn)\s*(\d+(?:[,\.]\d+)?)\s*(?:triệu|trieu|tr)',
        ]

        for pattern in price_patterns:
            matches = re.findall(pattern, question_lower)
            if matches:
                for match in matches:
                    if isinstance(match, tuple):
                        if len(match) == 2 and match[0] and match[1]:  # Range
                            min_price = float(match[0].replace(',', '.')) * 1000000  # Convert to VND
                            max_price = float(match[1].replace(',', '.')) * 1000000  # Convert to VND
                            return (min_price, max_price)
                        elif len(match) == 1 and match[0]:  # Single price or first in range
                            # For "dưới" or "trên" patterns, we need to interpret differently
                            price = float(match[0].replace(',', '.')) * 1000000  # Convert to VND
                            if 'dưới' in question_lower or 'ít hơn' in question_lower:
                                return (0, price)
                            elif 'trên' in question_lower or 'nhiều hơn' in question_lower:
                                return (price, float('inf'))
                            else:
                                # For "khoảng", allow some flexibility (±20%)
                                return (price * 0.8, price * 1.2)
                    else:
                        # Single value matched
                        price = float(match.replace(',', '.')) * 1000000  # Convert to VND
                        return (price * 0.8, price * 1.2)

        return None

    def _filter_documents_by_criteria(self, docs: List[Dict], location: str = "", price_range: tuple = None, 
                                     area_range: tuple = None, category: str = "", amenities: List[str] = None) -> List[Dict]:
        """Filter documents based on extracted criteria"""
        filtered_docs = []
        
        for doc in docs:
            # Location filter
            if location and location.lower() not in doc['location'].lower():
                continue
            
            # Price filter
            if price_range:
                min_price, max_price = price_range
                if doc['price'] < min_price or (max_price != float('inf') and doc['price'] > max_price):
                    continue
            
            # Area filter
            if area_range:
                min_area, max_area = area_range
                if doc['area'] < min_area or (max_area != float('inf') and doc['area'] > max_area):
                    continue
            
            # Category filter
            if category and category != doc['metadata'].get('category', ''):
                continue
            
            # Amenities filter
            if amenities and doc.get('options'):
                doc_amenities = [opt.lower() for opt in doc['options']]
                missing_amenities = [amenity for amenity in amenities if amenity.lower() not in doc_amenities]
                if missing_amenities:
                    continue  # Skip if any required amenity is missing
            
            filtered_docs.append(doc)
        
        return filtered_docs

    def _is_rental_request(self, question: str) -> bool:
        """Determine if the question is asking for rental listings"""
        question_lower = question.lower()
        
        # Keywords that indicate a rental request
        rental_keywords = [
            'tìm phòng', 'tìm nhà', 'tìm trọ', 'tìm căn hộ', 'tìm chỗ ở',
            'có phòng nào', 'có nhà nào', 'có trọ nào', 'có căn hộ nào',
            'cho thuê', 'thuê phòng', 'thuê nhà', 'thuê trọ', 'thuê căn hộ',
            'muốn thuê', 'cần thuê', 'cần tìm', 'tìm nơi ở', 'tìm chỗ thuê',
            'phòng trọ', 'nhà trọ', 'căn hộ', 'nhà nguyên căn', 'ở ghép'
        ]
        
        for keyword in rental_keywords:
            if keyword in question_lower:
                return True
        
        return False
```

## Bước 5: Tạo API Server

Tạo file `main.py` để chạy API server:

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
from dotenv import load_dotenv

# Import necessary modules
from vector_store import VectorStore
from chatbot import ChatBot

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize vector store with API-based indexing (no database handler needed)
vector_store = VectorStore()  # No database handler needed as we'll use API
chatbot = ChatBot(vector_store)

@app.route('/', methods=['GET'])
def root():
    """Root endpoint with API information"""
    return jsonify({
        "message": "PhongTro123 Chatbot API",
        "version": "1.0.0",
        "endpoints": {
            "chat": "/chat (POST)",
            "reindex": "/reindex (POST)",
            "health": "/health (GET)"
        }
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify service is running"""
    return jsonify({"status": "healthy", "service": "chatbot-api"})

@app.route('/chat', methods=['POST'])
def chat():
    """
    Chat with the RAG-based chatbot.
    The bot will search for relevant rental posts and respond accordingly.
    """
    try:
        data = request.get_json()
        question = data.get('question', '')
        user_id = data.get('user_id')
        session_id = data.get('session_id')

        logger.info(f"Received chat request: {question}")

        # Process the question using the RAG system
        response = chatbot.process_question(question, user_id, session_id)

        logger.info(f"Generated response: {response.get('type', 'text')}")
        return jsonify(response)

    except Exception as e:
        logger.error(f"Error processing chat request: {str(e)}")
        return jsonify({"error": f"Error processing request: {str(e)}"}), 500

@app.route('/reindex', methods=['POST'])
def reindex():
    """
    Reindex all rental posts in the vector database.
    This should be called when new posts are added to ensure they're searchable.
    """
    try:
        data = request.get_json()
        force = data.get('force', False) if data else False
        source = data.get('source', 'database') if data else 'database'  # Can be 'database' or 'api'
        logger.info(f"Starting reindex process (force={force}, source={source})")

        if source == 'api':
            count = vector_store.index_posts_from_api(force=force)
        else:
            count = vector_store.index_posts(force=force)

        message = f"Successfully indexed {count} posts in vector store from {source}"
        logger.info(message)

        return jsonify({
            "indexed_count": count,
            "message": message,
            "source": source
        })

    except Exception as e:
        logger.error(f"Error during reindexing: {str(e)}")
        return jsonify({"error": f"Error during reindexing: {str(e)}"}), 500

if __name__ == '__main__':
    logger.info("Initializing vector store...")
    vector_store.init_store()

    logger.info("Loading chatbot...")
    chatbot.init_chatbot()

    logger.info("Starting periodic reindexing...")
    # Start periodic reindexing in a separate thread
    import threading
    def periodic_reindex():
        import time
        while True:
            try:
                # Reindex every 6 hours
                time.sleep(6 * 60 * 60)  # 6 hours in seconds
                logger.info("Starting periodic reindexing from API...")
                count = vector_store.index_posts_from_api()  # Changed to API-based indexing
                logger.info(f"Periodic reindexing completed. Indexed {count} posts from API")
            except Exception as e:
                logger.error(f"Error in periodic reindexing: {e}")

    reindex_thread = threading.Thread(target=periodic_reindex, daemon=True)
    reindex_thread.start()

    # Run Flask app
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 8000)), debug=False)
```

## Bước 6: Tạo Script Khởi Động

Tạo file `start.sh` để chạy dịch vụ trên Linux/Mac:

```bash
#!/bin/bash

# Start the chatbot service
echo "Starting PhongTro123 Chatbot Service..."

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Install dependencies if requirements.txt exists
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
fi

# Run the application
python main.py
```

Và file `start.bat` để chạy trên Windows:

```batch
@echo off
echo Starting PhongTro123 Chatbot Service...

REM Activate virtual environment if it exists
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
)

REM Install dependencies if requirements.txt exists
if exist requirements.txt (
    pip install -r requirements.txt
)

REM Run the application
python main.py

pause
```

## Bước 7: Tích Hợp Với Frontend

Tạo file ví dụ cho frontend (React) để gọi API chatbot:

```jsx
// client/src/components/ChatbotWidget.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, List, Card, Avatar, Spin } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const ChatbotWidget = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Xin chào! Tôi là trợ lý ảo của PhongTro123. Bạn cần tìm phòng trọ, nhà nguyên căn hay căn hộ nào? Hãy cho tôi biết yêu cầu của bạn!",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      // Call chatbot API
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: inputValue,
          user_id: 'current_user_id', // Replace with actual user ID
          session_id: 'current_session_id' // Replace with actual session ID
        })
      });

      const data = await response.json();

      if (data.response) {
        const botMessage = {
          id: messages.length + 2,
          text: data.response,
          sender: 'bot',
          timestamp: new Date(),
          type: data.type,
          rooms: data.rooms
        };

        setMessages(prev => [...prev, botMessage]);
      } else {
        const errorMessage = {
          id: messages.length + 2,
          text: "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.",
          sender: 'bot',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error calling chatbot API:', error);
      const errorMessage = {
        id: messages.length + 2,
        text: "Lỗi kết nối đến hệ thống. Vui lòng kiểm tra lại đường truyền.",
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <RobotOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          Trợ lý ảo PhongTro123
        </div>
      }
      style={{ width: 400, height: 600, display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}>
        <List
          dataSource={messages}
          renderItem={item => (
            <List.Item style={{ 
              justifyContent: item.sender === 'user' ? 'flex-end' : 'flex-start',
              padding: '8px 0'
            }}>
              <div style={{ 
                maxWidth: '80%', 
                display: 'flex', 
                flexDirection: item.sender === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start'
              }}>
                <Avatar 
                  icon={item.sender === 'user' ? <UserOutlined /> : <RobotOutlined />} 
                  style={{ 
                    backgroundColor: item.sender === 'user' ? '#1890ff' : '#52c41a',
                    margin: item.sender === 'user' ? '0 0 0 8px' : '0 8px 0 0'
                  }}
                />
                <div style={{
                  backgroundColor: item.sender === 'user' ? '#e6f7ff' : '#f6ffed',
                  padding: '8px 12px',
                  borderRadius: 8,
                  marginLeft: item.sender === 'user' ? 0 : 8,
                  marginRight: item.sender === 'user' ? 8 : 0,
                }}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{item.text}</div>
                  {item.rooms && item.rooms.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <strong>Phòng phù hợp:</strong>
                      {item.rooms.slice(0, 3).map((room, idx) => (
                        <div key={idx} style={{ 
                          padding: '4px 8px', 
                          backgroundColor: '#fff', 
                          border: '1px solid #ddd', 
                          borderRadius: 4, 
                          marginTop: 4 
                        }}>
                          <div><strong>{room.title}</strong></div>
                          <div>Giá: {room.price?.toLocaleString('vi-VN')}đ</div>
                          <div>Địa chỉ: {room.location}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </List.Item>
          )}
        />
        <div ref={messagesEndRef} />
      </div>
      
      <div style={{ display: 'flex', gap: 8 }}>
        <TextArea
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Nhập câu hỏi của bạn..."
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={loading}
          style={{ flex: 1 }}
        />
        <Button 
          type="primary" 
          icon={<SendOutlined />} 
          onClick={handleSend} 
          loading={loading}
          disabled={!inputValue.trim() || loading}
        >
          Gửi
        </Button>
      </div>
      
      {loading && (
        <div style={{ textAlign: 'center', padding: 8 }}>
          <Spin size="small" />
        </div>
      )}
    </Card>
  );
};

export default ChatbotWidget;
```

## Bước 8: Chạy Dịch Vụ

Để chạy dịch vụ chatbot, thực hiện các bước sau:

1. Cài đặt các thư viện cần thiết:
```bash
pip install -r requirements.txt
```

2. Thiết lập biến môi trường trong file `.env`

3. Chạy dịch vụ:
```bash
python main.py
```

Hoặc sử dụng script khởi động:
- Trên Linux/Mac: `./start.sh`
- Trên Windows: `start.bat`

## Cách Sử Dụng API

Sau khi chạy dịch vụ, bạn có thể sử dụng các endpoint sau:

### Chat với bot:
```
POST http://localhost:8000/chat
Content-Type: application/json

{
  "question": "Tôi đang tìm phòng trọ dưới 3 triệu ở quận Thanh Xuân",
  "user_id": "user123",
  "session_id": "session456"
}
```

### Kiểm tra tình trạng dịch vụ:
```
GET http://localhost:8000/health
```

### Re-index dữ liệu:
```
POST http://localhost:8000/reindex
Content-Type: application/json

{
  "force": true,
  "source": "database"
}
```

## Kết Luận

Chúng ta đã hoàn thành việc triển khai hệ thống chatbot hỗ trợ khách hàng với các tính năng:

1. Sử dụng công nghệ RAG (Retrieval Augmented Generation) để trả lời chính xác dựa trên dữ liệu bài đăng
2. Hỗ trợ tìm kiếm thông minh theo nhiều tiêu chí (giá, diện tích, địa điểm, tiện nghi)
3. Tích hợp với các mô hình ngôn ngữ lớn (OpenAI GPT hoặc Google Gemini)
4. Cơ sở dữ liệu vector để tìm kiếm tương tự hiệu quả
5. Giao diện người dùng thân thiện

Hệ thống này có thể mở rộng dễ dàng để thêm các tính năng hỗ trợ khác trong tương lai.