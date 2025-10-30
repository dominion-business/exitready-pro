# assessment.py - Routes that work with YOUR existing models

from flask import Blueprint, request, jsonify, current_app
from functools import wraps
from datetime import datetime
import jwt
import os
import logging

logger = logging.getLogger(__name__)
assessment_bp = Blueprint('assessments', __name__)

# JWT decorator
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
                return jsonify({'message': 'Invalid token format'}), 401

        except Exception as e:
            logger.error(f"Token decode error: {e}")
            return jsonify({'message': 'Token is invalid'}), 401

        return f(current_user_id, *args, **kwargs)
    return decorated


# Get current (most recent) assessment
@assessment_bp.route('/current', methods=['GET'])
@token_required
def get_current_assessment(current_user_id):
    """Get the user's most recent assessment"""
    from app.models.assessment import Assessment, AssessmentResponse
    from app.models import db

    # Get most recent assessment
    assessment = Assessment.query.filter_by(
        user_id=current_user_id
    ).order_by(Assessment.created_at.desc()).first()

    if not assessment:
        # Create a new assessment if none exists
        assessment = Assessment(user_id=current_user_id)
        db.session.add(assessment)
        db.session.commit()

    # Get all responses for this assessment
    responses = AssessmentResponse.query.filter_by(
        assessment_id=assessment.id
    ).all()

    response_data = []
    for response in responses:
        response_data.append({
            'question_id': response.question_id,
            'question_text': response.question_text,
            'category': response.category,
            'subject': response.subject,
            'answer_value': response.answer_value,
            'answer_text': response.answer_text,
            'score': response.score,
            'comments': response.comments
        })

    # Build category_scores object
    category_scores = {
        'financial_performance': assessment.financial_performance_score,
        'revenue_quality': assessment.revenue_quality_score,
        'customer_concentration': assessment.customer_concentration_score,
        'management_team': assessment.management_team_score,
        'competitive_position': assessment.competitive_position_score,
        'growth_potential': assessment.growth_potential_score,
        'intellectual_property': assessment.intellectual_property_score,
        'legal_compliance': assessment.legal_compliance_score,
        'owner_dependency': assessment.owner_dependency_score,
        'strategic_positioning': assessment.strategic_positioning_score
    }

    return jsonify({
        'id': assessment.id,
        'answered_questions': assessment.answered_questions,
        'overall_score': assessment.overall_score,
        'attractiveness_score': assessment.attractiveness_score,
        'category_scores': category_scores,
        'responses': response_data,
        'created_at': assessment.created_at.isoformat() if assessment.created_at else None,
        'updated_at': assessment.updated_at.isoformat() if assessment.updated_at else None
    })


# Create new assessment (retake)
@assessment_bp.route('/retake', methods=['POST'])
@token_required
def retake_assessment(current_user_id):
    """Create a new assessment"""
    from app.models.assessment import Assessment
    from app.models import db
    
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
            'attractiveness_score': 0,
            'created_at': new_assessment.created_at.isoformat()
        }
    }), 201


