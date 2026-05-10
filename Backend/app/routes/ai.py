from flask import Blueprint, request, jsonify
import google.generativeai as genai
from config import Config
from app.middleware.auth import require_auth
import logging

logger = logging.getLogger(__name__)

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')

# Initialize Gemini
if Config.GEMINI_API_KEY:
    genai.configure(api_key=Config.GEMINI_API_KEY)
else:
    logger.warning("GEMINI_API_KEY not found in configuration")

@ai_bp.route('/enhance-description', methods=['POST'])
@require_auth
def enhance_description():
    """Enhance an event description using Gemini AI."""
    if not Config.GEMINI_API_KEY:
        return jsonify({"error": "AI features are not configured on the server"}), 503
        
    data = request.get_json()
    if not data or not data.get('description'):
        return jsonify({"error": "Description is required"}), 400
        
    original_description = data['description']
    event_title = data.get('title', 'this event')
    
    prompt = f"""
    You are an expert event copywriter. Please improve the following event description to make it more engaging, professional, and clear. 
    Keep the core message and any important details intact. If the text is very short, expand on it slightly to sound exciting but realistic.
    Ensure the output is well-formatted and ready to be used on a landing page.
    
    IMPORTANT CONSTRAINTS:
    1. The description MUST be under 200 words.
    2. Naturally weave the event title ({event_title}) into the description.
    
    Original Description:
    {original_description}
    
    Enhanced Description:
    """
    
    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        response = model.generate_content(prompt)
        
        enhanced_text = response.text.strip()
        
        return jsonify({"enhanced_description": enhanced_text}), 200
    except Exception as e:
        logger.error(f"Gemini API error: {str(e)}")
        return jsonify({"error": "Failed to enhance description"}), 
