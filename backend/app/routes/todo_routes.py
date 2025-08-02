from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Todo, User
from app.extensions import db
from app.utils.email_utils import send_email
from datetime import datetime

bp = Blueprint('todos', __name__, url_prefix='/api')

@bp.route('/todos', methods=['GET'])
@jwt_required()
def get_todos():
    user_id = get_jwt_identity()
    todos = Todo.query.filter_by(user_id=user_id).order_by(Todo.created_at.desc()).all()
    return jsonify([{
        'id': t.id,
        'title': t.title,
        'description': t.description,
        'completed': t.completed,
        'created_at': t.created_at.isoformat(),
        'updated_at': t.updated_at.isoformat()
    } for t in todos]), 200

@bp.route('/todos', methods=['POST'])
@jwt_required()
def create_todo():
    user_id = get_jwt_identity()
    data = request.get_json()
    title = data.get('title')
    description = data.get('description', '')

    if not title:
        return jsonify({'error': 'Title is required'}), 400

    todo = Todo(title=title, description=description, user_id=user_id)
    db.session.add(todo)
    db.session.commit()

    user = User.query.get(user_id)
    if user:
        send_email(
            to_email=user.email,
            subject="New Todo Created",
            body=f"Hello {user.name},\n\nYou created a new todo:\nTitle: {title}\n\nBest,\nTodo App"
        )

    return jsonify({
        'id': todo.id,
        'title': todo.title,
        'description': todo.description,
        'completed': todo.completed,
        'created_at': todo.created_at.isoformat(),
        'updated_at': todo.updated_at.isoformat()
    }), 201

@bp.route('/todos/<int:todo_id>', methods=['PUT'])
@jwt_required()
def update_todo(todo_id):
    user_id = get_jwt_identity()
    todo = Todo.query.filter_by(id=todo_id, user_id=user_id).first()

    if not todo:
        return jsonify({'error': 'Todo not found'}), 404

    data = request.get_json()
    if 'title' in data:
        todo.title = data['title']
    if 'description' in data:
        todo.description = data['description']
    if 'completed' in data:
        todo.completed = data['completed']

    todo.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        'id': todo.id,
        'title': todo.title,
        'description': todo.description,
        'completed': todo.completed,
        'created_at': todo.created_at.isoformat(),
        'updated_at': todo.updated_at.isoformat()
    })

@bp.route('/todos/<int:todo_id>', methods=['DELETE'])
@jwt_required()
def delete_todo(todo_id):
    user_id = get_jwt_identity()
    todo = Todo.query.filter_by(id=todo_id, user_id=user_id).first()

    if not todo:
        return jsonify({'error': 'Todo not found'}), 404

    db.session.delete(todo)
    db.session.commit()
    return jsonify({'message': 'Todo deleted successfully'})
