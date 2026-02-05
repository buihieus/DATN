
#!/usr/bin/env python3
"""
Script to check if the vector database has data
"""

import os
import sys
import logging
from dotenv import load_dotenv
from vector_store import VectorStore

# Load environment variables from .env file
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def check_vector_database():
    """Check if the vector database has data"""
    try:
        # Initialize the vector store
        vector_store = VectorStore()
        vector_store.init_store()

        # Get collection info
        collection = vector_store.collection
        count = collection.count()

        print(f"\nVector Database Status:")
        print(f"===========================")
        print(f"Collection name: {vector_store.collection_name}")
        print(f"Number of documents: {count}")
        print(f"Embedding model: {vector_store.embedding_model}")

        if count > 0:
            print(f"Database has data!")

            # Get sample of documents to see what's in there
            print(f"\nSample of first 5 documents:")
            print(f"------------------------------")

            # Perform a simple search to get some sample documents
            sample_results = collection.get(limit=5, include=['metadatas', 'documents'])

            if sample_results['metadatas']:
                for i, metadata in enumerate(sample_results['metadatas']):
                    print(f"\nDocument {i+1}:")
                    print(f"  ID: {metadata.get('post_id', 'Unknown')}")
                    print(f"  Title: {metadata.get('title', 'No title')[:50]}...")
                    print(f"  Location: {metadata.get('location', 'No location')}")
                    print(f"  Price: {metadata.get('price', 'No price')}")
                    print(f"  Area: {metadata.get('area', 'No area')}")
            else:
                print("No sample documents could be retrieved")

        else:
            print(f"Database is empty!")
            print(f"\nHint: You might need to run the indexing process to populate the database.")
            print(f"   You can run: python -c \"from vector_store import VectorStore; vs = VectorStore(); vs.init_store(); vs.index_posts_from_api()\"")

        return count

    except Exception as e:
        logger.error(f"Error checking vector database: {e}")
        print(f"Error: {e}")
        return None

def print_usage():
    """Print usage instructions"""
    print("\nUsage:")
    print("======")
    print("python check_vector_db.py                    # Check vector database status")
    print("python check_vector_db.py --populate         # Populate vector database from API")
    print("python check_vector_db.py --force-populate   # Force repopulate vector database")
    print("python check_vector_db.py --help             # Show this help message")
    print("\nThis script will:")
    print("- Connect to the vector database")
    print("- Count the number of documents")
    print("- Show a sample of the data if available")
    print("- Provide information about the database status")

def populate_vector_database(force=False):
    """Populate the vector database with data from API"""
    try:
        # Initialize the vector store
        vector_store = VectorStore()
        vector_store.init_store()

        print(f"Populating vector database from API...")
        print(f"API URL: {vector_store.api_url}")

        # Index posts from API
        count = vector_store.index_posts_from_api(force=force)

        print(f"\nSuccess! Added {count} documents to the vector database")

        # Check the new status
        new_count = vector_store.collection.count()
        print(f"New total document count: {new_count}")

        return count

    except Exception as e:
        logger.error(f"Error populating vector database: {e}")
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    # Check if required environment variables are set
    if not os.getenv("OPENAI_API_KEY"):
        print("Warning: OPENAI_API_KEY environment variable not set")
        print("   This script may not work properly without an API key")
        print("   Set the environment variable in .env file")

    # Parse command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] in ['-h', '--help', 'help']:
            print_usage()
        elif sys.argv[1] == '--populate':
            print("Populating vector database from API...")
            populate_vector_database(force=False)
        elif sys.argv[1] == '--force-populate':
            print("Force repopulating vector database from API...")
            populate_vector_database(force=True)
        else:
            print(f"Unknown argument: {sys.argv[1]}")
            print_usage()
    else:
        check_vector_database()