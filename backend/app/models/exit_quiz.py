"""
Exit Strategy Quiz Model
Stores quiz responses and recommended exit strategies
"""

from datetime import datetime
from app.models import db


class ExitQuizResponse(db.Model):
    """Store user's exit strategy quiz responses"""
    __tablename__ = 'exit_quiz_responses'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Quiz responses (stored as JSON)
    responses = db.Column(db.Text, nullable=False)  # JSON string of all answers

    # Scoring results
    top_recommendation = db.Column(db.String(100))
    second_recommendation = db.Column(db.String(100))
    third_recommendation = db.Column(db.String(100))

    # Detailed scores for all options (JSON)
    all_scores = db.Column(db.Text)  # JSON with scores for all exit types

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = db.relationship('User', backref=db.backref('exit_quiz_responses', lazy=True))

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'user_id': self.user_id,
            'responses': json.loads(self.responses) if self.responses else {},
            'top_recommendation': self.top_recommendation,
            'second_recommendation': self.second_recommendation,
            'third_recommendation': self.third_recommendation,
            'all_scores': json.loads(self.all_scores) if self.all_scores else {},
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
