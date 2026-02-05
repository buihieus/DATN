#!/usr/bin/env python3
"""
Test script to confirm vector database persistence and functionality
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

def test_vector_store_persistence():
    """Test vector store persistence"""
    print("\nTesting Vector Store Persistence...")
    print("="*50)
    
    try:
        vector_store = VectorStore()
        vector_store.init_store()
        
        # Check collection info
        collection = vector_store.collection
        count = collection.count()
        print(f"Initial count: {count}")
        print(f"Collection name: {vector_store.collection_name}")
        print(f"Persist directory: {vector_store.client._settings.persist_directory}")
        
        # If count is 0, try to populate
        if count == 0:
            print("No documents found. Attempting to populate from API...")
            populated_count = vector_store.index_posts_from_api()
            print(f"Populated {populated_count} documents")
            
            # Check count after population
            new_count = collection.count()
            print(f"New count after population: {new_count}")
        else:
            print(f"Database already has {count} documents")
            
        # Test search
        print(f"\nTesting search functionality:")
        test_query = "phòng trọ"
        results = vector_store.search(test_query, top_k=3)
        
        print(f"Search results for '{test_query}': {len(results)} found")
        for i, result in enumerate(results):
            print(f"  {i+1}. {result['title'][:60]}...")
            print(f"     Location: {result['location'][:30]} | Price: {result['price']}")
            
        return count
        
    except Exception as e:
        logger.error(f"Error testing vector store: {e}")
        print(f"Error: {e}")
        return None

def test_same_instance():
    """Test that data persists in the same run"""
    print("\nTesting same-instance persistence...")
    print("="*30)
    
    vector_store = VectorStore()
    vector_store.init_store()
    
    # Check initial count
    count1 = vector_store.collection.count()
    print(f"Count before population: {count1}")
    
    if count1 == 0:
        # Populate
        populated = vector_store.index_posts_from_api()
        print(f"Populated: {populated}")
    
    # Check count after populate
    count2 = vector_store.collection.count()
    print(f"Count after population: {count2}")
    
    # Search to confirm data is there
    results = vector_store.search("phòng trọ", top_k=2)
    print(f"Search results: {len(results)}")
    
    return count2

if __name__ == "__main__":
    test_same_instance()
    test_vector_store_persistence()