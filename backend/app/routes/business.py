from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import sys
import json
from datetime import datetime

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

        user_id = int(get_jwt_identity())
        data = request.get_json()

        print(f"User ID: {user_id}", file=sys.stderr)
        print(f"Raw data: {data}", file=sys.stderr)

        if not data:
            print("ERROR: No data", file=sys.stderr)
            return jsonify({'success': False, 'error': 'No data provided'}), 400

        # Extract client personal fields
        client_first_name = data.get('client_first_name')
        client_last_name = data.get('client_last_name')
        client_email = data.get('client_email')
        client_phone = data.get('client_phone')

        # Parse date of birth if provided
        client_date_of_birth_str = data.get('client_date_of_birth')
        client_date_of_birth = None
        if client_date_of_birth_str:
            try:
                client_date_of_birth = datetime.strptime(client_date_of_birth_str, '%Y-%m-%d').date()
            except (ValueError, TypeError):
                pass  # Keep as None if parsing fails

        client_address = data.get('client_address')
        client_city = data.get('client_city')
        client_state = data.get('client_state')
        client_zip = data.get('client_zip')
        client_sex = data.get('client_sex')

        # Spouse/Partner fields
        spouse_name = data.get('spouse_name')
        spouse_email = data.get('spouse_email')
        spouse_phone = data.get('spouse_phone')
        spouse_involved_in_business = data.get('spouse_involved_in_business', False)
        spouse_sex = data.get('spouse_sex')
        # Notes fields
        client_notes = data.get('client_notes', '')
        spouse_notes = data.get('spouse_notes', '')
        dependents_notes = data.get('dependents_notes', '')
        business_notes = data.get('business_notes', '')
        exit_notes = data.get('exit_notes', '')
        advisory_notes = data.get('advisory_notes', '')


        # Family fields
        num_dependents = data.get('num_dependents')
        dependents_info = data.get('dependents_info', [])

        # Extract business fields
        business_name = data.get('business_name')
        industry = data.get('industry')
        employees = data.get('employees')
        year_founded = data.get('year_founded')
        primary_location = data.get('primary_location')
        primary_market = data.get('primary_market')
        registration_type = data.get('registration_type')
        owners = data.get('owners', [])

        # Exit planning fields
        exit_horizon = data.get('exit_horizon')
        preferred_exit_type = data.get('preferred_exit_type')
        key_motivations = data.get('key_motivations', [])
        key_motivations_other = data.get('key_motivations_other', [])
        deal_breakers = data.get('deal_breakers', [])
        deal_breakers_other = data.get('deal_breakers_other', [])

        # Strategic assets
        has_proprietary_tech = data.get('has_proprietary_tech', False)
        has_patents_ip = data.get('has_patents_ip', False)
        has_recurring_revenue = data.get('has_recurring_revenue', False)
        recurring_revenue_percentage = data.get('recurring_revenue_percentage')

        # Financials
        gross_margin = data.get('gross_margin')
        growth_rate = data.get('growth_rate')
        customer_concentration = data.get('customer_concentration')

        # Succession & team
        has_management_team = data.get('has_management_team', False)
        successor_identified = data.get('successor_identified', False)
        successor_type = data.get('successor_type')

        # Advisory team
        custom_advisors = data.get('custom_advisors', [])
        has_attorney = data.get('has_attorney', False)
        attorney_name = data.get('attorney_name')
        attorney_email = data.get('attorney_email')
        attorney_phone = data.get('attorney_phone')
        has_accountant = data.get('has_accountant', False)
        accountant_name = data.get('accountant_name')
        accountant_email = data.get('accountant_email')
        accountant_phone = data.get('accountant_phone')
        has_financial_advisor = data.get('has_financial_advisor', False)
        financial_advisor_name = data.get('financial_advisor_name')
        financial_advisor_email = data.get('financial_advisor_email')
        financial_advisor_phone = data.get('financial_advisor_phone')
        has_exit_advisor = data.get('has_exit_advisor', False)
        exit_advisor_name = data.get('exit_advisor_name')
        exit_advisor_email = data.get('exit_advisor_email')
        exit_advisor_phone = data.get('exit_advisor_phone')
        has_insurance_agent = data.get('has_insurance_agent', False)
        insurance_agent_name = data.get('insurance_agent_name')
        insurance_agent_email = data.get('insurance_agent_email')
        insurance_agent_phone = data.get('insurance_agent_phone')
        has_banker = data.get('has_banker', False)
        banker_name = data.get('banker_name')
        banker_email = data.get('banker_email')
        banker_phone = data.get('banker_phone')
        has_estate_planner = data.get('has_estate_planner', False)
        estate_planner_name = data.get('estate_planner_name')
        estate_planner_email = data.get('estate_planner_email')
        estate_planner_phone = data.get('estate_planner_phone')
        has_business_coach = data.get('has_business_coach', False)
        business_coach_name = data.get('business_coach_name')
        business_coach_email = data.get('business_coach_email')
        business_coach_phone = data.get('business_coach_phone')

        print(f"Parsed: business_name={business_name}, industry={industry}", file=sys.stderr)

        # No required fields - allow saving even if business_name is empty
        # Use a placeholder if business_name is not provided
        if not business_name:
            business_name = 'Unnamed Business'
            print("WARNING: No business name provided, using placeholder", file=sys.stderr)

        # Convert lists to JSON strings for storage
        owners_json = json.dumps(owners) if owners else '[]'
        key_motivations_json = json.dumps(key_motivations) if key_motivations else '[]'
        key_motivations_other_json = json.dumps(key_motivations_other) if key_motivations_other else '[]'
        deal_breakers_json = json.dumps(deal_breakers) if deal_breakers else '[]'
        deal_breakers_other_json = json.dumps(deal_breakers_other) if deal_breakers_other else '[]'
        dependents_info_json = json.dumps(dependents_info) if dependents_info else '[]'
        custom_advisors_json = json.dumps(custom_advisors) if custom_advisors else '[]'

        # Check if business profile exists
        business = Business.query.filter_by(user_id=user_id).first()

        if business:
            print("Updating existing business", file=sys.stderr)

            # Client Personal Information
            business.client_first_name = client_first_name
            business.client_last_name = client_last_name
            business.client_email = client_email
            business.client_phone = client_phone
            business.client_date_of_birth = client_date_of_birth
            business.client_address = client_address
            business.client_city = client_city
            business.client_state = client_state
            business.client_zip = client_zip
            business.client_sex = client_sex
            business.client_notes = client_notes

            # Spouse/Partner Information
            business.spouse_name = spouse_name
            business.spouse_email = spouse_email
            business.spouse_phone = spouse_phone
            business.spouse_involved_in_business = spouse_involved_in_business
            business.spouse_sex = spouse_sex
            business.spouse_notes = spouse_notes

            # Family & Dependents
            business.num_dependents = int(num_dependents) if num_dependents else None
            business.dependents_info = dependents_info_json
            business.dependents_notes = dependents_notes

            # Business Information
            business.name = business_name
            business.industry = industry
            business.employees = int(employees) if employees else None
            business.founded_year = int(year_founded) if year_founded else None
            business.primary_location = primary_location
            business.primary_market = primary_market
            business.registration_type = registration_type
            business.owners = owners_json
            business.business_notes = business_notes

            # Exit planning
            business.exit_horizon = exit_horizon
            business.preferred_exit_type = preferred_exit_type
            business.key_motivations = key_motivations_json
            business.key_motivations_other = key_motivations_other_json
            business.deal_breakers = deal_breakers_json
            business.deal_breakers_other = deal_breakers_other_json
            business.exit_notes = exit_notes

            # Strategic assets
            business.has_proprietary_tech = has_proprietary_tech
            business.has_patents_ip = has_patents_ip
            business.has_recurring_revenue = has_recurring_revenue
            business.recurring_revenue_percentage = float(recurring_revenue_percentage) if recurring_revenue_percentage else None

            # Financials
            business.gross_margin = float(gross_margin) if gross_margin else None
            business.growth_rate = float(growth_rate) if growth_rate else None
            business.customer_concentration = customer_concentration

            # Succession & team
            business.has_management_team = has_management_team
            business.successor_identified = successor_identified
            business.successor_type = successor_type

            # Advisory team
            business.custom_advisors = custom_advisors_json
            business.advisory_notes = advisory_notes
            business.has_attorney = has_attorney
            business.attorney_name = attorney_name
            business.attorney_email = attorney_email
            business.attorney_phone = attorney_phone
            business.has_accountant = has_accountant
            business.accountant_name = accountant_name
            business.accountant_email = accountant_email
            business.accountant_phone = accountant_phone
            business.has_financial_advisor = has_financial_advisor
            business.financial_advisor_name = financial_advisor_name
            business.financial_advisor_email = financial_advisor_email
            business.financial_advisor_phone = financial_advisor_phone
            business.has_exit_advisor = has_exit_advisor
            business.exit_advisor_name = exit_advisor_name
            business.exit_advisor_email = exit_advisor_email
            business.exit_advisor_phone = exit_advisor_phone
            business.has_insurance_agent = has_insurance_agent
            business.insurance_agent_name = insurance_agent_name
            business.insurance_agent_email = insurance_agent_email
            business.insurance_agent_phone = insurance_agent_phone
            business.has_banker = has_banker
            business.banker_name = banker_name
            business.banker_email = banker_email
            business.banker_phone = banker_phone
            business.has_estate_planner = has_estate_planner
            business.estate_planner_name = estate_planner_name
            business.estate_planner_email = estate_planner_email
            business.estate_planner_phone = estate_planner_phone
            business.has_business_coach = has_business_coach
            business.business_coach_name = business_coach_name
            business.business_coach_email = business_coach_email
            business.business_coach_phone = business_coach_phone
        else:
            print("Creating new business", file=sys.stderr)
            business = Business(
                user_id=user_id,
                # Client Personal Information
                client_first_name=client_first_name,
                client_last_name=client_last_name,
                client_email=client_email,
                client_phone=client_phone,
                client_date_of_birth=client_date_of_birth,
                client_address=client_address,
                client_city=client_city,
                client_state=client_state,
                client_zip=client_zip,
                client_sex=client_sex,
                client_notes=client_notes,
                # Spouse/Partner Information
                spouse_name=spouse_name,
                spouse_email=spouse_email,
                spouse_phone=spouse_phone,
                spouse_involved_in_business=spouse_involved_in_business,
                spouse_sex=spouse_sex,
                spouse_notes=spouse_notes,
                # Family & Dependents
                num_dependents=int(num_dependents) if num_dependents else None,
                dependents_info=dependents_info_json,
                dependents_notes=dependents_notes,
                # Business Information
                name=business_name,
                industry=industry,
                employees=int(employees) if employees else None,
                founded_year=int(year_founded) if year_founded else None,
                primary_location=primary_location,
                primary_market=primary_market,
                registration_type=registration_type,
                owners=owners_json,
                business_notes=business_notes,
                # Exit planning
                exit_horizon=exit_horizon,
                preferred_exit_type=preferred_exit_type,
                key_motivations=key_motivations_json,
                key_motivations_other=key_motivations_other_json,
                deal_breakers=deal_breakers_json,
                deal_breakers_other=deal_breakers_other_json,
                exit_notes=exit_notes,
                # Strategic assets
                has_proprietary_tech=has_proprietary_tech,
                has_patents_ip=has_patents_ip,
                has_recurring_revenue=has_recurring_revenue,
                recurring_revenue_percentage=float(recurring_revenue_percentage) if recurring_revenue_percentage else None,
                # Financials
                gross_margin=float(gross_margin) if gross_margin else None,
                growth_rate=float(growth_rate) if growth_rate else None,
                customer_concentration=customer_concentration,
                # Succession & team
                has_management_team=has_management_team,
                successor_identified=successor_identified,
                successor_type=successor_type,
                # Advisory team
                custom_advisors=custom_advisors_json,
                advisory_notes=advisory_notes,
                has_attorney=has_attorney,
                attorney_name=attorney_name,
                attorney_email=attorney_email,
                attorney_phone=attorney_phone,
                has_accountant=has_accountant,
                accountant_name=accountant_name,
                accountant_email=accountant_email,
                accountant_phone=accountant_phone,
                has_financial_advisor=has_financial_advisor,
                financial_advisor_name=financial_advisor_name,
                financial_advisor_email=financial_advisor_email,
                financial_advisor_phone=financial_advisor_phone,
                has_exit_advisor=has_exit_advisor,
                exit_advisor_name=exit_advisor_name,
                exit_advisor_email=exit_advisor_email,
                exit_advisor_phone=exit_advisor_phone,
                has_insurance_agent=has_insurance_agent,
                insurance_agent_name=insurance_agent_name,
                insurance_agent_email=insurance_agent_email,
                insurance_agent_phone=insurance_agent_phone,
                has_banker=has_banker,
                banker_name=banker_name,
                banker_email=banker_email,
                banker_phone=banker_phone,
                has_estate_planner=has_estate_planner,
                estate_planner_name=estate_planner_name,
                estate_planner_email=estate_planner_email,
                estate_planner_phone=estate_planner_phone,
                has_business_coach=has_business_coach,
                business_coach_name=business_coach_name,
                business_coach_email=business_coach_email,
                business_coach_phone=business_coach_phone
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