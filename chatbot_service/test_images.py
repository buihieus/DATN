#!/usr/bin/env python3
"""
Test script to verify that the chatbot returns room data with images properly formatted
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from vector_store import VectorStore
from chatbot import ChatBot

def test_image_formatting():
    """Test that images are properly formatted in room responses"""
    print("Testing image formatting in chatbot responses...")
    
    # Initialize vector store and chatbot
    vector_store = VectorStore()
    vector_store.init_store()
    
    chatbot = ChatBot(vector_store)
    chatbot.init_chatbot()
    
    # Test getting a document by ID to see if images are formatted correctly
    # First, let's get a sample document from the collection
    try:
        # Get all documents to pick one for testing
        all_docs = vector_store.collection.get(limit=1)
        
        if all_docs and 'ids' in all_docs and all_docs['ids']:
            sample_id = all_docs['ids'][0] if all_docs['ids'] else None
            
            if sample_id:
                # Test the _format_room_for_response method
                doc = vector_store.get_document_by_id(sample_id)
                
                if doc:
                    print(f"Document ID: {doc['id']}")
                    print(f"Title: {doc['title']}")
                    print(f"Images (raw from metadata): {doc['metadata'].get('images', 'None')}")
                    
                    # Test our formatting method
                    formatted_room = chatbot._format_room_for_response(doc)
                    print(f"Formatted room images: {formatted_room.get('images', 'None')}")
                    
                    # Test the _format_room_response method
                    sample_rooms_data = {
                        "message": "Test message",
                        "roomIds": [sample_id]
                    }
                    
                    # Simulate the response format
                    import json
                    mock_response = f"Test response __SHOW_ROOMS__::{json.dumps(sample_rooms_data)}"
                    formatted_response = chatbot._format_room_response(mock_response, [doc])
                    
                    if formatted_response['rooms']:
                        room_with_images = formatted_response['rooms'][0]
                        print(f"Room with images from _format_room_response: {room_with_images.get('images', 'None')}")
                        
                        if 'images' in room_with_images and room_with_images['images']:
                            print("✅ SUCCESS: Images are properly formatted in room responses!")
                            return True
                        else:
                            print("❌ FAILED: Images are not properly formatted in room responses!")
                            return False
                    else:
                        print("❌ FAILED: No rooms returned from _format_room_response!")
                        return False
                else:
                    print("❌ FAILED: Could not get sample document!")
                    return False
            else:
                print("❌ FAILED: No documents found in vector store!")
                return False
        else:
            print("❌ FAILED: Could not retrieve documents from vector store!")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_image_formatting()
    if success:
        print("\n🎉 All tests passed! The image formatting is working correctly.")
    else:
        print("\n💥 Some tests failed! Please check the implementation.")
        sys.exit(1)