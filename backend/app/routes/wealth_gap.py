"""
Wealth Gap Routes - Financial readiness calculations
"""

from flask import Blueprint, request, jsonify
from app.models import db
from app.models.wealth_gap import WealthGap
from app.routes.assessment import token_required
import logging

logger = logging.getLogger(__name__)

wealth_gap_bp = Blueprint('wealth_gap', __name__)


@wealth_gap_bp.route('', methods=['GET'])
@token_required
def get_wealth_gap(current_user_id):
    """Get wealth gap data for current user"""
    try:
        wealth_gap = WealthGap.query.filter_by(user_id=current_user_id).first()

        if not wealth_gap:
            # Return empty/default structure if not found
            return jsonify({
                'wealth_gap': None,
                'message': 'No wealth gap data found. Please calculate your wealth gap.'
            }), 200

        return jsonify({'wealth_gap': wealth_gap.to_dict()}), 200

    except Exception as e:
        logger.error(f"Error fetching wealth gap: {e}")
        return jsonify({'error': 'Failed to fetch wealth gap data'}), 500


@wealth_gap_bp.route('', methods=['POST'])
@token_required
def save_wealth_gap(current_user_id):
    """Save or update wealth gap data"""
    try:
        data = request.get_json()

        # Get existing or create new
        wealth_gap = WealthGap.query.filter_by(user_id=current_user_id).first()

        if not wealth_gap:
            wealth_gap = WealthGap(user_id=current_user_id)
            db.session.add(wealth_gap)

        # Update fields
        wealth_gap.wealth_goal_method = data.get('wealth_goal_method', 'single_number')

        # Single number method
        if 'wealth_goal_amount' in data:
            wealth_gap.wealth_goal_amount = float(data['wealth_goal_amount'] or 0)

        # Monthly needs method
        if 'monthly_cash_need' in data:
            wealth_gap.monthly_cash_need = float(data['monthly_cash_need'] or 0)
        if 'years_of_income' in data:
            wealth_gap.years_of_income = int(data['years_of_income'] or 20)
        if 'annual_inflation_rate' in data:
            wealth_gap.annual_inflation_rate = float(data['annual_inflation_rate'] or 3.0)
        if 'annual_return_rate' in data:
            wealth_gap.annual_return_rate = float(data['annual_return_rate'] or 7.0)

        # Current financial position
        if 'current_net_worth' in data:
            wealth_gap.current_net_worth = float(data['current_net_worth'] or 0)
        if 'liquid_assets' in data:
            wealth_gap.liquid_assets = float(data['liquid_assets'] or 0)
        if 'retirement_accounts' in data:
            wealth_gap.retirement_accounts = float(data['retirement_accounts'] or 0)
        if 'real_estate_equity' in data:
            wealth_gap.real_estate_equity = float(data['real_estate_equity'] or 0)
        if 'other_investments' in data:
            wealth_gap.other_investments = float(data['other_investments'] or 0)
        if 'total_liabilities' in data:
            wealth_gap.total_liabilities = float(data['total_liabilities'] or 0)

        # Auto-calculate current_net_worth if individual assets provided
        if any(k in data for k in ['liquid_assets', 'retirement_accounts', 'real_estate_equity', 'other_investments', 'total_liabilities']):
            calculated_net_worth = (
                wealth_gap.liquid_assets +
                wealth_gap.retirement_accounts +
                wealth_gap.real_estate_equity +
                wealth_gap.other_investments -
                wealth_gap.total_liabilities
            )
            wealth_gap.current_net_worth = calculated_net_worth

        db.session.commit()

        return jsonify({
            'wealth_gap': wealth_gap.to_dict(),
            'message': 'Wealth gap data saved successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error saving wealth gap: {e}")
        return jsonify({'error': 'Failed to save wealth gap data'}), 500


@wealth_gap_bp.route('/calculate', methods=['POST'])
@token_required
def calculate_wealth_gap(current_user_id):
    """Calculate wealth gap without saving"""
    try:
        data = request.get_json()

        # Create temporary object for calculation
        temp_gap = WealthGap()
        temp_gap.wealth_goal_method = data.get('wealth_goal_method', 'single_number')
        temp_gap.wealth_goal_amount = float(data.get('wealth_goal_amount', 0))
        temp_gap.monthly_cash_need = float(data.get('monthly_cash_need', 0))
        temp_gap.years_of_income = int(data.get('years_of_income', 20))
        temp_gap.annual_inflation_rate = float(data.get('annual_inflation_rate', 3.0))
        temp_gap.annual_return_rate = float(data.get('annual_return_rate', 7.0))
        temp_gap.current_net_worth = float(data.get('current_net_worth', 0))

        wealth_goal = temp_gap.calculate_wealth_goal()
        wealth_gap = temp_gap.calculate_wealth_gap()

        return jsonify({
            'wealth_goal': wealth_goal,
            'wealth_gap': wealth_gap,
            'current_net_worth': temp_gap.current_net_worth
        }), 200

    except Exception as e:
        logger.error(f"Error calculating wealth gap: {e}")
        return jsonify({'error': 'Failed to calculate wealth gap'}), 500
