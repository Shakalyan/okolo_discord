from flask import Flask, request, Response, send_file
from flask_cors import CORS
from datamanage import DataManager
import bcrypt, base64
import jwt
from cryptography.hazmat.primitives import serialization
from datetime import datetime, timedelta
from flask_sock import Sock, Server, ConnectionClosed
from psycopg2 import DatabaseError
import json
import io

app = Flask(__name__)
dm = DataManager()
cors = CORS(app, resources={r"*": {"origins": "*"}})
app.config['CORS_HEADERS'] = 'Content-Type'
sock = Sock(app)

sessions = {}
rooms = {}


with open(".keys/id_rsa", 'r') as f:
    prv_key = serialization.load_ssh_private_key(f.read().encode(), b'')

with open(".keys/id_rsa.pub", 'r') as f:
    pub_key = serialization.load_ssh_public_key(f.read().encode())


class WsMessage:
    def __init__(self, json):
        self.type = json['type']
        self.subtype = json['subtype']
        self.data = json['data']


def jwt_create(account_id, login):
    expiration = datetime.utcnow() + timedelta(hours=24)
    payload = {
        'accountId': account_id,
        'login': login,
        'exp': expiration
    }
    return jwt.encode(payload, prv_key, 'RS256')


def jwt_decode(token):
    return jwt.decode(token, pub_key, ['RS256'])
    

def db_except(func):
    def wrapper_func(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except (Exception, DatabaseError) as error:
            print(error)
            return Response(status=500)
    wrapper_func.__name__ = func.__name__
    return wrapper_func


def auth_except(func):
    def wrapper_func(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except (jwt.ExpiredSignatureError, jwt.DecodeError) as error:
            print(error)
            return Response(status=401)
    wrapper_func.__name__ = func.__name__
    return wrapper_func

def getToken():
    return request.args.get('token')

@app.route('/ping')
def ping():
    return 'pong'


@app.route('/signup', methods=['POST'])
@db_except
def signup():
    data = request.json
    login = data['login']
    password = data['password']

    if len(login) < 3:
        return Response("SHORT_LOGIN", status=400)
    
    if len(password) < 5:
        return Response("SHORT_PASSWORD", status=400)
    
    result = dm.accountRepo.findByLogin(login)
    if result != None:
        return Response("LOGIN_IS_USED", status=400)

    salt = bcrypt.gensalt()
    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), salt)

    enc_salt = base64.b64encode(salt).decode('utf-8')
    enc_hashed_pw = base64.b64encode(hashed_pw).decode('utf-8')

    dm.accountRepo.insert(login, enc_hashed_pw, enc_salt)
    
    return Response(status=200)


@app.route('/signin', methods=['POST'])
@db_except
def signin():
    data = request.json
    login = data['login']
    password = data['password']

    account = dm.accountRepo.findByLogin(login)
    if account == None:
        return Response(status=400)
    
    hashed_pw = base64.b64decode(account.password.encode('utf-8'))

    if bcrypt.checkpw(password.encode('utf-8'), hashed_pw):
        token = jwt_create(account.id, login)
        return Response(token, status=200)
    else:
        return Response(status=401)


@app.route('/account')
@db_except
@auth_except
def getAccountId():
    jwt_decode(getToken())

    login = request.args.get('login')
    if login is None:
        return Response(status=400)
    
    account = dm.accountRepo.findByLogin(login)
    if account == None:
        return Response(status=404)
    else:
        return Response(account.id, status=200)


@app.route('/chats')
@db_except
@auth_except
def getAllChats():
    token = getToken()
    auth = jwt_decode(token)
    accountId = auth['accountId']

    chats = dm.chatRepo.findAllByAccountId(accountId)
    
    for chat in chats:
        if not chat.isGroup:
            if chat.members[0]['id'] == accountId:
                chat.name = chat.members[1]['login']
            else:
                chat.name = chat.members[0]['login']

    return json.dumps(chats, default=lambda o: o.__dict__)


@app.route('/account/echo')
@auth_except
def accountEcho():
    token = getToken()
    auth = jwt_decode(token)
    accountData = {
        'id': auth['accountId'],
        'login': auth['login']
    }
    return accountData


@app.route('/messages')
@db_except
@auth_except
def getAllMessagesByChatId():
    jwt_decode(getToken())
    chatId = request.args.get('chatId')

    messages = dm.messageRepo.getAllByChatId(chatId)
    for message in messages:
        account = dm.accountRepo.findById(message.accountId)
        message.login = account.login

    response = {
        'messages': messages,
        'members': dm.chatRepo.findById(chatId).members
    }

    return json.dumps(response, default=lambda o: o.__dict__)


