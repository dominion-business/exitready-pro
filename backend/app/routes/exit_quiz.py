"""
Exit Strategy Quiz Routes
"""

from flask import Blueprint, request, jsonify
from app.models import db
from app.models.exit_quiz import ExitQuizResponse
from app.routes.assessment import token_required
from app.services.exit_quiz_engine import QUIZ_QUESTIONS, EXIT_STRATEGIES, calculate_exit_scores
import json
import logging

logger = logging.getLogger(__name__)

exit_quiz_bp = Blueprint('exit_quiz', __name__)


@exit_quiz_bp.route('/questions', methods=['GET'])
@token_required
def get_quiz_questions(current_user_id):
    """Get all quiz questions"""
    try:
        return jsonify({
            'questions': QUIZ_QUESTIONS,
            'total_questions': len(QUIZ_QUESTIONS)
        }), 200
    except Exception as e:
        logger.error(f"Error fetching quiz questions: {e}")
        return jsonify({'error': 'Failed to fetch quiz questions'}), 500


@exit_quiz_bp.route('/strategies', methods=['GET'])
@token_required
def get_exit_strategies(current_user_id):
    """Get information about all exit strategies"""
    try:
        return jsonify({
            'strategies': EXIT_STRATEGIES
        }), 200
    except Exception as e:
        logger.error(f"Error fetching exit strategies: {e}")
        return jsonify({'error': 'Failed to fetch exit strategies'}), 500


@exit_quiz_bp.route('/submit', methods=['POST'])
@token_required
def submit_quiz(current_user_id):
    """Submit quiz responses and calculate recommendations"""
    try:
        data = request.get_json()
        responses = data.get('responses', {})

        if not responses:
            return jsonify({'error': 'No responses provided'}), 400

        # Validate that we have all required responses
        if len(responses) < len(QUIZ_QUESTIONS):
            return jsonify({'error': 'Not all questions have been answered'}), 400

        # Calculate scores and recommendations
        results = calculate_exit_scores(responses)

        # Get top 3 recommendations
        top_3 = results['top_recommendations']

        # Save to database
        existing_response = ExitQuizResponse.query.filter_by(user_id=current_user_id).first()

        if existing_response:
            # Update existing
            existing_response.responses = json.dumps(responses)
            existing_response.top_recommendation = top_3[0] if len(top_3) > 0 else None
            existing_response.second_recommendation = top_3[1] if len(top_3) > 1 else None
            existing_response.third_recommendation = top_3[2] if len(top_3) > 2 else None
            existing_response.all_scores = json.dumps(results['all_scores'])
        else:
            # Create new
            quiz_response = ExitQuizResponse(
                user_id=current_user_id,
                responses=json.dumps(responses),
                top_recommendation=top_3[0] if len(top_3) > 0 else None,
                second_recommendation=top_3[1] if len(top_3) > 1 else None,
                third_recommendation=top_3[2] if len(top_3) > 2 else None,
                all_scores=json.dumps(results['all_scores'])
            )
            db.session.add(quiz_response)

        db.session.commit()

        # Format response with full strategy details
        recommendations = []
        for i, strategy_key in enumerate(top_3, 1):
            strategy_info = EXIT_STRATEGIES.get(strategy_key, {})
            recommendations.append({
                'rank': i,
                'key': strategy_key,
                'name': strategy_info.get('name', ''),
                'category': strategy_info.get('category', ''),
                'description': strategy_info.get('description', ''),
                'best_for': strategy_info.get('best_for', ''),
                'score': results['all_scores'].get(strategy_key, 0)
            })

        return jsonify({
            'success': True,
            'recommendations': recommendations,
            'detailed_results': results['detailed_results'],
            'all_scores': results['all_scores']
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error submitting quiz: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to process quiz submission'}), 500


@exit_quiz_bp.route('/results', methods=['GET'])
@token_required
def get_quiz_results(current_user_id):
    """Get user's most recent quiz results"""
    try:
        quiz_response = ExitQuizResponse.query.filter_by(
            user_id=current_user_id
        ).order_by(ExitQuizResponse.created_at.desc()).first()

        if not quiz_response:
            return jsonify({
                'success': False,
                'message': 'No quiz results found. Please take the quiz first.'
            }), 404

        # Build recommendations with full details
        recommendations = []
        for i, strategy_key in enumerate([
            quiz_response.top_recommendation,
            quiz_response.second_recommendation,
            quiz_response.third_recommendation
        ], 1):
            if strategy_key:
                strategy_info = EXIT_STRATEGIES.get(strategy_key, {})
                all_scores = json.loads(quiz_response.all_scores) if quiz_response.all_scores else {}
                recommendations.append({
                    'rank': i,
                    'key': strategy_key,
                    'name': strategy_info.get('name', ''),
                    'category': strategy_info.get('category', ''),
                    'description': strategy_info.get('description', ''),
                    'best_for': strategy_info.get('best_for', ''),
                    'score': all_scores.get(strategy_key, 0)
                })

        return jsonify({
            'success': True,
            'quiz_id': quiz_response.id,
            'recommendations': recommendations,
            'completed_at': quiz_response.created_at.isoformat() if quiz_response.created_at else None,
            'all_scores': json.loads(quiz_response.all_scores) if quiz_response.all_scores else {}
        }), 200

    except Exception as e:
        logger.error(f"Error fetching quiz results: {e}")
        return jsonify({'error': 'Failed to fetch quiz results'}), 500


@exit_quiz_bp.route('/history', methods=['GET'])
@token_required
def get_quiz_history(current_user_id):
    """Get user's quiz history"""
    try:
        quiz_responses = ExitQuizResponse.query.filter_by(
            user_id=current_user_id
        ).order_by(ExitQuizResponse.created_at.desc()).all()

        history = []
        for quiz_response in quiz_responses:
            history.append({
                'id': quiz_response.id,
                'top_recommendation': quiz_response.top_recommendation,
                'second_recommendation': quiz_response.second_recommendation,
                'third_recommendation': quiz_response.third_recommendation,
                'completed_at': quiz_response.created_at.isoformat() if quiz_response.created_at else None
            })

        return jsonify({
            'success': True,
            'history': history
        }), 200

    except Exception as e:
        logger.error(f"Error fetching quiz history: {e}")
        return jsonify({'error': 'Failed to fetch quiz history'}), 500
