"""Flask application factory."""
from flask import Flask
from flask_cors import CORS


def create_app(config_name='development'):
    """Create and configure Flask application."""
    from config import config
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Enable CORS for frontend
    origins = [
        app.config.get("FRONTEND_URL"),
        "http://localhost:5173",
        "http://localhost:3000",
        "https://better-avento.vercel.app"
    ]
    CORS(app, resources={r"/api/*": {"origins": [o for o in origins if o]}})
    
    # Register blueprints
    from app.routes import events, registrations, templates
    app.register_blueprint(events.bp)
    app.register_blueprint(registrations.bp)
    app.register_blueprint(templates.templates_bp)
    
    # Root route
    @app.route('/', methods=['GET'])
    def index():
        return {"message": "Avento API is running", "docs": "/api/health"}, 200

    # Health check route
    @app.route('/api/health', methods=['GET'])
    def health():
        return {"status": "ok"}, 200
    
    return app
