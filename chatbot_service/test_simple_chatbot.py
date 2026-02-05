#!/usr/bin/env python3
"""
Test script for the simplified chatbot with multiple queries
"""

import os
import logging
from dotenv import load_dotenv
from vector_store import VectorStore
from simple_chatbot import SimpleChatBot

# Load environment variables from .env file
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_chatbot():
    """Test the chatbot with different queries"""
    print("Testing Simple ChatBot with multiple queries")
    print("="*50)
    
    # Initialize vector store
    vector_store = VectorStore()
    vector_store.init_store()
    
    # Initialize chatbot
    chatbot = SimpleChatBot(vector_store)
    chatbot.init_chatbot()
    
    # Different test questions
    test_questions = [
        "Toi muon tim phong tro gia re",
        "Tim phong co may lanh",
        "Co phong o quan 1 khong",
        "Phong moi co noi that"
    ]
    
    for i, question in enumerate(test_questions, 1):
        print(f"\nTest {i}: {question}")
        response = chatbot.process_question(question)
        print(f"Response type: {response['type']}")
        if response['rooms']:
            print(f"Rooms returned: {len(response['rooms'])}")
            for j, room in enumerate(response['rooms'][:2]):
                # Handle Unicode by encoding to ASCII with replacement
                title = room['title'][:50].encode('ascii', 'replace').decode('ascii')
                location = room['location'][:30].encode('ascii', 'replace').decode('ascii') 
                print(f"  {j+1}. Title: {title}...")
                print(f"     Location: {location} | Price: {room['price']}")
        else:
            print("No rooms returned")

if __name__ == "__main__":
    test_chatbot()