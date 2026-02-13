"""
Configuration for Blogger App
"""

import os

class Config:
    # WARNING: Change SECRET_KEY for production deployments!
    # Set the SECRET_KEY environment variable or generate a secure random key
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    # Debug mode should only be enabled in development
    DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
