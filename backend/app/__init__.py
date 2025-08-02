from flask import Flask
from .config import Config
from .extensions import db, jwt, cors
from .routes import auth_routes, todo_routes, user_routes

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app)

    app.register_blueprint(auth_routes.bp)
    app.register_blueprint(todo_routes.bp)
    app.register_blueprint(user_routes.bp)

    @app.route('/health')
    def health():
        return {"status": "healthy"}

    with app.app_context():
        db.create_all()

    return app
