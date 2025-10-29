"""
PDF Report Routes for ExitReady Pro
Handles generation and download of valuation reports
"""

from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import User, Business, Valuation
from app.services.pdf_generator import ValuationPDFGenerator
from app import db
import os
import tempfile
from datetime import datetime

pdf_bp = Blueprint('pdf', __name__)

@pdf_bp.route('/api/pdf/advanced-valuation', methods=['POST'])
@jwt_required()
def generate_advanced_valuation_pdf():
    """Generate PDF report for advanced valuation"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get request data
        data = request.get_json()
        valuation_data = data.get('valuation_data', {})
        business_profile = data.get('business_profile', {})
        
        # Create PDF generator
        pdf_gen = ValuationPDFGenerator()
        
        # Generate unique filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"advanced_valuation_{timestamp}.pdf"
        
        # Use temporary directory
        temp_dir = tempfile.gettempdir()
        filepath = os.path.join(temp_dir, filename)
        
        # Generate PDF
        pdf_gen.generate_advanced_report(valuation_data, business_profile, filepath)
        
        # Send file
        return send_file(
            filepath,
            as_attachment=True,
            download_name=f"{business_profile.get('business_name', 'business')}_valuation_report.pdf",
            mimetype='application/pdf'
        )
        
    except Exception as e:
        print(f"Error generating advanced PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to generate PDF: {str(e)}'}), 500


@pdf_bp.route('/api/pdf/basic-valuation', methods=['POST'])
@jwt_required()
def generate_basic_valuation_pdf():
    """Generate PDF report for basic/quick valuation"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get request data
        data = request.get_json()
        valuation_data = data.get('valuation_data', {})
        business_profile = data.get('business_profile', {})
        
        # Create PDF generator
        pdf_gen = ValuationPDFGenerator()
        
        # Generate unique filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"quick_valuation_{timestamp}.pdf"
        
        # Use temporary directory
        temp_dir = tempfile.gettempdir()
        filepath = os.path.join(temp_dir, filename)
        
        # Generate PDF
        pdf_gen.generate_basic_report(valuation_data, business_profile, filepath)
        
        # Send file
        return send_file(
            filepath,
            as_attachment=True,
            download_name=f"{business_profile.get('business_name', 'business')}_quick_valuation.pdf",
            mimetype='application/pdf'
        )
        
    except Exception as e:
        print(f"Error generating basic PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to generate PDF: {str(e)}'}), 500


@pdf_bp.route('/api/pdf/save-to-dashboard', methods=['POST'])
@jwt_required()
def save_valuation_to_dashboard():
    """Save a valuation (simple or advanced) to the user's dashboard"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Extract data
        business_id = data.get('business_id')
        valuation_type = data.get('valuation_type')  # 'simple' or 'advanced'
        estimated_value = data.get('estimated_value')
        method_used = data.get('method_used')
        calculation_details = data.get('calculation_details', {})
        
        # Validate required fields
        if not business_id or not valuation_type or not estimated_value:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Get business
        business = Business.query.filter_by(id=business_id, user_id=user_id).first()
        if not business:
            return jsonify({'error': 'Business not found'}), 404
        
        # Create new valuation record
        new_valuation = Valuation(
            business_id=business_id,
            user_id=user_id,
            valuation_type=valuation_type,
            estimated_value=estimated_value,
            method_used=method_used,
            calculation_details=calculation_details,
            valuation_date=datetime.utcnow()
        )
        
        db.session.add(new_valuation)
        db.session.commit()
        
        return jsonify({
            'message': 'Valuation saved to dashboard successfully',
            'valuation_id': new_valuation.id,
            'valuation': {
                'id': new_valuation.id,
                'business_id': new_valuation.business_id,
                'valuation_type': new_valuation.valuation_type,
                'estimated_value': new_valuation.estimated_value,
                'method_used': new_valuation.method_used,
                'valuation_date': new_valuation.valuation_date.isoformat()
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error saving valuation: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to save valuation: {str(e)}'}), 500


@pdf_bp.route('/api/valuations/history', methods=['GET'])
@jwt_required()
def get_valuation_history():
    """Get all valuations for the current user"""
    try:
        user_id = get_jwt_identity()
        
        # Get all valuations for user
        valuations = Valuation.query.filter_by(user_id=user_id).order_by(Valuation.valuation_date.desc()).all()
        
        result = []
        for val in valuations:
            business = Business.query.get(val.business_id)
            result.append({
                'id': val.id,
                'business_id': val.business_id,
                'business_name': business.business_name if business else 'Unknown',
                'valuation_type': val.valuation_type,
                'estimated_value': val.estimated_value,
                'method_used': val.method_used,
                'valuation_date': val.valuation_date.isoformat(),
                'calculation_details': val.calculation_details
            })
        
        return jsonify({
            'valuations': result,
            'total': len(result)
        }), 200
        
    except Exception as e:
        print(f"Error fetching valuation history: {str(e)}")
        return jsonify({'error': f'Failed to fetch valuations: {str(e)}'}), 500
