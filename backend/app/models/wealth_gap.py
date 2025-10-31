"""
Wealth Gap Model for tracking client's financial readiness for exit
"""

from datetime import datetime
from app.models import db

class WealthGap(db.Model):
    __tablename__ = 'wealth_gaps'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Wealth Goal Calculation Method
    wealth_goal_method = db.Column(db.String(50), default='single_number')  # 'single_number' or 'monthly_needs'

    # Single Number Method
    wealth_goal_amount = db.Column(db.Float, default=0.0)

    # Monthly Needs Method
    monthly_cash_need = db.Column(db.Float, default=0.0)
    years_of_income = db.Column(db.Integer, default=20)  # How many years to plan for
    annual_inflation_rate = db.Column(db.Float, default=3.0)  # Expected inflation %
    annual_return_rate = db.Column(db.Float, default=7.0)  # Expected investment return %

    # Current Financial Position
    current_net_worth = db.Column(db.Float, default=0.0)  # Not including business value
    liquid_assets = db.Column(db.Float, default=0.0)
    retirement_accounts = db.Column(db.Float, default=0.0)
    real_estate_equity = db.Column(db.Float, default=0.0)
    other_investments = db.Column(db.Float, default=0.0)

    # Liabilities (optional tracking)
    total_liabilities = db.Column(db.Float, default=0.0)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def calculate_wealth_goal(self):
        """Calculate wealth goal based on selected method"""
        if self.wealth_goal_method == 'single_number':
            return self.wealth_goal_amount
        elif self.wealth_goal_method == 'monthly_needs':
            # Present Value calculation for monthly needs
            # PV = PMT * [(1 - (1 + r)^-n) / r]
            # Where PMT = monthly payment, r = monthly rate, n = number of months

            monthly_rate = (self.annual_return_rate - self.annual_inflation_rate) / 100 / 12
            num_months = self.years_of_income * 12

            if monthly_rate == 0:
                # If real return is 0, it's just monthly_need * months
                present_value = self.monthly_cash_need * num_months
            else:
                # Standard present value annuity formula
                present_value = self.monthly_cash_need * ((1 - (1 + monthly_rate) ** -num_months) / monthly_rate)

            return present_value
        return 0.0

    def calculate_wealth_gap(self):
        """Calculate the wealth gap: Wealth Goal - Current Net Worth"""
        wealth_goal = self.calculate_wealth_goal()
        return wealth_goal - self.current_net_worth

    def calculate_net_worth_breakdown(self):
        """Calculate detailed net worth breakdown"""
        total_assets = (
            self.liquid_assets +
            self.retirement_accounts +
            self.real_estate_equity +
            self.other_investments
        )
        return {
            'liquid_assets': self.liquid_assets,
            'retirement_accounts': self.retirement_accounts,
            'real_estate_equity': self.real_estate_equity,
            'other_investments': self.other_investments,
            'total_assets': total_assets,
            'total_liabilities': self.total_liabilities,
            'net_worth': total_assets - self.total_liabilities
        }

    def to_dict(self):
        wealth_goal = self.calculate_wealth_goal()
        wealth_gap = self.calculate_wealth_gap()
        net_worth_breakdown = self.calculate_net_worth_breakdown()

        return {
            'id': self.id,
            'user_id': self.user_id,
            'wealth_goal_method': self.wealth_goal_method,
            'wealth_goal_amount': self.wealth_goal_amount,
            'monthly_cash_need': self.monthly_cash_need,
            'years_of_income': self.years_of_income,
            'annual_inflation_rate': self.annual_inflation_rate,
            'annual_return_rate': self.annual_return_rate,
            'current_net_worth': self.current_net_worth,
            'liquid_assets': self.liquid_assets,
            'retirement_accounts': self.retirement_accounts,
            'real_estate_equity': self.real_estate_equity,
            'other_investments': self.other_investments,
            'total_liabilities': self.total_liabilities,
            'calculated_wealth_goal': wealth_goal,
            'calculated_wealth_gap': wealth_gap,
            'net_worth_breakdown': net_worth_breakdown,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<WealthGap user_id={self.user_id} goal={self.calculate_wealth_goal()}>'
