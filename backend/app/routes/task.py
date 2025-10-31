from flask import Blueprint, request, jsonify
from app.models import db
from app.models.task import Task
from app.models.assessment import AssessmentQuestion
from app.routes.assessment import token_required
from datetime import datetime

task_bp = Blueprint('task', __name__)

@task_bp.route('/api/tasks', methods=['GET'])
@token_required
def get_tasks(current_user):
    """Get all tasks for the current user with optional filtering"""
    try:
        # Get query parameters for filtering
        status = request.args.get('status')
        question_id = request.args.get('question_id')
        priority = request.args.get('priority')

        # Build query
        query = Task.query.filter_by(user_id=current_user)

        if status:
            query = query.filter_by(status=status)
        if question_id:
            query = query.filter_by(question_id=question_id)
        if priority:
            query = query.filter_by(priority=priority)

        tasks = query.order_by(Task.created_at.desc()).all()

        # Get question details for each task
        tasks_with_questions = []
        for task in tasks:
            task_dict = task.to_dict()
            question = AssessmentQuestion.query.filter_by(question_id=task.question_id).first()
            if question:
                task_dict['question'] = {
                    'question_id': question.question_id,
                    'subject': question.subject,
                    'category': question.category,
                    'category_display': question.category_display
                }
            tasks_with_questions.append(task_dict)

        return jsonify({
            'success': True,
            'tasks': tasks_with_questions
        })

    except Exception as e:
        print(f"Error fetching tasks: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@task_bp.route('/api/tasks/<int:task_id>', methods=['GET'])
@token_required
def get_task(current_user, task_id):
    """Get a specific task"""
    try:
        task = Task.query.filter_by(id=task_id, user_id=current_user).first()

        if not task:
            return jsonify({'success': False, 'error': 'Task not found'}), 404

        task_dict = task.to_dict()
        question = AssessmentQuestion.query.filter_by(question_id=task.question_id).first()
        if question:
            task_dict['question'] = {
                'question_id': question.question_id,
                'subject': question.subject,
                'category': question.category,
                'category_display': question.category_display
            }

        return jsonify({
            'success': True,
            'task': task_dict
        })

    except Exception as e:
        print(f"Error fetching task: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@task_bp.route('/api/tasks', methods=['POST'])
@token_required
def create_task(current_user):
    """Create a new task"""
    try:
        data = request.get_json()

        # Validate required fields
        if not data.get('title'):
            return jsonify({'success': False, 'error': 'Title is required'}), 400
        if not data.get('question_id'):
            return jsonify({'success': False, 'error': 'Question ID is required'}), 400

        # Verify question exists
        question = AssessmentQuestion.query.filter_by(question_id=data['question_id']).first()
        if not question:
            return jsonify({'success': False, 'error': 'Invalid question ID'}), 400

        # Create task
        task = Task(
            user_id=current_user,
            question_id=data['question_id'],
            title=data['title'],
            description=data.get('description'),
            status=data.get('status', 'not_started'),
            priority=data.get('priority', 'medium'),
            due_date=datetime.fromisoformat(data['due_date']).date() if data.get('due_date') else None,
            notes=data.get('notes')
        )

        db.session.add(task)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Task created successfully',
            'task': task.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        print(f"Error creating task: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@task_bp.route('/api/tasks/<int:task_id>', methods=['PUT'])
@token_required
def update_task(current_user, task_id):
    """Update an existing task"""
    try:
        task = Task.query.filter_by(id=task_id, user_id=current_user).first()

        if not task:
            return jsonify({'success': False, 'error': 'Task not found'}), 404

        data = request.get_json()

        # Update fields
        if 'title' in data:
            task.title = data['title']
        if 'description' in data:
            task.description = data['description']
        if 'status' in data:
            task.status = data['status']
            # Set completed_at when status changes to completed
            if data['status'] == 'completed' and not task.completed_at:
                task.completed_at = datetime.utcnow()
            elif data['status'] != 'completed':
                task.completed_at = None
        if 'priority' in data:
            task.priority = data['priority']
        if 'due_date' in data:
            task.due_date = datetime.fromisoformat(data['due_date']).date() if data['due_date'] else None
        if 'notes' in data:
            task.notes = data['notes']

        task.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Task updated successfully',
            'task': task.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        print(f"Error updating task: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@task_bp.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@token_required
def delete_task(current_user, task_id):
    """Delete a task"""
    try:
        task = Task.query.filter_by(id=task_id, user_id=current_user).first()

        if not task:
            return jsonify({'success': False, 'error': 'Task not found'}), 404

        db.session.delete(task)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Task deleted successfully'
        })

    except Exception as e:
        db.session.rollback()
        print(f"Error deleting task: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@task_bp.route('/api/tasks/stats', methods=['GET'])
@token_required
def get_task_stats(current_user):
    """Get task statistics for the current user"""
    try:
        total_tasks = Task.query.filter_by(user_id=current_user).count()
        not_started = Task.query.filter_by(user_id=current_user, status='not_started').count()
        in_progress = Task.query.filter_by(user_id=current_user, status='in_progress').count()
        under_review = Task.query.filter_by(user_id=current_user, status='under_review').count()
        completed = Task.query.filter_by(user_id=current_user, status='completed').count()
        not_relevant = Task.query.filter_by(user_id=current_user, status='not_relevant').count()

        # Calculate relevant tasks (exclude not_relevant)
        relevant_tasks = total_tasks - not_relevant

        # Get tasks by priority
        high_priority = Task.query.filter_by(user_id=current_user, priority='high').count()
        medium_priority = Task.query.filter_by(user_id=current_user, priority='medium').count()
        low_priority = Task.query.filter_by(user_id=current_user, priority='low').count()

        # Get overdue tasks
        today = datetime.utcnow().date()
        overdue = Task.query.filter(
            Task.user_id == current_user,
            Task.status != 'completed',
            Task.due_date < today
        ).count()

        return jsonify({
            'success': True,
            'stats': {
                'total': total_tasks,
                'not_started': not_started,
                'in_progress': in_progress,
                'under_review': under_review,
                'completed': completed,
                'not_relevant': not_relevant,
                'relevant_tasks': relevant_tasks,
                'high_priority': high_priority,
                'medium_priority': medium_priority,
                'low_priority': low_priority,
                'overdue': overdue,
                'completion_rate': round((completed / relevant_tasks * 100) if relevant_tasks > 0 else 0, 1)
            }
        })

    except Exception as e:
        print(f"Error fetching task stats: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
