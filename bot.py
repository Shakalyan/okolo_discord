from websockets.sync.client import connect
import json
from aiortc import RTCIceCandidate, RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaPlayer
import asyncio

jwt = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhY2NvdW50SWQiOiJlNTM3ZmFjYi04NGJjLTRkN2ItYTZiOC0zNGZlZjYyNWQ4OTgiLCJsb2dpbiI6InRlc3Rib3QifQ.Zqj1o38i1dy3T50HGpiRPardj_MDlRopPVpOYz8LRPjLgSL_Ck3CEohA4EwZx727hUKfQNqXQqn2cp1LFbLNJmIk_zHd8suBIO14pIh_qnYA43rfPu2Oujvx7gnAaPwywRntpcubcD_sCLjxZqwV2t_Fif01mMajX2Q_jI5DbwCT1Cdwk_9NjsVvrxq3TH2po5hd3bg1WL4b75ydo81Rpmi-N7pGFQ9BrdQJyCpzDw06nK0pyRPAhx5g94173ivGChXGJaZaa_YM-nmYt80X3P8STeQk1m8EA1SHzWHfBnex3ozx0cQV9LjoG6gjhoxUGuZOVSk_RI6WJe2OvEIlnQ"
roomId = '5e10bd2b-5ce7-4736-8dc2-cda91b682b3b'
accountId = 'e537facb-84bc-4d7b-a6b8-34fef625d898'

def wsSend(ws, msg):
    ws.send(json.dumps(msg))

def wsRecv(ws):
    return json.loads(ws.recv())


def joinRoom(ws):
    msg = {
        'type': 'room',
        'subtype': 'join',
        'data': {
            'id': roomId
        }
    }
    wsSend(ws, msg)


def startCall(ws):
    msg = {
        'type': 'webrtc',
        'subtype': 'startCall',
        'data': {
            'roomId': roomId,
            'senderId': accountId
        }
    }
    wsSend(ws, msg)


async def sendOffer(ws, pc: RTCPeerConnection, receiverId):
    await pc.setLocalDescription(await pc.createOffer())
    msg = {
        'type': 'webrtc',
        'subtype': 'offer',
        'data': {
            'roomId': roomId,
            'senderId': accountId,
            'receiverId': receiverId,
            'dsc': {
                'type': pc.localDescription.type,
                'sdp': pc.localDescription.sdp
            }
        }
    }
    wsSend(ws, msg)


async def sendAnswer(ws, pc: RTCPeerConnection, receiverId, offer):
    await pc.setRemoteDescription(dscToObj(offer))
    await pc.setLocalDescription(await pc.createAnswer())
    msg = {
        'type': 'webrtc',
        'subtype': 'answer',
        'data': {
            'roomId': roomId,
            'senderId': accountId,
            'receiverId': receiverId,
            'dsc': {
                'type': pc.localDescription.type,
                'sdp': pc.localDescription.sdp
            }
        }
    }
    wsSend(ws, msg)


def dscToObj(dsc):
    return RTCSessionDescription(dsc['sdp'], dsc['type'])

def candidateToObj(candidate):
    cnd = candidate['candidate']
    parts = cnd.split(' ')
    foundation = parts[0].split(':')[1]
    component = parts[1]
    protocol = parts[2]
    priority = parts[3]
    ip = parts[4]
    port = parts[5]
    type = parts[7]

    sdpMid = candidate.get('sdpMid')
    sdpMLineIndex = candidate.get('sdpMLineIndex')

    return RTCIceCandidate(component, foundation, ip, port, priority, protocol, type, sdpMid=sdpMid, sdpMLineIndex=sdpMLineIndex)

def createPc(player):
    pc = RTCPeerConnection()
    pc.on('track', lambda track: print('TRACK!!!'))
    pc.addTrack(player.audio)
    return pc


async def test():
    pcs = {}

    with connect(f'ws://localhost:5000/ws/{jwt}') as ws:
        joinRoom(ws)
        startCall(ws)
        player = MediaPlayer('./song.mp3')

        try:
            while True:
                msg = wsRecv(ws)
                print(msg['subtype'])
                if (msg['type'] == 'room'):
                    if (msg['subtype'] == 'leave'):
                        msg_roomId = msg['data']['id']
                        msg_accountId = msg['data']['accountData']['id']
                        if roomId == msg_roomId and pcs.get(msg_accountId):
                            print("DELETE PC")
                            del pcs[msg_accountId]
                            print(pcs)

                if (msg['type'] == 'webrtc'):
                    if (msg['subtype'] == 'startCall'):
                        pc = createPc(player)
                        receiverId = msg['data']['senderId']
                        pcs[receiverId] = pc
                        await sendOffer(ws, pc, receiverId)
                    
                    if (msg['subtype'] == 'offer'):
                        pc = createPc(player)
                        receiverId = msg['data']['senderId']
                        pcs[receiverId] = pc
                        await sendAnswer(ws, pc, receiverId, msg['data']['dsc'])
                    
                    if (msg['subtype'] == 'answer'):
                        receiverId = msg['data']['senderId']
                        pc = pcs[receiverId]
                        await pc.setRemoteDescription(dscToObj(msg['data']['dsc']))
                    
                    if (msg['subtype'] == 'candidate'):
                        receiverId = msg['data']['senderId']
                        pc = pcs[receiverId]
                        candidate = candidateToObj(msg['data']['candidate'])
                        await pc.addIceCandidate(candidate)
                        

        except KeyboardInterrupt:
            print('exit')


loop = asyncio.get_event_loop()
loop.run_until_complete(test())