from flask import Flask, jsonify
import sys
import logging
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from app.config import Config
from app.routes.assessment import assessment_bp

# Import db from models so it can be exported
from app.models import db

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    logger = logging.getLogger(__name__)
    
    # Initialize extensions
    db.init_app(app)
    
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    jwt = JWTManager(app)
    
    # JWT Error Handlers - MUST be inside create_app function
    @jwt.unauthorized_loader
    def unauthorized_callback(callback):
        logger.warning(f"JWT unauthorized access attempt: {callback}")
        return jsonify({'error': 'Missing or invalid token'}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(callback):
        logger.warning(f"JWT invalid token: {callback}")
        return jsonify({'error': 'Invalid token'}), 422

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        logger.info("JWT token expired")
        return jsonify({'error': 'Token has expired'}), 401
    
    # Register blueprints - ADD PDF BLUEPRINT HERE
    from app.routes.auth import auth_bp
    from app.routes.business import business_bp
    from app.routes.valuation import valuation_bp
    from app.routes.pdf import pdf_bp  # ← MOVED HERE
    from app.routes.wealth_gap import wealth_gap_bp
    from app.routes.exit_quiz import exit_quiz_bp
    from app.routes.task import task_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(business_bp)
    app.register_blueprint(valuation_bp)
    app.register_blueprint(pdf_bp)  # ← MOVED HERE
    app.register_blueprint(assessment_bp, url_prefix='/api/assessment')
    app.register_blueprint(wealth_gap_bp, url_prefix='/api/wealth-gap')
    app.register_blueprint(exit_quiz_bp, url_prefix='/api/exit-quiz')
    app.register_blueprint(task_bp)
    
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