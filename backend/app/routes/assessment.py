# assessment.py - Routes that work with YOUR existing models

from flask import Blueprint, request, jsonify, current_app, send_file
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


# Generate PDF report for assessment
@assessment_bp.route('/<int:assessment_id>/pdf', methods=['GET'])
@token_required
def generate_assessment_pdf(current_user_id, assessment_id):
    """Generate and download PDF report for an assessment"""
    from app.models.assessment import Assessment, AssessmentResponse
    from app.utils.pdf_generator import AssessmentPDFGenerator

    # Get assessment and verify ownership
    assessment = Assessment.query.filter_by(
        id=assessment_id,
        user_id=current_user_id
    ).first()

    if not assessment:
        return jsonify({'error': 'Assessment not found'}), 404

    # Get all responses for this assessment
    responses = AssessmentResponse.query.filter_by(
        assessment_id=assessment_id
    ).all()

    # Prepare assessment data
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

    assessment_data = {
        'id': assessment.id,
        'overall_score': assessment.overall_score,
        'attractiveness_score': assessment.attractiveness_score,
        'answered_questions': assessment.answered_questions,
        'created_at': assessment.created_at.isoformat() if assessment.created_at else None,
        'updated_at': assessment.updated_at.isoformat() if assessment.updated_at else None,
        'category_scores': {
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
        },
        'responses': response_data
    }

    # Generate PDF
    try:
        pdf_generator = AssessmentPDFGenerator()
        pdf_buffer = pdf_generator.generate_report(assessment_data)

        # Generate filename with date
        filename = f"assessment_report_{assessment.id}_{datetime.now().strftime('%Y%m%d')}.pdf"

        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        logger.error(f"Error generating PDF: {e}")
        return jsonify({'error': 'Failed to generate PDF report'}), 500


