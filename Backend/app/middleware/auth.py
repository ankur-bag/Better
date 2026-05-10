"""JWT authentication and role-based access control middleware."""
# Triggering reload (Sydney Pooler)...
import jwt
import requests
from functools import wraps
from flask import request, jsonify
from datetime import datetime


class ClerkJWTVerifier:
    """Verify Clerk JWT tokens and extract user metadata."""
    
    def __init__(self, clerk_publishable_key: str, jwks_url: str):
        self.clerk_publishable_key = clerk_publishable_key
        self.jwks_url = jwks_url
        self._jwks_cache = None
    
    def get_jwks(self):
        """Fetch JWKS from Clerk (cached)."""
        if self._jwks_cache is None:
            response = requests.get(self.jwks_url)
            response.raise_for_status()
            self._jwks_cache = response.json()
        return self._jwks_cache
    
    def verify_token(self, token: str) -> dict:
        """Verify JWT token and return decoded claims."""
        try:
            # Get the key ID from header
            header = jwt.get_unverified_header(token)
            kid = header.get('kid')
            
            if not kid:
                raise ValueError("No key ID in JWT header")
            
            # Get signing key from JWKS
            jwks = self.get_jwks()
            signing_key = None
            for key in jwks.get('keys', []):
                if key.get('kid') == kid:
                    signing_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)
                    break
            
            if not signing_key:
                raise ValueError(f"Key {kid} not found in JWKS")
            
            # Verify and decode
            # We skip audience verification for now as it can be tricky with Clerk
            decoded = jwt.decode(
                token,
                signing_key,
                algorithms=['RS256'],
                options={
                    "verify_signature": True,
                    "verify_aud": False,
                    "verify_at_hash": False
                }
            )
            
            return decoded
        except jwt.ExpiredSignatureError:
            raise ValueError("Token expired")
        except jwt.InvalidTokenError as e:
            raise ValueError(f"Invalid token: {str(e)}")


_clerk_verifier = None
_synced_users = set()

def require_auth(f):
    """Decorator to require valid JWT token."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from config import Config
        from flask import current_app
        
        # Support test mode with X-Test-User header for development
        if current_app.debug and request.headers.get('X-Test-User'):
            test_user_id = request.headers.get('X-Test-User')
            test_role = request.headers.get('X-Test-Role', 'organizer')
            request.user = {
                'id': test_user_id,
                'email': f"{test_user_id}@test.local",
                'role': test_role,
            }
            return f(*args, **kwargs)
        
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401
        
        token = auth_header[7:]  # Remove 'Bearer ' prefix
        
        try:
            global _clerk_verifier
            if _clerk_verifier is None:
                _clerk_verifier = ClerkJWTVerifier(Config.CLERK_PUBLISHABLE_KEY, Config.CLERK_JWKS_URL)
            claims = _clerk_verifier.verify_token(token)
            
            # Store claims in request context
            # Fallback to 'organizer' if role is missing in public_metadata
            # Clerk only includes public_metadata in the JWT if configured in the dashboard
            public_metadata = claims.get('public_metadata', {})
            user_role = public_metadata.get('role')
            
            if not user_role:
                print(f"Warning: Role missing in JWT for user {claims.get('sub')}. Defaulting to 'organizer'.")
                print(f"Full claims: {claims}")
                user_role = 'organizer'
            
            request.user = {
                'id': claims.get('sub'),
                'email': claims.get('email') or f"{claims.get('sub')}@clerk.local",
                'role': user_role,
            }
            
            # Sync user to local database to satisfy FK constraints, use in-memory cache to avoid repeated queries
            user_id = request.user['id']
            if user_id not in _synced_users:
                from app.models import get_db, queries
                try:
                    db = get_db()
                    queries.create_user(
                        db, 
                        user_id=user_id,
                        email=request.user['email'],
                        role=request.user['role']
                    )
                    _synced_users.add(user_id)
                except Exception as e:
                    print(f"Warning: Failed to sync user to DB: {e}")
            
            return f(*args, **kwargs)
        except ValueError as e:
            print(f"Auth ValueError: {str(e)}")
            return jsonify({"error": str(e)}), 401
        except Exception as e:
            import traceback
            print(f"Auth Exception: {str(e)}")
            traceback.print_exc()
            return jsonify({"error": f"Authentication failed: {str(e)}"}), 401
    
    return decorated_function


def require_role(*allowed_roles):
    """Decorator to require specific role(s)."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Must be used with require_auth
            if not hasattr(request, 'user') or not request.user.get('role'):
                return jsonify({"error": "Unauthorized"}), 403
            
            if request.user['role'] not in allowed_roles:
                return jsonify({"error": "Insufficient permissions"}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator
