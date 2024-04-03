from flask import Flask, request, Response
from flask_cors import CORS
from datamanage import DataManager
import bcrypt, base64
import jwt
from cryptography.hazmat.primitives import serialization
from datetime import datetime, timedelta
from flask_sock import Sock, Server, ConnectionClosed
import json

app = Flask(__name__)
dm = DataManager()
cors = CORS(app, resources={r"*": {"origins": "*"}})
app.config['CORS_HEADERS'] = 'Content-Type'
sock = Sock(app)
sessions = {}


with open(".keys/id_rsa", 'r') as f:
    prv_key = serialization.load_ssh_private_key(f.read().encode(), b'')

with open(".keys/id_rsa.pub", 'r') as f:
    pub_key = serialization.load_ssh_public_key(f.read().encode())


class WsMessage:
    def __init__(self, json):
        self.type = json['type']
        self.subtype = json['subtype']
        self.data = json['data']


def jwt_create(account_id):
    expiration = datetime.utcnow() + timedelta(hours=24)
    payload = {
        'account_id': account_id,
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
    
    result = dm.accountRepo.findByLogin(login)
    if result == -1:
        return Response(status=500)
    elif result != None:
        return Response("LOGIN_IS_USED", status=400)

    salt = bcrypt.gensalt()
    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), salt)

    enc_salt = base64.b64encode(salt).decode('utf-8')
    enc_hashed_pw = base64.b64encode(hashed_pw).decode('utf-8')

    result = dm.accountRepo.insert(login, enc_hashed_pw, enc_salt)
    if result == -1:
        return Response(status=500)
    
    return Response(status=200)


@app.route('/signin', methods=['POST'])
def signin():
    data = request.json
    login = data['login']
    password = data['password']

    account = dm.accountRepo.findByLogin(login)
    if account == -1:
        return Response(status=500)
    if account == None:
        return Response(status=400)
    
    hashed_pw = base64.b64decode(account.password.encode('utf-8'))

    if bcrypt.checkpw(password.encode('utf-8'), hashed_pw):
        token = jwt_create(account.id)
        return Response(token, status=200)
    else:
        return Response(status=401)


@app.route('/users')
def getAllUsers():
    result = dm.accountRepo.getAll()
    if result == -1:
        return Response(status=500)
    return result


@app.route('/account')
def getAccountId():
    login = request.args.get('login')
    if login is None:
        return Response(status=400)
    
    account = dm.accountRepo.findByLogin(login)
    if account == -1:
        return Response(status=500)
    elif account == None:
        return Response(status=404)
    else:
        return Response(account.id, status=200)


@app.route('/chat', methods=['POST'])
def createNewChat():
    name = request.json['name']
    isGroup = request.json['is_group']
    members = request.json['members']

    result = dm.chatRepo.createNew(name, isGroup, members)
    if result == -1:
        return Response(status=500)
    return Response(status=200)


@sock.route('/ws/<token>')
def ws_connect(ws: Server, token):
    jwt_data = jwt_decode(token)
    if jwt_data is None:
        return
    
    account_id = jwt_data['account_id']
    if account_id in sessions:
        sessions[account_id].close()
    sessions[account_id] = ws
    print(sessions)

    while True:
        try:
            msg = json.loads(ws.receive())
            print(msg)
            type = msg['type']
            subtype = msg['subtype']
            data = msg['data']

            if type == 'chat':
                if subtype == 'new':
                    members = data['members']
                    members.append(account_id)
                    result = dm.chatRepo.createNew(data['name'], data['isGroup'], members)
                    if result:
                        return

                    if not data['isGroup']:
                        member1 = dm.accountRepo.findById(members[0])
                        member2 = dm.accountRepo.findById(members[1])
                        
                        if member1.id in sessions:
                            msg['name'] = member2.login
                            sessions[member1.id].send(json.dumps(msg))
                        
                        if member2.id in sessions:
                            msg['name'] = member1.login
                            sessions[member2.id].send(json.dumps(msg))

                    else:
                        for member in members:
                            if member in sessions:
                                sessions[member].send(json.dumps(msg))

        except ConnectionClosed:
            del sessions[jwt_data['account_id']]
            print('connection closed')
            raise ConnectionClosed        
    


if dm != None:
    app.run(host='0.0.0.0', debug=True)