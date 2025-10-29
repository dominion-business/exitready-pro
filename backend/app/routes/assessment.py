# assessment_routes.py - Add these routes to your existing assessment routes file

from flask import Blueprint, request, jsonify, current_app
from functools import wraps
from datetime import datetime
import jwt
import os

assessment_bp = Blueprint('assessments', __name__)

# JWT decorator (add this if you don't have it)
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            token = token.split()[1]  # Remove 'Bearer ' prefix
            secret_key = current_app.config.get('JWT_SECRET_KEY')
            data = jwt.decode(token, secret_key, algorithms=['HS256'])
            
            # Flask-JWT-Extended uses 'sub' or 'identity' instead of 'user_id'
            current_user_id = data.get('sub') or data.get('identity') or data.get('user_id')
            
            if not current_user_id:
                print(f"❌ No user ID found in token. Token data: {data}")
                return jsonify({'message': 'Invalid token format'}), 401
                
            print(f"✅ User authenticated: {current_user_id}")
            
        except Exception as e:
            print(f"❌ Token decode error: {e}")
            return jsonify({'message': 'Token is invalid'}), 401
        
        return f(current_user_id, *args, **kwargs)
    return decorated

# Get current (active) assessment
@assessment_bp.route('/current', methods=['GET'])
@token_required
def get_current_assessment(current_user_id):
    """Get the user's current active assessment"""
    from app.models import Assessment, db
    
    assessment = Assessment.query.filter_by(
        user_id=current_user_id,
        is_archived=False
    ).first()
    
    if not assessment:
        # Create a new assessment if none exists
        assessment = Assessment(user_id=current_user_id)
        db.session.add(assessment)
        db.session.commit()
    
    return jsonify({
        'id': assessment.id,
        'answered_questions': assessment.answered_questions,
        'overall_score': assessment.overall_score,
        'financial_score': assessment.financial_score,
        'operational_score': assessment.operational_score,
        'dependency_score': assessment.dependency_score,
        'completed_at': assessment.completed_at.isoformat() if assessment.completed_at else None,
        'created_at': assessment.created_at.isoformat()
    })

# Retake assessment (archive current, create new)
@assessment_bp.route('/retake', methods=['POST'])
@token_required
def retake_assessment(current_user_id):
    """Archive current assessment and create a new one"""
    from app.models import Assessment, db
    
    # Archive the current assessment
    current_assessment = Assessment.query.filter_by(
        user_id=current_user_id,
        is_archived=False
    ).first()
    
    if current_assessment:
        # Only archive if it's been completed
        if current_assessment.answered_questions > 0:
            current_assessment.is_archived = True
            current_assessment.archived_at = datetime.utcnow()
            if not current_assessment.completed_at:
                current_assessment.completed_at = datetime.utcnow()
    
    # Create new assessment
    new_assessment = Assessment(user_id=current_user_id)
    db.session.add(new_assessment)
    db.session.commit()
    
    return jsonify({
        'message': 'New assessment created successfully',
        'assessment': {
            'id': new_assessment.id,
            'answered_questions': 0,
            'overall_score': 0,
            'financial_score': 0,
            'operational_score': 0,
            'dependency_score': 0,
            'created_at': new_assessment.created_at.isoformat()
        }
    }), 201

# Get assessment history
@assessment_bp.route('/history', methods=['GET'])
@token_required
def get_assessment_history(current_user_id):
    """Get all archived assessments for the user"""
    from app.models import Assessment
    
    archived_assessments = Assessment.query.filter_by(
        user_id=current_user_id,
        is_archived=True
    ).order_by(Assessment.completed_at.desc()).all()
    
    history = []
    for assessment in archived_assessments:
        history.append({
            'id': assessment.id,
            'overall_score': assessment.overall_score,
            'financial_score': assessment.financial_score,
            'operational_score': assessment.operational_score,
            'dependency_score': assessment.dependency_score,
            'answered_questions': assessment.answered_questions,
            'completed_at': assessment.completed_at.isoformat() if assessment.completed_at else None,
            'created_at': assessment.created_at.isoformat(),
            'archived_at': assessment.archived_at.isoformat() if assessment.archived_at else None
        })
    
    return jsonify({
        'history': history,
        'count': len(history)
    })

# Get specific assessment by ID
@assessment_bp.route('/<int:assessment_id>', methods=['GET'])
@token_required
def get_assessment_by_id(current_user_id, assessment_id):
    """Get details of a specific assessment"""
    from app.models import Assessment, AssessmentResponse
    
    assessment = Assessment.query.filter_by(
        id=assessment_id,
        user_id=current_user_id
    ).first()
    
    if not assessment:
        return jsonify({'message': 'Assessment not found'}), 404
    
    # Get all responses for this assessment
    responses = AssessmentResponse.query.filter_by(
        assessment_id=assessment_id
    ).all()
    
    response_data = []
    for response in responses:
        response_data.append({
            'question_id': response.question_id,
            'question_text': response.question.question_text if response.question else None,
            'category': response.question.category if response.question else None,
            'subcategory': response.question.subcategory if response.question else None,
            'response_value': response.response_value,
            'response_text': response.response_text
        })
    
    return jsonify({
        'id': assessment.id,
        'overall_score': assessment.overall_score,
        'financial_score': assessment.financial_score,
        'operational_score': assessment.operational_score,
        'dependency_score': assessment.dependency_score,
        'answered_questions': assessment.answered_questions,
        'completed_at': assessment.completed_at.isoformat() if assessment.completed_at else None,
        'created_at': assessment.created_at.isoformat(),
        'is_archived': assessment.is_archived,
        'archived_at': assessment.archived_at.isoformat() if assessment.archived_at else None,
        'responses': response_data
    })

# Get all questions
@assessment_bp.route('/questions', methods=['GET'])
@token_required
def get_questions(current_user_id):
    """Get all assessment questions"""
    from app.models.assessment import AssessmentQuestion as Question
    
    questions = Question.query.all()
    
    questions_data = []
    for question in questions:
        questions_data.append({
            'id': question.id,
            'question_text': question.question_text,
            'category': question.category,
            'subcategory': question.subcategory,
            'weight': question.weight,
            'tooltip': question.tooltip
        })
    
    return jsonify({
        'questions': questions_data,
        'count': len(questions_data)
    })