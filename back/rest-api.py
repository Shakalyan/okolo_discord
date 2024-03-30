from flask import Flask, request, Response
from flask_cors import CORS
from datamanage import DataManager
import bcrypt, base64
import jwt
from cryptography.hazmat.primitives import serialization
from datetime import datetime, timedelta

app = Flask(__name__)
dm = DataManager()
cors = CORS(app, resources={r"*": {"origins": "*"}})
app.config['CORS_HEADERS'] = 'Content-Type'

with open(".keys/id_rsa", 'r') as f:
    prv_key = serialization.load_ssh_private_key(f.read().encode(), b'')

with open(".keys/id_rsa.pub", 'r') as f:
    pub_key = serialization.load_ssh_public_key(f.read().encode())


def jwt_create(login):
    expiration = datetime.utcnow() + timedelta(hours=24)
    payload = {
        'login': login,
        'exp': expiration
    }
    return jwt.encode(payload, prv_key, 'RS256')


def jwt_decode(token):
    try:
        return jwt.decode(token, pub_key, ['RS256'])
    except (jwt.ExpiredSignatureError, jwt.DecodeError):
        return None


@app.route('/ping')
def ping():
    return 'pong'


@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    login = data['login']
    password = data['password']

    if len(login) < 3:
        return Response("SHORT_LOGIN", status=400)
    
    if len(password) < 5:
        return Response("SHORT_PASSWORD", status=400)
    
    result = dm.userRepo.findByLogin(login)
    if result == -1:
        return Response(status=500)
    elif result != None:
        return Response("LOGIN_IS_USED", status=400)

    salt = bcrypt.gensalt()
    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), salt)

    enc_salt = base64.b64encode(salt).decode('utf-8')
    enc_hashed_pw = base64.b64encode(hashed_pw).decode('utf-8')

    result = dm.userRepo.insert(login, enc_hashed_pw, enc_salt)
    if result == -1:
        return Response(status=500)
    
    return Response(status=200)


@app.route('/signin', methods=['POST'])
def signin():
    data = request.json
    login = data['login']
    password = data['password']

    account = dm.userRepo.findByLogin(login)
    if account == -1:
        return Response(status=500)
    if account == None:
        return Response(status=400)
    
    print(account.password)
    hashed_pw = base64.b64decode(account.password.encode('utf-8'))
    print(hashed_pw)

    if bcrypt.checkpw(password.encode('utf-8'), hashed_pw):
        return Response(status=200)
    else:
        return Response(status=401)


@app.route('/users')
def getAllUsers():
    result = dm.userRepo.getAll()
    if result == -1:
        return Response(status=500)
    return result
    
if dm != None:
    print(dm)
    app.run(host='0.0.0.0', debug=True)