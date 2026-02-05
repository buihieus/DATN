#!/usr/bin/env python3
"""
Unit test to verify that the image parsing logic works correctly
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from chatbot import ChatBot
from vector_store import VectorStore

def test_image_parsing():
    """Test that images are properly parsed from metadata"""
    print("Testing image parsing logic...")
    
    # Create a mock vector store and chatbot (without initializing external services)
    vector_store = VectorStore()
    chatbot = ChatBot(vector_store)
    
    # Test case 1: Document with images in metadata as comma-separated string
    mock_doc_with_images = {
        "id": "test_id_1",
        "title": "Test Room",
        "description": "Test Description",
        "location": "Test Location",
        "price": "2000000",
        "area": "25",
        "options": ["wifi", "air conditioning"],
        "document": "test document",
        "similarity": 0.9,
        "metadata": {
            "post_id": "test_id_1",
            "title": "Test Room",
            "description": "Test Description",
            "location": "Test Location",
            "price": "2000000",
            "area": "25",
            "options": "wifi, air conditioning",
            "phone": "0123456789",
            "username": "test_user",
            "category": "phong-tro",
            "images": "https://example.com/image1.jpg, https://example.com/image2.jpg, https://example.com/image3.jpg",  # comma-separated
            "user_id": "user123",
            "created_at": "2023-01-01"
        }
    }
    
    # Test the _format_room_for_response method
    formatted_room = chatbot._format_room_for_response(mock_doc_with_images)
    
    print(f"Input images string: {mock_doc_with_images['metadata']['images']}")
    print(f"Parsed images: {formatted_room['images']}")
    
    expected_images = [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg", 
        "https://example.com/image3.jpg"
    ]
    
    if formatted_room['images'] == expected_images:
        print("[PASS] Test 1 PASSED: Images properly parsed from comma-separated string")
        test1_passed = True
    else:
        print(f"[FAIL] Test 1 FAILED: Expected {expected_images}, got {formatted_room['images']}")
        test1_passed = False
    
    # Test case 2: Document with empty images string
    mock_doc_no_images = {
        "id": "test_id_2",
        "title": "Test Room 2",
        "description": "Test Description 2",
        "location": "Test Location 2",
        "price": "3000000",
        "area": "30",
        "options": ["parking"],
        "document": "test document 2",
        "similarity": 0.8,
        "metadata": {
            "post_id": "test_id_2",
            "title": "Test Room 2",
            "description": "Test Description 2",
            "location": "Test Location 2",
            "price": "3000000",
            "area": "30",
            "options": "parking",
            "phone": "0987654321",
            "username": "test_user_2",
            "category": "nha-nguyen-can",
            "images": "",  # empty string
            "user_id": "user456",
            "created_at": "2023-01-02"
        }
    }
    
    formatted_room_no_images = chatbot._format_room_for_response(mock_doc_no_images)
    
    print(f"\nInput images string: '{mock_doc_no_images['metadata']['images']}'")
    print(f"Parsed images: {formatted_room_no_images['images']}")
    
    if formatted_room_no_images['images'] == []:
        print("[PASS] Test 2 PASSED: Empty images string properly handled")
        test2_passed = True
    else:
        print(f"[FAIL] Test 2 FAILED: Expected [], got {formatted_room_no_images['images']}")
        test2_passed = False

    # Test case 3: Document with no images key in metadata
    mock_doc_missing_images = {
        "id": "test_id_3",
        "title": "Test Room 3",
        "description": "Test Description 3",
        "location": "Test Location 3",
        "price": "4000000",
        "area": "35",
        "options": ["balcony"],
        "document": "test document 3",
        "similarity": 0.7,
        "metadata": {
            "post_id": "test_id_3",
            "title": "Test Room 3",
            "description": "Test Description 3",
            "location": "Test Location 3",
            "price": "4000000",
            "area": "35",
            "options": "balcony",
            "phone": "0654321987",
            "username": "test_user_3",
            "category": "can-ho-chung-cu",
            # No images key
            "user_id": "user789",
            "created_at": "2023-01-03"
        }
    }

    formatted_room_missing_images = chatbot._format_room_for_response(mock_doc_missing_images)

    print(f"\nInput images key: 'missing'")
    print(f"Parsed images: {formatted_room_missing_images['images']}")

    if formatted_room_missing_images['images'] == []:
        print("[PASS] Test 3 PASSED: Missing images key properly handled")
        test3_passed = True
    else:
        print(f"[FAIL] Test 3 FAILED: Expected [], got {formatted_room_missing_images['images']}")
        test3_passed = False

    # Test case 4: Document with extra whitespace in images string
    mock_doc_whitespace = {
        "id": "test_id_4",
        "title": "Test Room 4",
        "description": "Test Description 4",
        "location": "Test Location 4",
        "price": "2500000",
        "area": "28",
        "options": ["furnished"],
        "document": "test document 4",
        "similarity": 0.85,
        "metadata": {
            "post_id": "test_id_4",
            "title": "Test Room 4",
            "description": "Test Description 4",
            "location": "Test Location 4",
            "price": "2500000",
            "area": "28",
            "options": "furnished",
            "phone": "0112233445",
            "username": "test_user_4",
            "category": "o-ghep",
            "images": "  https://example.com/image1.jpg  ,  https://example.com/image2.jpg  ,  ",  # with whitespace
            "user_id": "user101",
            "created_at": "2023-01-04"
        }
    }

    formatted_room_whitespace = chatbot._format_room_for_response(mock_doc_whitespace)

    print(f"\nInput images string: '{mock_doc_whitespace['metadata']['images']}'")
    print(f"Parsed images: {formatted_room_whitespace['images']}")

    expected_whitespace_images = [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg"
    ]  # Note: trailing empty string after last comma should be removed

    if formatted_room_whitespace['images'] == expected_whitespace_images:
        print("[PASS] Test 4 PASSED: Images with whitespace properly handled")
        test4_passed = True
    else:
        print(f"[FAIL] Test 4 FAILED: Expected {expected_whitespace_images}, got {formatted_room_whitespace['images']}")
        test4_passed = False

    all_tests_passed = test1_passed and test2_passed and test3_passed and test4_passed

    if all_tests_passed:
        print("\n[PASS] All image parsing tests passed! The implementation is working correctly.")
    else:
        print("\n[FAIL] Some tests failed! Please check the implementation.")

    return all_tests_passed

if __name__ == "__main__":
    success = test_image_parsing()
    if not success:
        sys.exit(1)