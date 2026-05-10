import os
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"
from app import create_app

config_name = os.getenv('FLASK_ENV', 'production')
app = create_app(config_name)
