from app import create_app, db
from app.models import User
from flask_jwt_extended import create_access_token

app = create_app()
with app.app_context():
    user = User.query.filter_by(email="teste9@gmail.com").first()
    token = create_access_token(identity=user.id)
    print(token)
