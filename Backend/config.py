import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration."""
    DEBUG = False
    TESTING = False
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL", "")
    
    # Clerk
    CLERK_PUBLISHABLE_KEY = os.getenv("VITE_CLERK_PUBLISHABLE_KEY", "")
    CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY", "")
    CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL", "https://closing-horse-34.clerk.accounts.dev/.well-known/jwks.json")
    
    # Email
    RESEND_API_KEY = os.getenv("RESEND", "")
    RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "noreply@avento.com")
    
    # Supabase
    SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", "")
    SUPABASE_PASSWORD = os.getenv("SUPABASE_PASSWORD", "")
    SUPABASE_PUBLISHABLE_KEY = os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY", "")
    
    # AI
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    
    # Frontend URL for CORS
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True


class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    DATABASE_URL = "postgresql://test:test@localhost:5432/avento_test"


class ProductionConfig(Config):
    """Production configuration."""
    pass


config = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
