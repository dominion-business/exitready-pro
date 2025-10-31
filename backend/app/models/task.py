from datetime import datetime
from app.models import db

class Task(db.Model):
    __tablename__ = 'tasks'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    question_id = db.Column(db.String(100), db.ForeignKey('assessment_questions.question_id'), nullable=False)

    # Task details
    title = db.Column(db.String(500), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(50), default='not_started')  # not_started, in_progress, completed
    priority = db.Column(db.String(50), default='medium')  # low, medium, high
    is_system_task = db.Column(db.Boolean, default=False)  # True for seeded tasks, False for user-created

    # Dates
    start_date = db.Column(db.Date)
    due_date = db.Column(db.Date)
    completed_at = db.Column(db.DateTime)

    # Notes and attachments
    notes = db.Column(db.Text)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'question_id': self.question_id,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'is_system_task': self.is_system_task,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<Task {self.title}>'