# Get detailed CEPA-level assessment summary
@assessment_bp.route('/<int:assessment_id>/summary', methods=['GET'])
@token_required
def get_assessment_summary(current_user_id, assessment_id):
    """Generate a detailed CEPA-level interpretation and summary of assessment results"""
    from app.models.assessment import Assessment, AssessmentResponse, AssessmentQuestion

    # Get assessment and verify ownership
    assessment = Assessment.query.filter_by(
        id=assessment_id,
        user_id=current_user_id
    ).first()

    if not assessment:
        return jsonify({'error': 'Assessment not found'}), 404

    # Get all responses for this assessment
    responses = AssessmentResponse.query.filter_by(
        assessment_id=assessment_id
    ).all()

    if not responses:
        return jsonify({'error': 'No responses found for this assessment'}), 404

    # Calculate category-specific insights
    categories = {
        'financial_performance': {'score': assessment.financial_performance_score, 'name': 'Financial Health', 'responses': []},
        'revenue_quality': {'score': assessment.revenue_quality_score, 'name': 'Revenue Quality', 'responses': []},
        'customer_concentration': {'score': assessment.customer_concentration_score, 'name': 'Customer Base', 'responses': []},
        'management_team': {'score': assessment.management_team_score, 'name': 'Management Team', 'responses': []},
        'competitive_position': {'score': assessment.competitive_position_score, 'name': 'Competitive Position', 'responses': []},
        'growth_potential': {'score': assessment.growth_potential_score, 'name': 'Growth Trajectory', 'responses': []},
        'intellectual_property': {'score': assessment.intellectual_property_score, 'name': 'Intellectual Property', 'responses': []},
        'legal_compliance': {'score': assessment.legal_compliance_score, 'name': 'Legal & Compliance', 'responses': []},
        'owner_dependency': {'score': assessment.owner_dependency_score, 'name': 'Owner Dependency', 'responses': []},
        'strategic_positioning': {'score': assessment.strategic_positioning_score, 'name': 'Strategic Position', 'responses': []}
    }

    # Group responses by category
    for response in responses:
        if response.category in categories:
            categories[response.category]['responses'].append({
                'question_id': response.question_id,
                'subject': response.subject,
                'score': response.score,
                'answer_value': response.answer_value
            })

    # Identify strengths (top 3 categories)
    sorted_categories = sorted(categories.items(), key=lambda x: x[1]['score'], reverse=True)
    strengths = [{'category': cat[1]['name'], 'score': cat[1]['score']} for cat in sorted_categories[:3] if cat[1]['score'] > 0]

    # Identify critical gaps (bottom 3 categories with non-zero scores)
    weaknesses = [{'category': cat[1]['name'], 'score': cat[1]['score']} for cat in reversed(sorted_categories) if cat[1]['score'] > 0][:3]

    # Count gap distribution
    gap_distribution = {
        'no_gaps': 0,           # >86%
        'minor_gaps': 0,        # 72-86%
        'considerable_gaps': 0, # 57-72%
        'critical_gaps': 0,     # 43-57%
        'very_critical': 0,     # 28-43%
        'extremely_critical': 0 # 0-28%
    }

    for response in responses:
        if response.answer_value == 0:  # Skip N/A responses
            continue
        score = response.score
        if score > 86:
            gap_distribution['no_gaps'] += 1
        elif score > 72:
            gap_distribution['minor_gaps'] += 1
        elif score > 57:
            gap_distribution['considerable_gaps'] += 1
        elif score > 43:
            gap_distribution['critical_gaps'] += 1
        elif score > 28:
            gap_distribution['very_critical'] += 1
        else:
            gap_distribution['extremely_critical'] += 1

    # Determine overall readiness level
    overall_score = assessment.overall_score

    if overall_score > 86:
        readiness_level = 'Exceptional'
        readiness_description = 'Your business demonstrates exceptional exit readiness with best-in-class practices.'
    elif overall_score > 72:
        readiness_level = 'Strong'
        readiness_description = 'Your business shows strong exit readiness with well-documented and transferable processes.'
    elif overall_score > 57:
        readiness_level = 'Moderate'
        readiness_description = 'Your business has a solid foundation but requires focused improvements in key areas.'
    elif overall_score > 43:
        readiness_level = 'Developing'
        readiness_description = 'Your business needs significant work to reach optimal exit readiness.'
    elif overall_score > 28:
        readiness_level = 'Early Stage'
        readiness_description = 'Your business requires substantial development across multiple critical areas.'
    else:
        readiness_level = 'Foundation Building'
        readiness_description = 'Your business is in the early stages of exit preparation and needs comprehensive development.'

    # Generate CEPA-level interpretation
    cepa_interpretation = generate_cepa_interpretation(
        overall_score,
        readiness_level,
        strengths,
        weaknesses,
        gap_distribution,
        assessment.answered_questions
    )

    # Generate strategic recommendations
    recommendations = generate_strategic_recommendations(
        overall_score,
        weaknesses,
        gap_distribution
    )

    return jsonify({
        'assessment_id': assessment_id,
        'overall_score': overall_score,
        'readiness_level': readiness_level,
        'readiness_description': readiness_description,
        'answered_questions': assessment.answered_questions,
        'strengths': strengths,
        'weaknesses': weaknesses,
        'gap_distribution': gap_distribution,
        'cepa_interpretation': cepa_interpretation,
        'recommendations': recommendations,
        'next_steps': generate_next_steps(weaknesses, gap_distribution)
    })


