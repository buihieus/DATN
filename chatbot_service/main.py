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
    app.run(host='0.0.0.0', port=8000, debug=False)