from google.auth.transport import requests
from google.oauth2 import id_token
from flask import current_app

def verify_google_token(token):
    try:
        CLIENT_ID = current_app.config['GOOGLE_CLIENT_ID']
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), CLIENT_ID)

        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')

        return {
            'google_id': idinfo['sub'],
            'email': idinfo['email'],
            'name': idinfo['name']
        }
    except Exception as e:
        print(f"Google token verification failed: {str(e)}")
        return None