def generate_cepa_interpretation(overall_score, readiness_level, strengths, weaknesses, gap_distribution, answered_questions):
    """Generate detailed CEPA-level interpretation of assessment results"""

    interpretation = {
        'executive_summary': '',
        'value_drivers': '',
        'risk_factors': '',
        'transferability_analysis': '',
        'market_positioning': ''
    }

    # Executive Summary
    interpretation['executive_summary'] = (
        f"Based on your comprehensive assessment of {answered_questions} business attributes, "
        f"your business has achieved an overall attractiveness score of {overall_score:.1f}%, "
        f"placing you in the '{readiness_level}' category for exit readiness.\n\n"
    )

    if overall_score >= 67:
        interpretation['executive_summary'] += (
            "Congratulations! Your business has crossed the critical 67% threshold, entering the 'green zone' "
            "where businesses become significantly more attractive to buyers and command premium valuations. "
        )
    else:
        target_improvement = 67 - overall_score
        interpretation['executive_summary'] += (
            f"Your business is currently {target_improvement:.1f}% below the critical 67% 'green zone' threshold. "
            f"Reaching this milestone will significantly increase your business's attractiveness to buyers. "
        )

    # Value Drivers Analysis
    if strengths:
        strength_text = ", ".join([f"{s['category']} ({s['score']:.1f}%)" for s in strengths])
        interpretation['value_drivers'] = (
            f"Your strongest value drivers are: {strength_text}. These areas represent competitive advantages "
            f"that potential buyers will view favorably. They demonstrate established systems, clear documentation, "
            f"and reduced dependency on the owner. Maintain and leverage these strengths as you work on improvement areas."
        )
    else:
        interpretation['value_drivers'] = (
            "Your assessment indicates opportunities to develop stronger value drivers across all categories. "
            "Focus on building documented, repeatable processes that can operate independently of owner involvement."
        )

    # Risk Factors
    critical_count = gap_distribution['critical_gaps'] + gap_distribution['very_critical'] + gap_distribution['extremely_critical']
    if critical_count > 0:
        interpretation['risk_factors'] = (
            f"Your assessment reveals {critical_count} areas with critical gaps that require immediate attention. "
            f"These gaps represent significant risks that could reduce your valuation multiple or deter potential buyers. "
        )

        if weaknesses:
            weakness_text = ", ".join([f"{w['category']} ({w['score']:.1f}%)" for w in weaknesses])
            interpretation['risk_factors'] += (
                f"Priority focus areas include: {weakness_text}. Addressing these systematically through the "
                f"task management system will be essential for improving exit readiness."
            )
    else:
        interpretation['risk_factors'] = (
            "Your business shows minimal critical risk factors, with most areas demonstrating adequate to strong performance. "
            "Continue monitoring and incrementally improving to maintain this positive trajectory."
        )

    # Transferability Analysis
    if overall_score > 72:
        interpretation['transferability_analysis'] = (
            "Your business demonstrates strong transferability characteristics. Clear documentation, established processes, "
            "and reduced owner dependency indicate that operations can continue successfully post-transition. "
            "This significantly enhances your appeal to strategic and financial buyers."
        )
    elif overall_score > 57:
        interpretation['transferability_analysis'] = (
            "Your business shows moderate transferability. While some systems are documented and processes are established, "
            "there are key areas where owner knowledge and involvement remain critical. Focus on documenting these areas "
            "and developing second-tier leadership to improve transferability."
        )
    else:
        interpretation['transferability_analysis'] = (
            "Transferability represents a significant development opportunity for your business. Buyers need confidence "
            "that the business can operate successfully without the current owner. Prioritize documenting processes, "
            "reducing owner dependency, and developing management team capabilities."
        )

    # Market Positioning
    if overall_score > 86:
        interpretation['market_positioning'] = (
            "Your business is positioned in the top tier of potential acquisition targets. Best-in-class practices "
            "and exceptional performance across key metrics make you highly attractive to premium buyers. "
            "You are well-positioned to command strong valuation multiples and favorable terms."
        )
    elif overall_score > 72:
        interpretation['market_positioning'] = (
            "Your business is well-positioned for a successful exit. Strong performance in key areas makes you attractive "
            "to both strategic and financial buyers. Continue refining areas with minor gaps to maximize valuation."
        )
    elif overall_score > 57:
        interpretation['market_positioning'] = (
            "Your business represents a solid opportunity for buyers willing to invest in operational improvements. "
            "To maximize valuation and expand your buyer pool, focus on elevating your weakest categories to at least "
            "the 'considerable gaps' threshold (57%+)."
        )
    else:
        interpretation['market_positioning'] = (
            "Your business is in the development phase of exit preparation. Focus on building a strong foundation "
            "across all categories before actively marketing the business. The improvements you make now will have "
            "significant impact on your eventual valuation and transaction success."
        )

    return interpretation


