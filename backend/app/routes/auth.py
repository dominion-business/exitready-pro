from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import sys

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    print("\n" + "="*50, file=sys.stderr)
    print("REGISTER ENDPOINT HIT", file=sys.stderr)
    
    try:
        from app.models import db
        from app.models.user import User
        from werkzeug.security import generate_password_hash
        
        data = request.get_json()
        print(f"Received data: {data}", file=sys.stderr)
        
        if not data:
            print("ERROR: No JSON data received", file=sys.stderr)
            return jsonify({'error': 'No data provided'}), 400
        
        email = data.get('email')
        password = data.get('password')
        full_name = data.get('full_name') or data.get('fullName') or data.get('name') or ''
        
        print(f"Email: {email}", file=sys.stderr)
        print(f"Password: {'*' * len(password) if password else 'None'}", file=sys.stderr)
        print(f"Full name: {full_name}", file=sys.stderr)
        
        if not email:
            print("ERROR: Email missing", file=sys.stderr)
            return jsonify({'error': 'Email is required'}), 400
        
        if not password:
            print("ERROR: Password missing", file=sys.stderr)
            return jsonify({'error': 'Password is required'}), 400
        
        # Check if user exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            print(f"ERROR: User {email} already exists", file=sys.stderr)
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create user
        print("Creating new user...", file=sys.stderr)
        user = User(email=email, full_name=full_name)
        user.password_hash = generate_password_hash(password)
        
        db.session.add(user)
        db.session.commit()
        print(f"User created successfully with ID: {user.id}", file=sys.stderr)
        
        # Create token
        access_token = create_access_token(identity=str(user.id))
        
        print("Registration successful!", file=sys.stderr)
        print("="*50 + "\n", file=sys.stderr)
        
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
        print(f"EXCEPTION: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        print("="*50 + "\n", file=sys.stderr)
        
        from app.models import db
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    print("\n" + "="*50, file=sys.stderr)
    print("LOGIN ENDPOINT HIT", file=sys.stderr)
    
    try:
        from app.models import db
        from app.models.user import User
        from werkzeug.security import check_password_hash
        
        data = request.get_json()
        print(f"Login attempt for: {data.get('email')}", file=sys.stderr)
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            print("ERROR: Missing email or password", file=sys.stderr)
            return jsonify({'error': 'Email and password required'}), 400
        
        # Find user
        user = User.query.filter_by(email=email).first()
        
        if not user:
            print(f"ERROR: User {email} not found", file=sys.stderr)
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Check password
        if not check_password_hash(user.password_hash, password):
            print("ERROR: Invalid password", file=sys.stderr)
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Create token
        access_token = create_access_token(identity=str(user.id))
        
        print(f"Login successful for user ID: {user.id}", file=sys.stderr)
        print("="*50 + "\n", file=sys.stderr)
        
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
        print(f"LOGIN EXCEPTION: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        print("="*50 + "\n", file=sys.stderr)
        return jsonify({'error': 'Login failed'}), 500