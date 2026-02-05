#!/usr/bin/env python3
"""
Debug script to check the vector database and test the chatbot functionality
"""

import os
import sys
import logging
from dotenv import load_dotenv
from vector_store import VectorStore
from chatbot import ChatBot

# Load environment variables from .env file
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def debug_vector_store():
    """Debug the vector store functionality"""
    print("\nDebugging Vector Store...")
    print("="*50)

    try:
        vector_store = VectorStore()
        vector_store.init_store()

        # Check collection info
        collection = vector_store.collection
        count = collection.count()
        print(f"Collection name: {vector_store.collection_name}")
        print(f"Number of documents: {count}")

        if count > 0:
            print(f"Vector database has {count} documents")

            # Test search with a sample query
            sample_queries = [
                "phòng trọ giá rẻ",
                "cho thuê phòng",
                "phòng gần đại học",
                "tìm trọ"
            ]

            print(f"\nTesting search functionality:")
            for query in sample_queries:
                print(f"\nSearching for: '{query}'")
                results = vector_store.search(query, top_k=3)

                if results:
                    print(f"  Found {len(results)} results:")
                    for i, result in enumerate(results[:2]):  # Show first 2 results
                        print(f"    {i+1}. {result['title'][:50]}... (similarity: {result['similarity']:.2f})")
                        print(f"       Location: {result['location'][:30]}... | Price: {result['price']}")
                else:
                    print(f"  No results found for '{query}'")
        else:
            print(f"Vector database is empty - run --populate first")

    except Exception as e:
        logger.error(f"Error debugging vector store: {e}")
        print(f"Error: {e}")

def debug_chatbot():
    """Debug the chatbot functionality"""
    print("\nDebugging ChatBot...")
    print("="*50)

    try:
        vector_store = VectorStore()
        vector_store.init_store()

        chatbot = ChatBot(vector_store)
        chatbot.init_chatbot()

        print(f"Chatbot initialized successfully")
        print(f"Using LLM: {'OpenAI' if chatbot.use_openai else 'Gemini'}")
        print(f"Model: {chatbot.model}")

        # Test sample questions
        test_questions = [
            "Tôi muốn tìm phòng trọ giá rẻ",
            "Có phòng trọ nào gần đại học không?",
            "Tìm giúp tôi phòng ở quận 1",
            "Cho tôi biết các phòng trọ có máy lạnh"
        ]

        print(f"\nTesting chatbot responses:")
        for question in test_questions:
            print(f"\nQuestion: '{question}'")
            response = chatbot.process_question(question)

            print(f"Response type: {response['type']}")
            print(f"Response preview: {response['response'][:200]}...")

            if response['rooms']:
                print(f"Number of rooms returned: {len(response['rooms'])}")
                for i, room in enumerate(response['rooms'][:2]):  # Show first 2 rooms
                    print(f"  {i+1}. {room['title'][:50]}...")
                    print(f"     Location: {room['location'][:30]}... | Price: {room['price']}")
            else:
                print(f"No room results returned")

    except Exception as e:
        logger.error(f"Error debugging chatbot: {e}")
        print(f"Error: {e}")

def print_usage():
    """Print usage instructions"""
    print("\nUsage:")
    print("======")
    print("python debug_chatbot_db.py                    # Check vector database and chatbot functionality")
    print("python debug_chatbot_db.py --vector-only      # Debug only vector store")
    print("python debug_chatbot_db.py --chatbot-only     # Debug only chatbot")
    print("python debug_chatbot_db.py --help             # Show this help message")
    
    print("\nThis script will:")
    print("- Connect to the vector database")
    print("- Check if documents exist")
    print("- Test search functionality")
    print("- Test chatbot responses")
    print("- Provide debugging information")

if __name__ == "__main__":
    # Check if required environment variables are set
    if not os.getenv("OPENAI_API_KEY"):
        print("Warning: OPENAI_API_KEY environment variable not set")
        print("   This script may not work properly without an API key")
    
    # Parse command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] in ['-h', '--help', 'help']:
            print_usage()
        elif sys.argv[1] == '--vector-only':
            debug_vector_store()
        elif sys.argv[1] == '--chatbot-only':
            debug_chatbot()
        else:
            print(f"Unknown argument: {sys.argv[1]}")
            print_usage()
    else:
        debug_vector_store()
        debug_chatbot()