# Get assessment history (all past assessments)
@assessment_bp.route('/history', methods=['GET'])
@token_required
def get_assessment_history(current_user_id):
    """Get all past assessments for the user"""
    from app.models.assessment import Assessment
    
    # Get all assessments, ordered by most recent first
    assessments = Assessment.query.filter_by(
        user_id=current_user_id
    ).order_by(Assessment.created_at.desc()).all()
    
    history = []
    for assessment in assessments:
        history.append({
            'id': assessment.id,
            'overall_score': assessment.overall_score,
            'attractiveness_score': assessment.attractiveness_score,
            'financial_performance_score': assessment.financial_performance_score,
            'revenue_quality_score': assessment.revenue_quality_score,
            'customer_concentration_score': assessment.customer_concentration_score,
            'management_team_score': assessment.management_team_score,
            'competitive_position_score': assessment.competitive_position_score,
            'growth_potential_score': assessment.growth_potential_score,
            'intellectual_property_score': assessment.intellectual_property_score,
            'legal_compliance_score': assessment.legal_compliance_score,
            'owner_dependency_score': assessment.owner_dependency_score,
            'strategic_positioning_score': assessment.strategic_positioning_score,
            'answered_questions': assessment.answered_questions,
            'created_at': assessment.created_at.isoformat() if assessment.created_at else None,
            'updated_at': assessment.updated_at.isoformat() if assessment.updated_at else None
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
    from app.models.assessment import Assessment, AssessmentResponse
    
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
            'question_text': response.question_text,
            'category': response.category,
            'subject': response.subject,
            'answer_value': response.answer_value,
            'answer_text': response.answer_text,
            'score': response.score
        })
    
    return jsonify({
        'id': assessment.id,
        'overall_score': assessment.overall_score,
        'attractiveness_score': assessment.attractiveness_score,
        'financial_performance_score': assessment.financial_performance_score,
        'revenue_quality_score': assessment.revenue_quality_score,
        'customer_concentration_score': assessment.customer_concentration_score,
        'management_team_score': assessment.management_team_score,
        'competitive_position_score': assessment.competitive_position_score,
        'growth_potential_score': assessment.growth_potential_score,
        'intellectual_property_score': assessment.intellectual_property_score,
        'legal_compliance_score': assessment.legal_compliance_score,
        'owner_dependency_score': assessment.owner_dependency_score,
        'strategic_positioning_score': assessment.strategic_positioning_score,
        'answered_questions': assessment.answered_questions,
        'created_at': assessment.created_at.isoformat() if assessment.created_at else None,
        'updated_at': assessment.updated_at.isoformat() if assessment.updated_at else None,
        'responses': response_data
    })


# Get all questions
@assessment_bp.route('/questions', methods=['GET'])
@token_required
def get_questions(current_user_id):
    """Get all assessment questions"""
    from app.models.assessment import AssessmentQuestion

    questions = AssessmentQuestion.query.filter_by(active=True).order_by(AssessmentQuestion.order).all()

    questions_data = []
    for question in questions:
        questions_data.append({
            'id': question.id,
            'question_id': question.question_id,
            'question_text': question.question_text,
            'category': question.category,
            'category_display': question.category_display,
            'subject': question.subject,
            'rule_of_thumb': question.rule_of_thumb,
            'considerations': question.considerations,
            'answer_options': question.answer_options,
            'weight': question.weight,
            'scale_type': question.scale_type
        })

    return jsonify({
        'questions': questions_data,
        'count': len(questions_data)
    })


# Start a new assessment
@assessment_bp.route('/start', methods=['POST'])
@token_required
def start_assessment(current_user_id):
    """Start a new assessment (alias for retake)"""
    from app.models.assessment import Assessment
    from app.models import db

    # Create new assessment
    new_assessment = Assessment(user_id=current_user_id)
    db.session.add(new_assessment)
    db.session.commit()

    return jsonify({
        'message': 'Assessment started successfully',
        'assessment': {
            'id': new_assessment.id,
            'answered_questions': 0,
            'overall_score': 0,
            'attractiveness_score': 0,
            'created_at': new_assessment.created_at.isoformat()
        }
    }), 201