@app.route("/servers")
@db_except
@auth_except
def getAllServersByAccountId():
    auth = jwt_decode(getToken())
    servers = dm.serverRepo.getAllByAccountId(auth['accountId'])
    return json.dumps(servers, default=lambda o: o.__dict__)


@app.route("/server")
@db_except
@auth_except
def getServerById():
    jwt_decode(getToken())
    server = dm.serverRepo.findById(request.args.get('serverId'))
    if not server:
        return Response(status=404)
    
    for voiceChannel in server.voiceChannels:
        if rooms.get(voiceChannel.id):
            voiceChannel.activeMembers = rooms.get(voiceChannel.id)
    
    return json.dumps(server, default=lambda o: o.__dict__)


@app.route("/server/messages")
@db_except
@auth_except
def getTextChannelMessagesById():
    jwt_decode(getToken())
    messages = dm.serverRepo.findTextChannelMessages(request.args.get("textChannelId"))
    for message in messages:
        account = dm.accountRepo.findById(message.accountId)
        message.login = account.login
    return json.dumps(messages, default=lambda o: o.__dict__)


@app.route("/account/avatar", methods=['GET', 'POST'])
@db_except
@auth_except
def accountAvatar():
    auth = jwt_decode(getToken())
    if request.method == 'GET':
        accountId = request.args.get('accountId')
        avatar = dm.accountRepo.findById(accountId).avatar
        return send_file(io.BytesIO(avatar), mimetype='image')
    elif request.method == 'POST':
        accountId = auth['accountId']
        dm.accountRepo.changeAvatar(accountId, request.files['avatar'].read())
        return Response(status=200)


def wsSendMsg(id, msg):
    print(id)
    if sessions.get(id):
        sessions[id]['ws'].send(json.dumps(msg, default=lambda o: o.__dict__))


def close_session(accountData):
    accountId = accountData['id']
    if sessions.get(accountId) and sessions[accountId]['roomId']:
        roomId = sessions[accountId]['roomId']
        rooms[roomId].remove(accountData)
        msg = {
            'type': 'room',
            'subtype': 'leave',
            'data': {
                'id': roomId,
                'accountData': accountData
            }
        }
        voiceChannel = dm.serverRepo.findVoiceChannel(roomId)
        server = dm.serverRepo.findById(voiceChannel.serverId)
        for member in server.members:
            if member.id != accountId:
                wsSendMsg(member.id, msg)


