from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Import all models
from app.models.user import User
from app.models.business import Business
from app.models.valuation import Valuation, IndustryMultiple
from app.models.valuation_history import ValuationHistory
from app.models.assessment import Assessment, AssessmentResponse, AssessmentTask, AssessmentQuestion