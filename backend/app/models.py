# models.py - Add/Update these models in your models file

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Assessment(db.Model):
    __tablename__ = 'assessments'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Scores
    overall_score = db.Column(db.Integer, default=0)
    financial_score = db.Column(db.Integer, default=0)
    operational_score = db.Column(db.Integer, default=0)
    dependency_score = db.Column(db.Integer, default=0)
    
    # Progress tracking
    answered_questions = db.Column(db.Integer, default=0)
    total_questions = db.Column(db.Integer, default=21)  # Or however many questions you have
    
    # Status and archiving
    is_archived = db.Column(db.Boolean, default=False)
    archived_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='assessments')
    responses = db.relationship('AssessmentResponse', backref='assessment', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'overall_score': self.overall_score,
            'financial_score': self.financial_score,
            'operational_score': self.operational_score,
            'dependency_score': self.dependency_score,
            'answered_questions': self.answered_questions,
            'total_questions': self.total_questions,
            'is_archived': self.is_archived,
            'archived_at': self.archived_at.isoformat() if self.archived_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class AssessmentResponse(db.Model):
    __tablename__ = 'assessment_responses'
    
    id = db.Column(db.Integer, primary_key=True)
    assessment_id = db.Column(db.Integer, db.ForeignKey('assessments.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=False)
    
    # Response data
    response_value = db.Column(db.Integer, nullable=False)  # 0-3 score
    response_text = db.Column(db.String(50), nullable=True)  # "No", "Partial", "Yes", "Clear"
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    question = db.relationship('Question', backref='responses')
    
    def to_dict(self):
        return {
            'id': self.id,
            'assessment_id': self.assessment_id,
            'question_id': self.question_id,
            'response_value': self.response_value,
            'response_text': self.response_text,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class Question(db.Model):
    __tablename__ = 'questions'
    
    id = db.Column(db.Integer, primary_key=True)
    question_text = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)  # Financial, Operational, Dependency
    subcategory = db.Column(db.String(100), nullable=True)  # e.g., "Revenue Quality", "Team"
    weight = db.Column(db.Float, default=1.0)  # For weighted scoring
    tooltip = db.Column(db.Text, nullable=True)  # Help text
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'question_text': self.question_text,
            'category': self.category,
            'subcategory': self.subcategory,
            'weight': self.weight,
            'tooltip': self.tooltip
        }

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=True)  # Nullable for OAuth users
    
    # Profile info
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    company_name = db.Column(db.String(100))
    
    # OAuth providers
    google_id = db.Column(db.String(100), unique=True, nullable=True)
    apple_id = db.Column(db.String(100), unique=True, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'company_name': self.company_name,
            'created_at': self.created_at.isoformat()
        }
