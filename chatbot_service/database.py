import os
from typing import List, Dict, Any, Optional
from pymongo import MongoClient
import logging
from dotenv import load_dotenv
from bson import ObjectId

load_dotenv()

logger = logging.getLogger(__name__)

class MongoDBHandler:
    def __init__(self):
        self.client = None
        self.db = None
        self.mongo_uri = os.getenv("CONNECT_DB", os.getenv("MONGODB_URI", "mongodb://localhost:27017/phongtro"))
        self.database_name = os.getenv("DB_NAME", "phongtro")

    def connect(self):
        """Connect to MongoDB using synchronous operations"""
        try:
            self.client = MongoClient(self.mongo_uri)
            self.db = self.client[self.database_name]
            # Test the connection
            self.db.command('ping')
            logger.info("Connected to MongoDB successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            return False

    def close(self):
        """Close the MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")

    def get_all_posts(self) -> List[Dict[str, Any]]:
        """Get all active rental posts from MongoDB"""
        try:
            posts_collection = self.db.posts  # Adjust collection name as needed
            posts = list(posts_collection.find({"status": "active"}))

            # Convert ObjectId to string for each post
            for post in posts:
                post["_id"] = str(post["_id"])

            return posts
        except Exception as e:
            logger.error(f"Error fetching posts: {e}")
            return []

    def get_posts_by_ids(self, post_ids: List[str]) -> List[Dict[str, Any]]:
        """Get specific posts by their IDs"""
        try:
            posts_collection = self.db.posts
            object_ids = [ObjectId(pid) for pid in post_ids]
            posts = list(posts_collection.find({"_id": {"$in": object_ids}}))

            # Convert ObjectId to string for each post
            for post in posts:
                post["_id"] = str(post["_id"])

            return posts
        except Exception as e:
            logger.error(f"Error fetching posts by IDs: {e}")
            return []

    def get_posts_by_filters(self, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get posts based on specific filters"""
        try:
            posts_collection = self.db.posts
            posts = list(posts_collection.find(filters))

            # Convert ObjectId to string for each post
            for post in posts:
                post["_id"] = str(post["_id"])

            return posts
        except Exception as e:
            logger.error(f"Error fetching posts with filters: {e}")
            return []