def generate_strategic_recommendations(overall_score, weaknesses, gap_distribution):
    """Generate strategic recommendations based on assessment results"""

    recommendations = []

    # Recommendation 1: Address critical gaps first
    critical_count = gap_distribution['critical_gaps'] + gap_distribution['very_critical'] + gap_distribution['extremely_critical']
    if critical_count > 10:
        recommendations.append({
            'priority': 'Immediate',
            'title': 'De-Risk Critical Areas',
            'description': (
                f"With {critical_count} critical gaps identified, your immediate priority should be de-risking activities. "
                f"Use the task management system to address extremely critical and very critical gaps first, "
                f"as these pose the greatest threat to valuation and transaction success."
            )
        })

    # Recommendation 2: Strengthen weak categories
    if weaknesses and len(weaknesses) > 0:
        bottom_category = weaknesses[0]
        recommendations.append({
            'priority': 'High',
            'title': f'Strengthen {bottom_category["category"]}',
            'description': (
                f'{bottom_category["category"]} scored {bottom_category["score"]:.1f}%, representing your weakest area. '
                f'Focus on this category after addressing immediate critical gaps. Even moderate improvements here '
                f'will have significant impact on your overall attractiveness score.'
            )
        })

    # Recommendation 3: Build systematic documentation
    if overall_score < 72:
        recommendations.append({
            'priority': 'High',
            'title': 'Implement Systematic Documentation',
            'description': (
                'Documented, repeatable processes are the foundation of business transferability. Create standard '
                'operating procedures (SOPs) for key functions, implement knowledge management systems, and ensure '
                'critical business information is captured outside of any single individual.'
            )
        })

    # Recommendation 4: Reduce owner dependency
    recommendations.append({
        'priority': 'Medium',
        'title': 'Reduce Owner Dependency',
        'description': (
            'Develop second-tier leadership and delegate key responsibilities. Buyers need confidence that the '
            'business can thrive without the current owner. Create succession plans for critical roles and '
            'demonstrate that operations can run smoothly during extended owner absences.'
        )
    })

    # Recommendation 5: Establish regular assessment cycles
    recommendations.append({
        'priority': 'Medium',
        'title': 'Implement Quarterly Progress Reviews',
        'description': (
            'Retake this assessment quarterly to track your progress. Set specific score targets for each category '
            'and measure improvement over time. This data will demonstrate to buyers that you have a culture of '
            'continuous improvement and data-driven decision making.'
        )
    })

    return recommendations


def generate_next_steps(weaknesses, gap_distribution):
    """Generate specific next steps for the user"""

    next_steps = []

    # Step 1: Review the detailed analysis
    next_steps.append({
        'step': 1,
        'action': 'Review Your Detailed Assessment',
        'description': 'Carefully review each category and the specific questions where gaps were identified. Understanding the "why" behind your scores is crucial for improvement.',
        'timeframe': 'This week'
    })

    # Step 2: Access the task manager
    next_steps.append({
        'step': 2,
        'action': 'Access Your Task Manager',
        'description': 'The task manager will generate 5-15 specific, actionable tasks for each of the 89 questions based on your responses. These tasks provide a clear roadmap for improvement.',
        'timeframe': 'This week'
    })

    # Step 3: Prioritize de-risking activities
    critical_count = gap_distribution['critical_gaps'] + gap_distribution['very_critical'] + gap_distribution['extremely_critical']
    if critical_count > 0:
        next_steps.append({
            'step': 3,
            'action': 'Prioritize De-Risking Activities',
            'description': f'Focus on the {critical_count} questions with critical gaps. These represent the highest-risk areas that could significantly impact your valuation.',
            'timeframe': 'Next 30 days'
        })

    # Step 4: Focus on weakest category
    if weaknesses and len(weaknesses) > 0:
        bottom_category = weaknesses[0]
        next_steps.append({
            'step': 4,
            'action': f'Develop {bottom_category["category"]} Improvement Plan',
            'description': f'Create a focused improvement plan for {bottom_category["category"]}, your lowest-scoring category. Target a 15-20% improvement within 90 days.',
            'timeframe': 'Next 90 days'
        })

    # Step 5: Schedule follow-up assessment
    next_steps.append({
        'step': 5,
        'action': 'Schedule Your Next Assessment',
        'description': 'Set a reminder to retake this assessment in 90 days. Track your progress and celebrate improvements. Consistent measurement drives consistent improvement.',
        'timeframe': '90 days from now'
    })

    return next_steps
