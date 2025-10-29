"""
Assessment Routes - Gap Analysis & Exit Readiness API
"""

import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from app.models import db, User
from app.models.assessment import Assessment, AssessmentResponse, AssessmentTask, AssessmentQuestion

assessment_bp = Blueprint('assessment', __name__)


@assessment_bp.route('/api/assessment/start', methods=['POST'])
@jwt_required()
def start_assessment():
    """Start a new assessment for the user"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user already has an active assessment
        existing = Assessment.query.filter_by(user_id=user_id, completed=False).first()
        
        if existing:
            return jsonify({
                'message': 'Assessment already in progress',
                'assessment_id': existing.id,
                'overall_score': existing.overall_score,
                'answered_questions': existing.answered_questions
            }), 200
        
        # Create new assessment
        assessment = Assessment(user_id=user_id)
        db.session.add(assessment)
        db.session.commit()
        
        return jsonify({
            'message': 'Assessment started',
            'assessment_id': assessment.id,
            'total_questions': assessment.total_questions
        }), 201
        
    except Exception as e:
        print(f"Error starting assessment: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@assessment_bp.route('/api/assessment/current', methods=['GET'])
@jwt_required()
def get_current_assessment():
    """Get user's current or most recent assessment"""
    try:
        user_id = get_jwt_identity()
        
        # Try to get active assessment first
        assessment = Assessment.query.filter_by(
            user_id=user_id,
            completed=False
        ).first()
        
        # If no active, get most recent
        if not assessment:
            assessment = Assessment.query.filter_by(
                user_id=user_id
            ).order_by(Assessment.created_at.desc()).first()
        
        if not assessment:
            return jsonify({'error': 'No assessment found'}), 404
        
        # Get all responses
        responses = AssessmentResponse.query.filter_by(
            assessment_id=assessment.id
        ).all()
        
        # Build category breakdown
        categories = {
            'market_conditions': {
                'name': 'Market conditions',
                'score': assessment.market_conditions_score,
                'subjects': {}
            },
            'customer_relationships': {
                'name': 'Customer relationships',
                'score': assessment.customer_relationships_score,
                'subjects': {}
            },
            'business_operations': {
                'name': 'Business operations',
                'score': assessment.business_operations_score,
                'subjects': {}
            },
            'business_predictability': {
                'name': 'Business predictability',
                'score': assessment.business_predictability_score,
                'subjects': {}
            },
            'investor_contemplation': {
                'name': 'Investor contemplation',
                'score': assessment.investor_contemplation_score,
                'subjects': {}
            },
            'due_diligence_ready': {
                'name': 'Due diligence ready',
                'score': assessment.due_diligence_ready_score,
                'subjects': {}
            },
            'goal_calibration': {
                'name': 'Goal calibration',
                'score': assessment.goal_calibration_score,
                'subjects': {}
            },
            'personal': {
                'name': 'Personal',
                'score': assessment.personal_score,
                'subjects': {}
            }
        }
        
        # Organize responses by category and subject
        for response in responses:
            if response.category in categories:
                subject_key = response.subject
                if subject_key not in categories[response.category]['subjects']:
                    categories[response.category]['subjects'][subject_key] = {
                        'name': response.subject,
                        'score': response.score,
                        'questions': []
                    }
                
                categories[response.category]['subjects'][subject_key]['questions'].append({
                    'id': response.id,
                    'question_id': response.question_id,
                    'question_text': response.question_text,
                    'answer_value': response.answer_value,
                    'answer_text': response.answer_text,
                    'score': response.score,
                    'comments': response.comments
                })
        
        return jsonify({
            'assessment_id': assessment.id,
            'overall_score': round(assessment.overall_score, 1),
            'initial_score': round(assessment.initial_score, 1),
            'readiness_score': round(assessment.readiness_score, 1),
            'attractiveness_score': round(assessment.attractiveness_score, 1),
            'answered_questions': assessment.answered_questions,
            'total_questions': assessment.total_questions,
            'completed': assessment.completed,
            'categories': categories,
            'created_at': assessment.created_at.isoformat(),
            'updated_at': assessment.updated_at.isoformat()
        }), 200
        
    except Exception as e:
        print(f"Error getting assessment: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@assessment_bp.route('/api/assessment/questions', methods=['GET'])
@jwt_required()
def get_assessment_questions():
    """Get all assessment questions organized by category"""
    try:
        # In production, this would come from database
        # For now, return structured question data
        questions = get_question_library()
        
        return jsonify({
            'total_questions': len(questions),
            'questions': questions
        }), 200
        
    except Exception as e:
        print(f"Error getting questions: {str(e)}")
        return jsonify({'error': str(e)}), 500


@assessment_bp.route('/api/assessment/response', methods=['POST'])
@jwt_required()
def save_response():
    """Save or update a single question response"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        assessment_id = data.get('assessment_id')
        question_id = data.get('question_id')
        answer_value = data.get('answer_value')
        answer_text = data.get('answer_text')
        comments = data.get('comments', '')
        
        # Debug logging
        print(f"\n=== SAVE RESPONSE DEBUG ===")
        print(f"User ID: {user_id}")
        print(f"Assessment ID from request: {assessment_id}")
        print(f"Question ID: {question_id}")
        print(f"Answer Value: {answer_value}")
        
        # Validate
        assessment = Assessment.query.get(assessment_id)
        print(f"Assessment found: {assessment}")
        if assessment:
            print(f"Assessment user_id: {assessment.user_id}")
            print(f"Matches current user: {assessment.user_id == int(user_id)}")
        print(f"=== END DEBUG ===\n")
        
        if not assessment or assessment.user_id != int(user_id):
            return jsonify({'error': 'Invalid assessment'}), 404
        
        # Check if response already exists
        response = AssessmentResponse.query.filter_by(
            assessment_id=assessment_id,
            question_id=question_id
        ).first()
        
        if response:
            # Update existing
            response.answer_value = answer_value
            response.answer_text = answer_text
            response.comments = comments
            response.calculate_score()
        else:
            # Create new response
            # Convert considerations to JSON string if it's a list
            considerations = data.get('considerations')
            if isinstance(considerations, list):
                considerations = json.dumps(considerations)
            
            response = AssessmentResponse(
                assessment_id=assessment_id,
                category=data.get('category'),
                subject=data.get('subject'),
                question_id=question_id,
                question_text=data.get('question_text'),
                answer_value=answer_value,
                answer_text=answer_text,
                comments=comments,
                rule_of_thumb=data.get('rule_of_thumb'),
                considerations=considerations
            )
            response.calculate_score()
            db.session.add(response)
        
        # Recalculate assessment scores
        assessment.calculate_scores()
        
        db.session.commit()
        
        # Check if this response generates a task
        if answer_value is not None and answer_value < 3:  # Low scores generate tasks
            task_title = data.get('related_task')
            if task_title:
                task = AssessmentTask(
                    assessment_id=assessment_id,
                    response_id=response.id,
                    title=task_title,
                    due_date=datetime.utcnow() + timedelta(days=30),
                    priority='High' if answer_value < 2 else 'Medium'
                )
                db.session.add(task)
                db.session.commit()
        
        return jsonify({
            'message': 'Response saved',
            'response_id': response.id,
            'score': response.score,
            'overall_score': round(assessment.overall_score, 1),
            'answered_questions': assessment.answered_questions
        }), 200
        
    except Exception as e:
        print(f"Error saving response: {str(e)}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@assessment_bp.route('/api/assessment/tasks', methods=['GET'])
@jwt_required()
def get_assessment_tasks():
    """Get all tasks generated from assessment"""
    try:
        user_id = get_jwt_identity()
        
        # Get user's assessments
        assessments = Assessment.query.filter_by(user_id=user_id).all()
        assessment_ids = [a.id for a in assessments]
        
        # Get all tasks
        tasks = AssessmentTask.query.filter(
            AssessmentTask.assessment_id.in_(assessment_ids)
        ).order_by(AssessmentTask.due_date.asc()).all()
        
        tasks_data = [{
            'id': task.id,
            'title': task.title,
            'description': task.description,
            'due_date': task.due_date.isoformat() if task.due_date else None,
            'status': task.status,
            'priority': task.priority,
            'created_at': task.created_at.isoformat()
        } for task in tasks]
        
        return jsonify({
            'total_tasks': len(tasks_data),
            'tasks': tasks_data
        }), 200
        
    except Exception as e:
        print(f"Error getting tasks: {str(e)}")
        return jsonify({'error': str(e)}), 500


@assessment_bp.route('/api/assessment/task/<int:task_id>/status', methods=['PUT'])
@jwt_required()
def update_task_status(task_id):
    """Update task status"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        task = AssessmentTask.query.get(task_id)
        if not task:
            return jsonify({'error': 'Task not found'}), 404
        
        # Verify ownership
        assessment = Assessment.query.get(task.assessment_id)
        if not assessment or assessment.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Update status
        task.status = data.get('status', task.status)
        db.session.commit()
        
        return jsonify({
            'message': 'Task updated',
            'task_id': task.id,
            'status': task.status
        }), 200
        
    except Exception as e:
        print(f"Error updating task: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


def get_question_library():
    """Return the full question library - in production this would be in database"""
    return [
        # Market Conditions Category
        {
            'question_id': 'mc_competitive_advantages',
            'category': 'market_conditions',
            'category_display': 'Market conditions',
            'subject': 'Competitive advantages',
            'question_text': 'To what extent does your business gain a competitive advantage from market factors (e.g. regulations, supplier lock-in, partnerships)?',
            'rule_of_thumb': 'Well established players in a market usually have gained a competitive advantage that highly affect market factors for others. The market advantage is strong when it prohibits new entries from e.g. distribution channels or customer segments.',
            'considerations': [
                'Do you have a contract with an important supplier that prohibits the supplier to sell to current or new competitors?',
                'Do you have certifications that qualify you to bid on certain contracts or sell certain products in general?',
                'Do you have strategic partnerships, e.g. a distribution contract, that a new competitor will not be able to easily get?'
            ],
            'answer_options': ['No advantage at all', 'Great advantage'],
            'related_task': 'Investigate the potential to create a partnership strategy and implement if possible'
        },
        {
            'question_id': 'mc_market_positioning',
            'category': 'market_conditions',
            'category_display': 'Market conditions',
            'subject': 'Market positioning',
            'question_text': 'How well positioned is your business in the market relative to competitors?',
            'rule_of_thumb': 'Strong market positioning comes from differentiation, brand recognition, and customer loyalty.',
            'considerations': [
                'Do you have a unique value proposition?',
                'Is your brand well-known in your target market?',
                'Do customers choose you over competitors consistently?'
            ],
            'answer_options': ['Poorly positioned', 'Market leader'],
            'related_task': 'Develop market positioning strategy and competitive analysis'
        },
        {
            'question_id': 'mc_market_prosperity',
            'category': 'market_conditions',
            'category_display': 'Market conditions',
            'subject': 'Market prosperity',
            'question_text': 'How prosperous is your target market? Is it growing or declining?',
            'rule_of_thumb': 'Growing markets are more attractive to buyers and command higher multiples.',
            'considerations': [
                'What is the market growth rate?',
                'Are there emerging trends that favor your business?',
                'How sensitive is your market to economic cycles?'
            ],
            'answer_options': ['Declining rapidly', 'Rapid growth'],
            'related_task': 'Research market trends and prepare market analysis report'
        },
        {
            'question_id': 'mc_barriers_to_entry',
            'category': 'market_conditions',
            'category_display': 'Market conditions',
            'subject': 'Barriers to entry',
            'question_text': 'How difficult is it for new competitors to enter your market?',
            'rule_of_thumb': 'High barriers to entry protect your market position and increase business value.',
            'considerations': [
                'What capital investment is required to compete?',
                'Are there regulatory or certification requirements?',
                'How strong are established relationships in your industry?'
            ],
            'answer_options': ['Very easy to enter', 'Nearly impossible'],
            'related_task': 'Document competitive moats and barriers to entry'
        },
        {
            'question_id': 'mc_market_growth',
            'category': 'market_conditions',
            'category_display': 'Market conditions',
            'subject': 'Market growth',
            'question_text': 'What is the expected growth trajectory for your industry over the next 3-5 years?',
            'rule_of_thumb': 'Industries with strong growth projections are more attractive to acquirers.',
            'considerations': [
                'What are the industry growth forecasts?',
                'Are there technological disruptions on the horizon?',
                'How is your company positioned to capture growth?'
            ],
            'answer_options': ['Declining', 'Exponential growth'],
            'related_task': 'Create 3-5 year market forecast and growth plan'
        },
        {
            'question_id': 'mc_replication',
            'category': 'market_conditions',
            'category_display': 'Market conditions',
            'subject': 'Replication',
            'question_text': 'How easily could a competitor replicate your business model?',
            'rule_of_thumb': 'Businesses that are difficult to replicate due to proprietary processes, IP, or relationships are more valuable.',
            'considerations': [
                'Do you have proprietary technology or processes?',
                'How long would it take a competitor to build what you have?',
                'Do you have protected intellectual property?'
            ],
            'answer_options': ['Very easy', 'Nearly impossible'],
            'related_task': 'Audit intellectual property and develop protection strategy'
        },
        
        # Customer Relationships Category
        {
            'question_id': 'cr_customer_concentration',
            'category': 'customer_relationships',
            'category_display': 'Customer relationships',
            'subject': 'Customer concentration',
            'question_text': 'What percentage of revenue comes from your top 3 customers?',
            'rule_of_thumb': 'Lower concentration reduces risk. Ideally, no single customer should represent more than 10-15% of revenue.',
            'considerations': [
                'Would losing your largest customer be catastrophic?',
                'Do you have contracts that protect recurring revenue?',
                'How diversified is your customer base?'
            ],
            'answer_options': ['Over 50%', 'Less than 15%'],
            'related_task': 'Develop customer diversification strategy'
        },
        {
            'question_id': 'cr_customer_retention',
            'category': 'customer_relationships',
            'category_display': 'Customer relationships',
            'subject': 'Customer retention',
            'question_text': 'What is your annual customer retention rate?',
            'rule_of_thumb': 'High retention (90%+) indicates strong product-market fit and customer satisfaction.',
            'considerations': [
                'What is your churn rate?',
                'Why do customers leave?',
                'Do you measure customer satisfaction regularly?'
            ],
            'answer_options': ['Below 60%', 'Above 95%'],
            'related_task': 'Implement customer retention improvement program'
        },
        {
            'question_id': 'cr_customer_lifetime_value',
            'category': 'customer_relationships',
            'category_display': 'Customer relationships',
            'subject': 'Customer lifetime value',
            'question_text': 'What is the ratio of Customer Lifetime Value (LTV) to Customer Acquisition Cost (CAC)?',
            'rule_of_thumb': 'A healthy SaaS business should have an LTV:CAC ratio of at least 3:1.',
            'considerations': [
                'Do you know your LTV and CAC metrics?',
                'How long does it take to recoup acquisition costs?',
                'Are margins improving over customer lifetime?'
            ],
            'answer_options': ['Less than 1:1', 'Greater than 5:1'],
            'related_task': 'Calculate and document LTV:CAC metrics'
        },
        {
            'question_id': 'cr_customer_contracts',
            'category': 'customer_relationships',
            'category_display': 'Customer relationships',
            'subject': 'Customer contracts',
            'question_text': 'What percentage of revenue is under long-term contracts (1+ years)?',
            'rule_of_thumb': 'Long-term contracts provide predictable revenue and reduce buyer risk.',
            'considerations': [
                'Do you have multi-year agreements?',
                'Are contracts automatically renewing?',
                'What are typical cancellation terms?'
            ],
            'answer_options': ['Less than 20%', 'Over 80%'],
            'related_task': 'Review and strengthen customer contract terms'
        },
        
        # Business Operations Category
        {
            'question_id': 'bo_process_documentation',
            'category': 'business_operations',
            'category_display': 'Business operations',
            'subject': 'Process documentation',
            'question_text': 'How well documented are your key business processes?',
            'rule_of_thumb': 'Comprehensive documentation enables smooth transition and reduces buyer risk.',
            'considerations': [
                'Do you have written procedures for all key processes?',
                'Can a new employee follow your documentation?',
                'Are processes updated regularly?'
            ],
            'answer_options': ['Nothing documented', 'Fully documented'],
            'related_task': 'Create comprehensive operations manual'
        },
        {
            'question_id': 'bo_management_team',
            'category': 'business_operations',
            'category_display': 'Business operations',
            'subject': 'Management team',
            'question_text': 'How capable and independent is your management team?',
            'rule_of_thumb': 'A strong management team that can operate without the owner significantly increases value.',
            'considerations': [
                'Can the business run without you for 3+ months?',
                'Do you have depth in key leadership positions?',
                'Are compensation and incentives competitive?'
            ],
            'answer_options': ['Owner-dependent', 'Fully independent'],
            'related_task': 'Develop management team succession plan'
        },
        {
            'question_id': 'bo_systems_technology',
            'category': 'business_operations',
            'category_display': 'Business operations',
            'subject': 'Systems & technology',
            'question_text': 'How modern and scalable are your business systems and technology?',
            'rule_of_thumb': 'Modern, integrated systems reduce operational risk and support growth.',
            'considerations': [
                'Are your systems cloud-based and scalable?',
                'Do you have integrated CRM, ERP, or other key systems?',
                'How much technical debt exists?'
            ],
            'answer_options': ['Legacy/manual', 'Modern/automated'],
            'related_task': 'Audit technology stack and create modernization plan'
        },
        {
            'question_id': 'bo_scalability',
            'category': 'business_operations',
            'category_display': 'Business operations',
            'subject': 'Scalability',
            'question_text': 'How easily can your business scale to 2-3x current size?',
            'rule_of_thumb': 'Buyers pay premiums for businesses with clear paths to scale without proportional cost increases.',
            'considerations': [
                'Are there capacity constraints?',
                'Can you grow without major infrastructure investment?',
                'Do unit economics improve at scale?'
            ],
            'answer_options': ['Cannot scale', 'Highly scalable'],
            'related_task': 'Create scalability assessment and growth plan'
        },
        
        # Business Predictability Category
        {
            'question_id': 'bp_revenue_predictability',
            'category': 'business_predictability',
            'category_display': 'Business predictability',
            'subject': 'Revenue predictability',
            'question_text': 'How predictable is your monthly/quarterly revenue?',
            'rule_of_thumb': 'Recurring or highly predictable revenue reduces risk and increases valuation multiples.',
            'considerations': [
                'What percentage is recurring vs. one-time?',
                'How accurate are your revenue forecasts?',
                'Do you have visibility into future revenue?'
            ],
            'answer_options': ['Highly volatile', 'Highly predictable'],
            'related_task': 'Implement revenue forecasting and tracking system'
        },
        {
            'question_id': 'bp_financial_controls',
            'category': 'business_predictability',
            'category_display': 'Business predictability',
            'subject': 'Financial controls',
            'question_text': 'How robust are your financial controls and reporting?',
            'rule_of_thumb': 'Strong financial controls and clean books are essential for due diligence.',
            'considerations': [
                'Do you have monthly financial statements?',
                'Are your books audit-ready?',
                'Do you have proper internal controls?'
            ],
            'answer_options': ['Minimal controls', 'Enterprise-grade'],
            'related_task': 'Strengthen financial controls and reporting'
        },
        {
            'question_id': 'bp_kpi_tracking',
            'category': 'business_predictability',
            'category_display': 'Business predictability',
            'subject': 'KPI tracking',
            'question_text': 'Do you regularly track and report on key performance indicators (KPIs)?',
            'rule_of_thumb': 'Data-driven businesses with clear KPIs are more attractive and valuable.',
            'considerations': [
                'Do you have defined KPIs for each department?',
                'How often do you review metrics?',
                'Are decisions based on data or gut feel?'
            ],
            'answer_options': ['No KPI tracking', 'Comprehensive dashboards'],
            'related_task': 'Establish KPI framework and tracking system'
        },
        
        # Additional categories would continue with similar structure...
        # For brevity, I'm including representative questions from each category
        
        # Investor Contemplation
        {
            'question_id': 'ic_exit_readiness',
            'category': 'investor_contemplation',
            'category_display': 'Investor contemplation',
            'subject': 'Exit readiness',
            'question_text': 'How prepared is your business for sale or exit in the next 12-24 months?',
            'rule_of_thumb': 'Exit readiness should be built over 2-3 years minimum.',
            'considerations': [
                'Have you cleaned up your cap table?',
                'Are financial records audit-ready?',
                'Is legal structure optimized for sale?'
            ],
            'answer_options': ['Not prepared', 'Fully prepared'],
            'related_task': 'Create 24-month exit readiness timeline'
        },
        
        # Due Diligence Ready
        {
            'question_id': 'ddr_documentation',
            'category': 'due_diligence_ready',
            'category_display': 'Due diligence ready',
            'subject': 'Documentation',
            'question_text': 'How organized and accessible are your business documents?',
            'rule_of_thumb': 'Having documents organized in a virtual data room accelerates deals.',
            'considerations': [
                'Do you have all contracts in one place?',
                'Are corporate documents current?',
                'Can you quickly respond to due diligence requests?'
            ],
            'answer_options': ['Disorganized', 'Fully organized'],
            'related_task': 'Create virtual data room with all key documents'
        },
        
        # Goal Calibration
        {
            'question_id': 'gc_exit_goals',
            'category': 'goal_calibration',
            'category_display': 'Goal calibration',
            'subject': 'Exit goals',
            'question_text': 'How clear are your personal and financial goals for exit?',
            'rule_of_thumb': 'Clear goals help determine the right exit strategy and timing.',
            'considerations': [
                'What is your target exit value?',
                'What will you do after exit?',
                'How important is legacy vs. maximum value?'
            ],
            'answer_options': ['No clear goals', 'Very clear goals'],
            'related_task': 'Define detailed exit goals and success criteria'
        },
        
        # Personal
        {
            'question_id': 'p_emotional_readiness',
            'category': 'personal',
            'category_display': 'Personal',
            'subject': 'Emotional readiness',
            'question_text': 'How emotionally prepared are you to exit your business?',
            'rule_of_thumb': 'Emotional readiness is often the biggest obstacle to successful exits.',
            'considerations': [
                'Is your identity tied to the business?',
                'Have you grieved the loss of your role?',
                'Do you have plans for what comes next?'
            ],
            'answer_options': ['Not ready', 'Fully ready'],
            'related_task': 'Work with exit coach on emotional transition planning'
        }
    ]
