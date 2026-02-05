# PhongTro123 Chatbot Service

A RAG-based chatbot service for finding rental rooms using OpenAI/Gemini and vector database integration.

## Overview

This service provides an AI-powered chatbot that can help users find rental rooms by understanding their requirements and searching through rental listings in the database. It uses Retrieval-Augmented Generation (RAG) to provide accurate and contextually relevant responses based on the available rental data.

## Architecture

- **Flask**: Web framework for building the API
- **MongoDB**: Main database for storing rental listings
- **ChromaDB**: Vector database for semantic search
- **OpenAI Embeddings API**: For generating high-quality text embeddings
- **OpenAI/Gemini**: Language models for generating responses
- **RAG System**: Combines database retrieval with AI generation

## Features

- Semantic search through rental listings
- Natural language processing for user queries
- Support for both OpenAI and Google Gemini
- Integration with MongoDB for rental data
- Vector database for efficient similarity search
- Room listing recommendations based on user requirements

## Installation

1. Navigate to the chatbot_service directory:
```bash
cd chatbot_service
```

2. The service will automatically create and use a virtual environment when you run the start script.
   Alternatively, you can set up manually:

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

3. Configure environment variables:
   - Copy `.env.example` to `.env` (though the default .env should work)
   - Update your database connection string if needed
   - Set your OpenAI API key in the `.env` file

## Configuration

Set the following environment variables in your `.env` file:

- `CONNECT_DB`: MongoDB connection string
- `OPENAI_API_KEY`: OpenAI API key (required for embeddings and LLM)
- `GOOGLE_API_KEY`: Google API key (if using Gemini instead of OpenAI)
- `USE_OPENAI`: Set to "true" to use OpenAI, "false" for Gemini
- `OPENAI_MODEL`: OpenAI model to use (default: gpt-4-turbo)
- `OPENAI_EMBEDDING_MODEL`: OpenAI embedding model (default: text-embedding-ada-002)
- `GEMINI_MODEL`: Gemini model to use (default: gemini-pro)

## Usage

1. Start the service:
```bash
# Using the start script (recommended - handles virtual environment automatically)
start.bat  # On Windows

# Or directly with Python (virtual environment must be activated)
python main.py
```

2. The API will be available at `http://localhost:8000`

## API Endpoints

- `POST /chat` - Chat with the bot
- `POST /reindex` - Reindex rental posts in vector store
- `GET /health` - Health check
- `GET /` - Root endpoint with API info

### Chat Endpoint

Request body:
```json
{
  "question": "Tôi đang tìm phòng trọ ở Hà Nội giá dưới 3 triệu",
  "user_id": "optional_user_id",
  "session_id": "optional_session_id"
}
```

Response:
```json
{
  "response": "Response text from the bot",
  "type": "text" or "show_rooms",
  "rooms": [array of room objects if type is show_rooms],
  "sources": [array of source documents used]
}
```

## Integration with Frontend

The chatbot service can be integrated with the existing frontend by updating the client-side code to call this new service instead of the old chatbot endpoint.

## Running the Service

The service will automatically:
- Connect to MongoDB on startup
- Initialize the vector store
- Load the LLM model
- Periodically reindex rental posts (every 6 hours)

To manually trigger a reindex:
```bash
curl -X POST http://localhost:8000/reindex
```

## Development

For development, you can run the service with auto-reload:
```bash
python main.py
```

## Deployment

For production deployment:
1. Use a production WSGI server like Gunicorn
2. Set proper environment variables
3. Configure reverse proxy (e.g., Nginx)
4. Set up proper logging and monitoring

## Troubleshooting

- Make sure all environment variables are properly set
- Check that MongoDB is accessible
- Verify API keys are valid
- Check logs for detailed error information

#run 
-chatbot_service\.venv\Scripts    .\Activate.ps1 
-..cd -> chatbot_service
- chatbot_service   py ./main.py