import os
import logging
import time
from typing import List, Dict, Any, Optional
import openai
from openai import OpenAI
import chromadb
from chromadb.config import Settings
import numpy as np
from datetime import datetime, timedelta
import requests

logger = logging.getLogger(__name__)

class VectorStore:
    def __init__(self, db_handler = None):
        self.db_handler = db_handler
        self.client = None
        self.collection = None
        self.openai_client = None
        self.api_url = os.getenv("API_URL", "http://localhost:3000/api/get-posts")  # API endpoint to fetch data
        self.embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-ada-002")
        self.collection_name = os.getenv("VECTOR_COLLECTION_NAME", "rental_posts")

    def init_store(self):
        """Initialize the vector store and OpenAI client"""
        try:
            # Initialize OpenAI client
            openai_api_key = os.getenv("OPENAI_API_KEY")
            if not openai_api_key:
                raise Exception("OPENAI_API_KEY environment variable not set")

            self.openai_client = OpenAI(api_key=openai_api_key)

            # Initialize ChromaDB client with absolute path for Windows compatibility
            persist_path = os.path.join(os.getcwd(), "chroma_data")
            self.client = chromadb.PersistentClient(
                path=persist_path,
                settings=Settings(
                    anonymized_telemetry=False
                )
            )

            # Create or get collection
            try:
                self.collection = self.client.get_collection(self.collection_name)
                logger.info(f"Loaded existing collection: {self.collection_name}")
            except:
                self.collection = self.client.create_collection(
                    self.collection_name,
                    metadata={"hnsw:space": "cosine"}  # Use cosine similarity
                )
                logger.info(f"Created new collection: {self.collection_name}")

            logger.info(f"Using OpenAI embedding model: {self.embedding_model}")

        except Exception as e:
            logger.error(f"Error initializing vector store: {e}")
            raise

    def embed_text(self, text: str) -> List[float]:
        """Generate embedding for a text using OpenAI"""
        if not self.openai_client:
            raise Exception("OpenAI client not initialized")

        try:
            response = self.openai_client.embeddings.create(
                input=text,
                model=self.embedding_model
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            # Fallback to a simple embedding if OpenAI fails
            return self.simple_text_embedding(text)

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts using OpenAI"""
        if not self.openai_client:
            raise Exception("OpenAI client not initialized")

        try:
            response = self.openai_client.embeddings.create(
                input=texts,
                model=self.embedding_model
            )
            return [data.embedding for data in response.data]
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            # Fallback to individual embeddings if batch fails
            embeddings = []
            for text in texts:
                embedding = self.embed_text(text)
                embeddings.append(embedding)
            return embeddings

    def simple_text_embedding(self, text: str) -> List[float]:
        """Simple fallback embedding for when OpenAI is unavailable"""
        # This is a basic fallback - in production you might want to use a local model
        import hashlib
        hash_obj = hashlib.md5(text.encode())
        hex_dig = hash_obj.hexdigest()

        # Convert hex to numbers
        embedding = []
        for i in range(0, len(hex_dig), 2):
            val = int(hex_dig[i:i+2], 16)
            embedding.append(val / 255.0)  # Normalize to 0-1

        # Make sure we have 1536 dimensions (same as text-embedding-ada-002)
        while len(embedding) < 1536:
            embedding.append(0.0)
        embedding = embedding[:1536]

        return embedding

    def index_posts(self, force: bool = False) -> int:
        """Index all posts from database into vector store.
        If no database handler is available, fallback to API."""
        try:
            # If no database handler, use API instead
            if not self.db_handler:
                logger.info("No database handler found, using API to fetch posts")
                posts = self.fetch_posts_from_api()
            else:
                # Get all posts from database
                posts = self.db_handler.get_all_posts()

            if not posts:
                logger.warning("No posts found from database or API")
                return 0

            # Prepare data for indexing
            documents = []
            metadatas = []
            ids = []

            for post in posts:
                # Create combined text for embedding
                title = post.get('title', '')
                description = post.get('description', '')
                location = post.get('location', '') or (post.get('address', {}).get('fullAddress', '') if post.get('address') else '')
                price = str(post.get('price', ''))
                area = str(post.get('area', ''))
                options = ' '.join(post.get('options', [])) if isinstance(post.get('options', []), list) else str(post.get('options', ''))

                post_text = f"{title} {description} {location} {price} {area} {options}".strip()

                document_id = post.get('post_id') or post.get('_id') or str(post.get('id', ''))

                documents.append(post_text)
                metadatas.append({
                    "post_id": document_id,
                    "title": title,
                    "description": description,
                    "location": location,
                    "price": str(post.get('price', 0)),
                    "area": str(post.get('area', 0)),
                    "options": ', '.join(post.get('options', [])) if isinstance(post.get('options', []), list) else str(post.get('options', '')),
                    "phone": post.get('phone', ''),
                    "username": post.get('username', ''),
                    "category": post.get('category', ''),
                    "images": ', '.join(post.get('images', [])) if isinstance(post.get('images', []), list) else str(post.get('images', '')),
                    "user_id": post.get('user_id', post.get('userId', '')),
                    "created_at": str(post.get('createdAt', '')),
                    "updated_at": str(post.get('updatedAt', ''))
                })
                ids.append(document_id)

            # Clear collection if force is True
            if force:
                try:
                    self.client.delete_collection(self.collection_name)
                    self.collection = self.client.create_collection(
                        self.collection_name,
                        metadata={"hnsw:space": "cosine"}
                    )
                except:
                    pass  # Collection might not exist yet

            # Batch process embeddings
            batch_size = 100  # Process in batches to avoid memory issues
            total_processed = 0

            for i in range(0, len(documents), batch_size):
                batch_docs = documents[i:i+batch_size]
                batch_metas = metadatas[i:i+batch_size]
                batch_ids = ids[i:i+batch_size]

                # Generate embeddings for batch
                embeddings = self.embed_texts(batch_docs)

                # Add to collection
                self.collection.add(
                    embeddings=embeddings,
                    metadatas=batch_metas,
                    ids=batch_ids
                )

                total_processed += len(batch_docs)
                logger.info(f"Indexed batch: {total_processed}/{len(documents)} posts")

            logger.info(f"Successfully indexed {total_processed} posts in vector store")
            return total_processed

        except Exception as e:
            logger.error(f"Error indexing posts: {e}")
            raise

    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Search for relevant documents based on query"""
        try:
            if not self.collection:
                raise Exception("Vector store not initialized")

            # Generate embedding for query
            query_embedding = self.embed_text(query)

            # Search in vector store
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                include=['metadatas', 'documents', 'distances']
            )

            # Format results
            formatted_results = []
            if results['metadatas'] and results['metadatas'][0]:
                for i in range(len(results['metadatas'][0])):
                    metadata = results['metadatas'][0][i]
                    document = results['documents'][0][i] if results['documents'] and results['documents'][0] else ""
                    distance = results['distances'][0][i] if results['distances'] and results['distances'][0] else 0

                    formatted_results.append({
                        "id": metadata.get("post_id"),
                        "title": metadata.get("title", ""),
                        "description": metadata.get("description", ""),
                        "location": metadata.get("location", ""),
                        "price": metadata.get("price", 0),
                        "area": metadata.get("area", 0),
                        "options": metadata.get("options", "").split(", ") if metadata.get("options", "") else [],
                        "images": metadata.get("images", "").split(", ") if metadata.get("images", "") else [],
                        "document": document,
                        "similarity": 1 - distance,  # Convert distance to similarity
                        "metadata": metadata
                    })

            return formatted_results

        except Exception as e:
            logger.error(f"Error searching vector store: {e}")
            return []

    def get_document_by_id(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific document by ID"""
        try:
            results = self.collection.get(
                ids=[doc_id],
                include=['metadatas', 'documents']
            )

            if results['metadatas'] and len(results['metadatas']) > 0:
                metadata = results['metadatas'][0]
                document = results['documents'][0] if results['documents'] and len(results['documents']) > 0 else ""

                return {
                    "id": metadata.get("post_id"),
                    "title": metadata.get("title", ""),
                    "description": metadata.get("description", ""),
                    "location": metadata.get("location", ""),
                    "price": metadata.get("price", 0),
                    "area": metadata.get("area", 0),
                    "options": metadata.get("options", "").split(", ") if metadata.get("options", "") else [],
                    "images": metadata.get("images", "").split(", ") if metadata.get("images", "") else [],
                    "document": document,
                    "metadata": metadata
                }

            return None
        except Exception as e:
            logger.error(f"Error getting document by ID: {e}")
            return None

    def fetch_posts_from_api(self) -> List[Dict[str, Any]]:
        """Fetch posts directly from the API instead of database"""
        try:
            # Fetch posts from the API
            response = requests.get(self.api_url, params={'limit': 1000})  # Fetch up to 1000 posts
            response.raise_for_status()

            data = response.json()

            # Handle different response formats
            if 'metadata' in data and isinstance(data, dict):
                posts = data['metadata']['posts'] if 'posts' in data['metadata'] else data['metadata']
            else:
                posts = data

            if isinstance(posts, dict) and 'posts' in posts:
                posts = posts['posts']

            # Ensure posts is a list
            if not isinstance(posts, list):
                posts = []

            # Convert ObjectId to string for each post if needed
            for post in posts:
                if isinstance(post, dict):
                    if '_id' in post and isinstance(post['_id'], dict) and '$oid' in post['_id']:
                        # Handle MongoDB ObjectID format if needed
                        post['post_id'] = post['_id']['$oid']
                    elif '_id' in post:
                        post['post_id'] = str(post['_id'])
                    else:
                        post['post_id'] = str(post.get('id', ''))

            logger.info(f"Fetched {len(posts)} posts from API")
            return posts
        except Exception as e:
            logger.error(f"Error fetching posts from API: {e}")
            return []

    def index_posts_from_api(self, force: bool = False) -> int:
        """Index all posts fetched from API into vector store"""
        try:
            # Get all posts from API
            posts = self.fetch_posts_from_api()

            if not posts:
                logger.warning("No posts found from API")
                return 0

            # Prepare data for indexing
            documents = []
            metadatas = []
            ids = []

            for post in posts:
                # Create combined text for embedding
                title = post.get('title', '')
                description = post.get('description', '')
                location = post.get('location', '') or (post.get('address', {}).get('fullAddress', '') if post.get('address') else '')
                price = str(post.get('price', ''))
                area = str(post.get('area', ''))
                options = ' '.join(post.get('options', [])) if isinstance(post.get('options', []), list) else str(post.get('options', ''))

                post_text = f"{title} {description} {location} {price} {area} {options}".strip()

                document_id = post.get('post_id') or post.get('_id') or str(post.get('id', ''))

                documents.append(post_text)
                metadatas.append({
                    "post_id": document_id,
                    "title": title,
                    "description": description,
                    "location": location,
                    "price": str(post.get('price', 0)),
                    "area": str(post.get('area', 0)),
                    "options": ', '.join(post.get('options', [])) if isinstance(post.get('options', []), list) else str(post.get('options', '')),
                    "phone": post.get('phone', ''),
                    "username": post.get('username', ''),
                    "category": post.get('category', ''),
                    "images": ', '.join(post.get('images', [])) if isinstance(post.get('images', []), list) else str(post.get('images', '')),
                    "user_id": post.get('user_id', post.get('userId', '')),
                    "created_at": str(post.get('createdAt', '')),
                    "updated_at": str(post.get('updatedAt', ''))
                })
                ids.append(document_id)

            # Clear collection if force is True
            if force:
                try:
                    self.client.delete_collection(self.collection_name)
                    self.collection = self.client.create_collection(
                        self.collection_name,
                        metadata={"hnsw:space": "cosine"}
                    )
                except:
                    pass  # Collection might not exist yet

            # Batch process embeddings
            batch_size = 100  # Process in batches to avoid memory issues
            total_processed = 0

            for i in range(0, len(documents), batch_size):
                batch_docs = documents[i:i+batch_size]
                batch_metas = metadatas[i:i+batch_size]
                batch_ids = ids[i:i+batch_size]

                # Generate embeddings for batch
                embeddings = self.embed_texts(batch_docs)

                # Add to collection
                self.collection.add(
                    embeddings=embeddings,
                    metadatas=batch_metas,
                    ids=batch_ids
                )

                total_processed += len(batch_docs)
                logger.info(f"Indexed batch from API: {total_processed}/{len(documents)} posts")

            logger.info(f"Successfully indexed {total_processed} posts from API into vector store")
            return total_processed

        except Exception as e:
            logger.error(f"Error indexing posts from API: {e}")
            raise