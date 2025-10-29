"""
Assessment Model for Exit Readiness Gap Analysis
Stores user responses to 120+ questions across 8 major categories
"""

from datetime import datetime
from app.models import db

class Assessment(db.Model):
    __tablename__ = 'assessments'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    assessment_type = db.Column(db.String(50), default='attractiveness')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Overall scores
    overall_score = db.Column(db.Float, default=0.0)
    answered_questions = db.Column(db.Integer, default=0)
    
    # Main assessment scores
    attractiveness_score = db.Column(db.Float, default=0.0)
    readiness_score = db.Column(db.Float, default=0.0)
    
    # ATTRACTIVENESS CATEGORY SCORES (10 categories)
    financial_performance_score = db.Column(db.Float, default=0.0)
    revenue_quality_score = db.Column(db.Float, default=0.0)
    customer_concentration_score = db.Column(db.Float, default=0.0)
    management_team_score = db.Column(db.Float, default=0.0)
    competitive_position_score = db.Column(db.Float, default=0.0)
    growth_potential_score = db.Column(db.Float, default=0.0)
    intellectual_property_score = db.Column(db.Float, default=0.0)
    legal_compliance_score = db.Column(db.Float, default=0.0)
    owner_dependency_score = db.Column(db.Float, default=0.0)
    strategic_positioning_score = db.Column(db.Float, default=0.0)
    
    # Relationships
    responses = db.relationship('AssessmentResponse', backref='assessment', lazy=True, cascade='all, delete-orphan')
    tasks = db.relationship('AssessmentTask', backref='assessment', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Assessment {self.id} - {self.assessment_type}>'
    
    def calculate_scores(self):
        """Calculate overall and category scores based on responses"""
        responses = AssessmentResponse.query.filter_by(assessment_id=self.id).all()
        
        if not responses:
            self.overall_score = 0.0
            self.attractiveness_score = 0.0
            self.financial_performance_score = 0.0
            self.revenue_quality_score = 0.0
            self.customer_concentration_score = 0.0
            self.management_team_score = 0.0
            self.competitive_position_score = 0.0
            self.growth_potential_score = 0.0
            self.intellectual_property_score = 0.0
            self.legal_compliance_score = 0.0
            self.owner_dependency_score = 0.0
            self.strategic_positioning_score = 0.0
            self.answered_questions = 0
            return
        
        # Count answered questions
        self.answered_questions = len(responses)
        
        # Calculate overall score (average of all responses)
        total_score = sum(r.score for r in responses)
        self.overall_score = total_score / len(responses) if responses else 0.0
        
        # ATTRACTIVENESS SCORE = Overall score for this assessment
        self.attractiveness_score = self.overall_score
        
        # TODO: Calculate category scores after adding question library
        # For now, set all to overall score
        self.financial_performance_score = self.overall_score
        self.revenue_quality_score = self.overall_score
        self.customer_concentration_score = self.overall_score
        self.management_team_score = self.overall_score
        self.competitive_position_score = self.overall_score
        self.growth_potential_score = self.overall_score
        self.intellectual_property_score = self.overall_score
        self.legal_compliance_score = self.overall_score
        self.owner_dependency_score = self.overall_score
        self.strategic_positioning_score = self.overall_score


class AssessmentResponse(db.Model):
    """Individual question response"""
    __tablename__ = 'assessment_responses'
    
    id = db.Column(db.Integer, primary_key=True)
    assessment_id = db.Column(db.Integer, db.ForeignKey('assessments.id'), nullable=False)
    
    # Question info
    category = db.Column(db.String(100), nullable=False)
    subject = db.Column(db.String(200), nullable=False)
    question_id = db.Column(db.String(100), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    
    # Answer
    answer_value = db.Column(db.Integer, nullable=True)  # 1-6 scale
    answer_text = db.Column(db.String(200), nullable=True)
    score = db.Column(db.Float, default=0.0)  # Normalized 0-100 score
    
    # Metadata
    rule_of_thumb = db.Column(db.Text, nullable=True)
    considerations = db.Column(db.Text, nullable=True)
    comments = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def calculate_score(self):
        """Calculate score based on answer value (1-6 scale)"""
        if self.answer_value is not None:
            # New 1-6 scoring scale
            score_map = {
                1: 17,
                2: 33,
                3: 50,
                4: 67,
                5: 83,
                6: 100
            }
            self.score = float(score_map.get(self.answer_value, 0))
        else:
            self.score = 0.0


class AssessmentTask(db.Model):
    """Related tasks generated from assessment"""
    __tablename__ = 'assessment_tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    assessment_id = db.Column(db.Integer, db.ForeignKey('assessments.id'), nullable=False)
    response_id = db.Column(db.Integer, db.ForeignKey('assessment_responses.id'), nullable=True)
    
    title = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text, nullable=True)
    due_date = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(50), default='To do')
    priority = db.Column(db.String(50), default='Medium')
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AssessmentQuestion(db.Model):
    """Master list of assessment questions"""
    __tablename__ = 'assessment_questions'
    
    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.String(100), unique=True, nullable=False)
    
    category = db.Column(db.String(100), nullable=False)
    category_display = db.Column(db.String(200), nullable=False)
    subject = db.Column(db.String(200), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    
    # Guidance
    rule_of_thumb = db.Column(db.Text, nullable=True)
    considerations = db.Column(db.Text, nullable=True)
    
    # Answer options (stored as JSON string)
    answer_options = db.Column(db.Text, nullable=True)
    
    # Weighting
    weight = db.Column(db.Float, default=1.0)
    impacts_readiness = db.Column(db.Boolean, default=True)
    impacts_attractiveness = db.Column(db.Boolean, default=True)
    
    order = db.Column(db.Integer, default=0)
    active = db.Column(db.Boolean, default=True)