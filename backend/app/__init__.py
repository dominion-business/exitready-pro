from flask import Flask, jsonify
import sys
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from app.config import Config
from app.routes.assessment import assessment_bp

# Import db from models so it can be exported
from app.models import db

# REMOVE THESE TWO LINES FROM HERE:
# from app.routes.pdf import pdf_bp
# app.register_blueprint(pdf_bp)

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    jwt = JWTManager(app)
    
    # JWT Error Handlers - MUST be inside create_app function
    @jwt.unauthorized_loader
    def unauthorized_callback(callback):
        print(f"JWT UNAUTHORIZED: {callback}", file=sys.stderr)
        return jsonify({'error': 'Missing or invalid token'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(callback):
        print(f"JWT INVALID TOKEN: {callback}", file=sys.stderr)
        return jsonify({'error': 'Invalid token'}), 422
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        print(f"JWT EXPIRED TOKEN", file=sys.stderr)
        return jsonify({'error': 'Token has expired'}), 401
    
    # Register blueprints - ADD PDF BLUEPRINT HERE
    from app.routes.auth import auth_bp
    from app.routes.business import business_bp
    from app.routes.valuation import valuation_bp
    from app.routes.pdf import pdf_bp  # ← MOVED HERE
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(business_bp)
    app.register_blueprint(valuation_bp)
    app.register_blueprint(pdf_bp)  # ← MOVED HERE
    app.register_blueprint(assessment_bp, url_prefix='/api/assessment')
    
    # Create tables
    with app.app_context():
        db.create_all()
    
    # Root route
    @app.route('/')
    def index():
        return jsonify({
            'message': 'ExitReady API',
            'version': '1.0.0',
            'endpoints': {
                'auth': '/api/auth',
                'business': '/api/business',
                'valuation': '/api/valuation',
                'health': '/health'
            }
        })
    
    @app.route('/health')
    def health():
        return jsonify({'status': 'healthy'}), 200
    
    return app