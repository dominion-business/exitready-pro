from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import logging

logger = logging.getLogger(__name__)
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    logger.info("Register endpoint called")

    try:
        from app.models import db
        from app.models.user import User
        from werkzeug.security import generate_password_hash

        data = request.get_json()

        if not data:
            logger.error("No JSON data received in registration request")
            return jsonify({'error': 'No data provided'}), 400

        email = data.get('email')
        password = data.get('password')
        full_name = data.get('full_name') or data.get('fullName') or data.get('name') or ''

        logger.info(f"Registration attempt for email: {email}")

        if not email:
            logger.warning("Registration failed: Email missing")
            return jsonify({'error': 'Email is required'}), 400

        if not password:
            logger.warning("Registration failed: Password missing")
            return jsonify({'error': 'Password is required'}), 400

        # Check if user exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            logger.warning(f"Registration failed: User {email} already exists")
            return jsonify({'error': 'Email already registered'}), 400

        # Create user
        user = User(email=email, full_name=full_name)
        user.password_hash = generate_password_hash(password)

        db.session.add(user)
        db.session.commit()
        logger.info(f"User registered successfully with ID: {user.id}")

        # Create token
        access_token = create_access_token(identity=str(user.id))

        return jsonify({
            'message': 'User created successfully',
            'access_token': access_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'subscription_tier': getattr(user, 'subscription_tier', 'free')
            }
        }), 201

    except Exception as e:
        logger.error(f"Registration exception: {str(e)}", exc_info=True)
        from app.models import db
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    logger.info("Login endpoint called")

    try:
        from app.models import db
        from app.models.user import User
        from werkzeug.security import check_password_hash

        data = request.get_json()

        if not data:
            logger.warning("Login failed: No data provided")
            return jsonify({'error': 'No data provided'}), 400

        email = data.get('email')
        password = data.get('password')

        logger.info(f"Login attempt for email: {email}")

        if not email or not password:
            logger.warning("Login failed: Missing email or password")
            return jsonify({'error': 'Email and password required'}), 400

        # Find user
        user = User.query.filter_by(email=email).first()

        if not user:
            logger.warning(f"Login failed: User {email} not found")
            return jsonify({'error': 'Invalid email or password'}), 401

        # Check password
        if not check_password_hash(user.password_hash, password):
            logger.warning(f"Login failed: Invalid password for {email}")
            return jsonify({'error': 'Invalid email or password'}), 401

        # Create token
        access_token = create_access_token(identity=str(user.id))

        logger.info(f"Login successful for user ID: {user.id}")

        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'subscription_tier': getattr(user, 'subscription_tier', 'free')
            }
        }), 200

    except Exception as e:
        logger.error(f"Login exception: {str(e)}", exc_info=True)
        return jsonify({'error': 'Login failed'}), 500