# Save assessment response
@assessment_bp.route('/response', methods=['POST'])
@token_required
def save_response(current_user_id):
    """Save a response to an assessment question"""
    from app.models.assessment import Assessment, AssessmentResponse, AssessmentQuestion
    from app.models import db

    data = request.get_json()

    # Validate required fields
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    if 'question_id' not in data:
        return jsonify({'error': 'question_id is required'}), 400

    # Validate answer_value if provided (must be 1-6)
    answer_value = data.get('answer_value')
    if answer_value is not None:
        try:
            answer_value = int(answer_value)
            if answer_value < 0 or answer_value > 6:
                return jsonify({'error': 'answer_value must be between 0 and 6'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'answer_value must be a valid integer'}), 400

    # Get or create current assessment
    assessment = Assessment.query.filter_by(
        user_id=current_user_id
    ).order_by(Assessment.created_at.desc()).first()

    if not assessment:
        assessment = Assessment(user_id=current_user_id)
        db.session.add(assessment)
        db.session.commit()

    # Get question details
    question = AssessmentQuestion.query.filter_by(
        question_id=data['question_id']
    ).first()

    if not question:
        return jsonify({'error': 'Question not found'}), 404

    # Check if response already exists
    existing_response = AssessmentResponse.query.filter_by(
        assessment_id=assessment.id,
        question_id=data['question_id']
    ).first()

    if existing_response:
        # Update existing response
        existing_response.answer_value = data.get('answer_value')
        existing_response.answer_text = data.get('answer_text')
        existing_response.comments = data.get('comments')
        existing_response.calculate_score()
        response = existing_response
    else:
        # Create new response
        response = AssessmentResponse(
            assessment_id=assessment.id,
            category=question.category,
            subject=question.subject,
            question_id=data['question_id'],
            question_text=question.question_text,
            answer_value=data.get('answer_value'),
            answer_text=data.get('answer_text'),
            rule_of_thumb=question.rule_of_thumb,
            considerations=question.considerations,
            comments=data.get('comments')
        )
        response.calculate_score()
        db.session.add(response)

    # Recalculate assessment scores
    assessment.calculate_scores()

    db.session.commit()

    return jsonify({
        'message': 'Response saved successfully',
        'response': {
            'id': response.id,
            'question_id': response.question_id,
            'answer_value': response.answer_value,
            'score': response.score
        },
        'assessment': {
            'overall_score': assessment.overall_score,
            'attractiveness_score': assessment.attractiveness_score,
            'answered_questions': assessment.answered_questions
        }
    }), 200


# Get assessment tasks
@assessment_bp.route('/tasks', methods=['GET'])
@token_required
def get_tasks(current_user_id):
    """Get all tasks for the current user's assessments"""
    from app.models.assessment import Assessment, AssessmentTask

    # Get all assessments for the user
    assessments = Assessment.query.filter_by(user_id=current_user_id).all()
    assessment_ids = [a.id for a in assessments]

    # Get all tasks for these assessments
    tasks = AssessmentTask.query.filter(
        AssessmentTask.assessment_id.in_(assessment_ids)
    ).order_by(AssessmentTask.created_at.desc()).all()

    tasks_data = []
    for task in tasks:
        tasks_data.append({
            'id': task.id,
            'assessment_id': task.assessment_id,
            'title': task.title,
            'description': task.description,
            'status': task.status,
            'priority': task.priority,
            'due_date': task.due_date.isoformat() if task.due_date else None,
            'created_at': task.created_at.isoformat() if task.created_at else None
        })

    return jsonify({
        'tasks': tasks_data,
        'count': len(tasks_data)
    })


# Update task status
@assessment_bp.route('/task/<int:task_id>/status', methods=['PUT'])
@token_required
def update_task_status(current_user_id, task_id):
    """Update the status of a task"""
    from app.models.assessment import Assessment, AssessmentTask
    from app.models import db

    data = request.get_json()

    if not data or 'status' not in data:
        return jsonify({'error': 'status is required'}), 400

    # Get task and verify ownership through assessment
    task = AssessmentTask.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    # Verify the task belongs to the user's assessment
    assessment = Assessment.query.filter_by(
        id=task.assessment_id,
        user_id=current_user_id
    ).first()

    if not assessment:
        return jsonify({'error': 'Unauthorized'}), 403

    # Update task status
    task.status = data['status']
    db.session.commit()

    return jsonify({
        'message': 'Task status updated successfully',
        'task': {
            'id': task.id,
            'status': task.status,
            'title': task.title
        }
    }), 200
