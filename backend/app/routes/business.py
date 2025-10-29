from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import sys
import json

business_bp = Blueprint('business', __name__, url_prefix='/api/business')

@business_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    print("\n" + "="*50, file=sys.stderr)
    print("GET BUSINESS PROFILE", file=sys.stderr)
    try:
        from app.models import db
        from app.models.business import Business

        user_id = int(get_jwt_identity())
        print(f"User ID: {user_id}", file=sys.stderr)

        business = Business.query.filter_by(user_id=user_id).first()

        if not business:
            print("No business found", file=sys.stderr)
            return jsonify({'success': False, 'error': 'No business profile found'}), 404

        print("Business found!", file=sys.stderr)
        profile_dict = business.to_dict()
        
        # Parse owners if stored as JSON string
        if 'owners' in profile_dict and isinstance(profile_dict['owners'], str):
            try:
                profile_dict['owners'] = json.loads(profile_dict['owners'])
            except:
                profile_dict['owners'] = []
        
        print("="*50 + "\n", file=sys.stderr)
        return jsonify({'success': True, 'profile': profile_dict}), 200

    except Exception as e:
        print(f"GET EXCEPTION: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        print("="*50 + "\n", file=sys.stderr)
        return jsonify({'success': False, 'error': str(e)}), 500


@business_bp.route('/profile', methods=['POST', 'PUT'])
@jwt_required()
def save_profile():
    print("\n" + "="*50, file=sys.stderr)
    print("SAVE BUSINESS PROFILE ENDPOINT HIT", file=sys.stderr)

    try:
        from app.models import db
        from app.models.business import Business

        user_id = get_jwt_identity()
        data = request.get_json()

        print(f"User ID: {user_id}", file=sys.stderr)
        print(f"Raw data: {data}", file=sys.stderr)

        if not data:
            print("ERROR: No data", file=sys.stderr)
            return jsonify({'success': False, 'error': 'No data provided'}), 400

        # Extract new fields
        business_name = data.get('business_name')
        industry = data.get('industry')
        employees = data.get('employees')
        year_founded = data.get('year_founded')
        primary_location = data.get('primary_location')
        primary_market = data.get('primary_market')
        registration_type = data.get('registration_type')
        owners = data.get('owners', [])

        print(f"Parsed: business_name={business_name}, industry={industry}", file=sys.stderr)

        if not business_name:
            print("ERROR: Business name required", file=sys.stderr)
            return jsonify({'success': False, 'error': 'Business name is required'}), 400

        # Convert owners list to JSON string for storage
        owners_json = json.dumps(owners) if owners else '[]'

        # Check if business profile exists
        business = Business.query.filter_by(user_id=user_id).first()

        if business:
            print("Updating existing business", file=sys.stderr)
            business.name = business_name
            business.industry = industry
            business.employees = int(employees) if employees else None
            business.founded_year = int(year_founded) if year_founded else None
            business.primary_location = primary_location
            business.primary_market = primary_market
            business.registration_type = registration_type
            business.owners = owners_json
        else:
            print("Creating new business", file=sys.stderr)
            business = Business(
                user_id=user_id,
                name=business_name,
                industry=industry,
                employees=int(employees) if employees else None,
                founded_year=int(year_founded) if year_founded else None,
                primary_location=primary_location,
                primary_market=primary_market,
                registration_type=registration_type,
                owners=owners_json
            )
            db.session.add(business)

        db.session.commit()
        print(f"SUCCESS! Business ID: {business.id}", file=sys.stderr)
        print("="*50 + "\n", file=sys.stderr)

        return jsonify({
            'success': True,
            'message': 'Business profile saved successfully',
            'profile': business.to_dict()
        }), 200

    except ValueError as e:
        print(f"VALUE ERROR: {str(e)}", file=sys.stderr)
        return jsonify({'success': False, 'error': f'Invalid data format: {str(e)}'}), 400

    except Exception as e:
        print(f"EXCEPTION: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        print("="*50 + "\n", file=sys.stderr)

        from app.models import db
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500