@sock.route('/ws/<token>')
def ws_connect(ws: Server, token):
    jwt_data = jwt_decode(token)
    if jwt_data is None:
        return
    
    accountId = jwt_data['accountId']
    accountLogin = jwt_data['login']
    accountData = {'id': accountId, 'login': accountLogin}
    if accountId in sessions:
        print('\n\nACCOUNT ID HIT\n\n')
        sessions[accountId]['ws'].close()
    sessions[accountId] = {
        'ws': ws,
        'roomId': None
    }
    print(f'NEW CLIENT CONNECTED ({accountData}) SESSIONS: {sessions}')

    while True:
        try:
            msg = json.loads(ws.receive())
            print(msg)
            type = msg['type']
            subtype = msg['subtype']
            data = msg['data']

            if type == 'chat':
                if subtype == 'new':
                    memberIds = data['members']
                    memberIds.append(accountId)
                    chatId = dm.chatRepo.createNew(data['name'], data['isGroup'], memberIds)
                    if chatId == -1:
                        print('DATABASE FAILURE')
                        continue 

                    msg['data']['id'] = str(chatId)

                    if not data['isGroup']:
                        member1 = dm.accountRepo.findById(memberIds[0])
                        member2 = dm.accountRepo.findById(memberIds[1])
                        
                        msg['data']['name'] = member2.login
                        wsSendMsg(member1.id, msg)
                        
                        msg['data']['name'] = member1.login
                        wsSendMsg(member2.id, msg)

                    else:
                        for memberId in memberIds:
                            wsSendMsg(memberId, msg)
                
                if subtype == 'newMessage':
                    msgDatetime = datetime.utcnow()
                    msgId = dm.messageRepo.insert(accountId, data['chatId'], data['text'], msgDatetime)
                    chat = dm.chatRepo.findById(data['chatId'])

                    msg['data']['id'] = msgId
                    msg['data']['accountId'] = accountId
                    msg['data']['login'] = accountLogin
                    msg['data']['datetime'] = str(msgDatetime)
                    for member in chat.members:
                        wsSendMsg(member['id'], msg)

            elif type == 'server':
                if subtype == 'new':
                    memberIds = data['members']
                    memberIds.append(accountId)
                    serverId = dm.serverRepo.createNew(data['name'], memberIds)
                    msg['data']['id'] = serverId

                    for memberId in memberIds:
                        wsSendMsg(memberId, msg)

                elif subtype == 'newVoiceChannel':
                    serverId = data['serverId']
                    channelName = data['name']
                    voiceChannelId = dm.serverRepo.insertVoiceChannel(serverId, channelName)
                    
                    msg['data']['id'] = voiceChannelId
                    msg['data']['activeMembers'] = []

                    serverMembers = dm.serverRepo.findMembers(serverId)
                    for member in serverMembers:
                        wsSendMsg(member.id, msg)
                
                elif subtype == 'newTextChannel':
                    serverId = data['serverId']
                    channelName = data['name']
                    textChannelId = dm.serverRepo.insertTextChannel(serverId, channelName)
                    
                    msg['data']['id'] = textChannelId

                    serverMembers = dm.serverRepo.findMembers(serverId)
                    for member in serverMembers:
                        wsSendMsg(member.id, msg)
                
                elif subtype == 'newMessage':
                    
                    msgDatetime = datetime.utcnow()
                    textChannelId = data['chatId']
                    msgId = dm.messageRepo.insert(accountId, textChannelId, data['text'], msgDatetime)
                    textChannel = dm.serverRepo.findTextChannel(textChannelId)
                    members = dm.serverRepo.findMembers(textChannel.serverId)

                    msg['data']['id'] = msgId
                    msg['data']['login'] = accountLogin
                    msg['data']['datetime'] = str(msgDatetime)
                    print(msg)
                    for member in members:
                        wsSendMsg(member.id, msg)

            elif type == 'room':
                if subtype == 'join':
                    print('JOIN ROOM')
                    roomId = data['id']
                    if not rooms.get(roomId):
                        rooms[roomId] = []
                    
                    rooms[roomId].append(accountData)
                    sessions[accountId]['roomId'] = roomId

                    msg['data']['accountData'] = accountData
                    voiceChannel = dm.serverRepo.findVoiceChannel(roomId)
                    server = dm.serverRepo.findById(voiceChannel.serverId)
                    msg['data']['serverId'] = server.id

                    for member in server.members:
                        wsSendMsg(member.id, msg)
                
                elif subtype == 'leave':
                    roomId = data['id']
                    rooms[roomId].remove(accountData)
                    sessions[accountId]['roomId'] = None

                    msg['data']['accountData'] = accountData
                    voiceChannel = dm.serverRepo.findVoiceChannel(roomId)
                    server = dm.serverRepo.findById(voiceChannel.serverId)
                    msg['data']['serverId'] = server.id

                    for member in server.members:
                        wsSendMsg(member.id, msg)
            
            elif type == 'webrtc':
                for member in rooms[data['roomId']]:
                    if member['id'] != accountId:
                        wsSendMsg(member['id'], msg)
                    

        except ConnectionClosed:
            print(f'\n\n\n{accountData} CLIENT CONNECTION CLOSING...')
            print(f'SESSIONS: {sessions}')
            print(f'ROOMS: {rooms}\n')
            if sessions.get(accountId) and sessions[accountId]['roomId']:
                print("CONNECTION CLOSED, SEND LEAVE MESSAGE")
                roomId = sessions[accountId]['roomId']
                rooms[roomId].remove(accountData)
                msg = {
                    'type': 'room',
                    'subtype': 'leave',
                    'data': {
                        'id': roomId,
                        'accountData': accountData
                    }
                }
                voiceChannel = dm.serverRepo.findVoiceChannel(roomId)
                server = dm.serverRepo.findById(voiceChannel.serverId)
                for member in server.members:
                    if member.id != accountId:
                        print(f'SENDING LEAVE MESSAGE TO {member.id}')
                        wsSendMsg(member.id, msg)
                print('LEAVE MESSAGE SENT')

            if sessions.get(accountId):
                #sessions[accountId]['ws'].close()
                del sessions[accountId]
            print(f'{accountLogin} CLIENT CONNECTION CLOSED')
            print(f'SESSIONS: {sessions}')
            print(f'ROOMS: {rooms}\n\n\n')
            raise ConnectionClosed        
    


if dm != None:
    app.run(host='0.0.0.0', debug=True)