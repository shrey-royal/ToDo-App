from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from app.models import User
from app.extensions import db
from app.utils.google_auth import verify_google_token

bp = Blueprint('auth', __name__, url_prefix='/api')

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    name = data.get('name')
    password = data.get('password')

    if not email or not name or not password:
        return jsonify({'error': 'Missing required fields'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    password_hash = generate_password_hash(password)
    user = User(email=email, name=name, password_hash=password_hash)

    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=user.id)
    return jsonify({'access_token': token, 'user': {'id': user.id, 'email': user.email, 'name': user.name}}), 201

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()

    if not user or not user.password_hash or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = create_access_token(identity=user.id)
    return jsonify({'access_token': token, 'user': {'id': user.id, 'email': user.email, 'name': user.name}})

@bp.route('/google-auth', methods=['POST'])
def google_auth():
    data = request.get_json()
    token = data.get('token')

    idinfo = verify_google_token(token)
    if not idinfo:
        return jsonify({'error': 'Invalid Google token'}), 401

    user = User.query.filter_by(google_id=idinfo['google_id']).first()
    if not user:
        user = User(email=idinfo['email'], name=idinfo['name'], google_id=idinfo['google_id'])
        db.session.add(user)
        db.session.commit()

    access_token = create_access_token(identity=user.id)
    return jsonify({'access_token': access_token, 'user': {'id': user.id, 'email': user.email, 'name': user.name}})
