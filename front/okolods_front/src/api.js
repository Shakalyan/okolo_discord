export const backendHost = "192.168.1.113:5000";

export function makeUrl(endpoint) {
    let url = `http://${backendHost}${endpoint}`;
    return url;
}

export function sendQuery(url, method) {
    return fetch(url, {
        method: method,
    });
}

export function sendJSONQuery(url, method, body) {
    return fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
    });
}

export function api_signin(login, password) {
    let body = {
        login: login,
        password: password
    };
    return sendJSONQuery(makeUrl('/signin'), 'POST', body);
}

export function api_signup(login, password) {
    let body = {
        login: login,
        password: password
    };
    return sendJSONQuery(makeUrl('/signup'), 'POST', body);
}

export function api_ping() {
    return sendQuery(makeUrl('/ping'), 'GET');
}

export function api_getAccountChats() {
    let token = localStorage.getItem('token')
    return sendQuery(makeUrl(`/chats?token=${token}`), 'GET');
}

export function api_accountEcho() {
    let token = localStorage.getItem('token')
    return sendQuery(makeUrl(`/account/echo?token=${token}`), 'GET');
}

export function api_getAccountId(login) {
    let token = localStorage.getItem('token')
    let url = makeUrl(`/account?login=${login}&token=${token}`)
    return sendQuery(url, 'GET');
}

export function api_getAllMessagesByChatId(chatId) {
    let token = localStorage.getItem('token');
    let url = makeUrl(`/messages?chatId=${chatId}&token=${token}`)
    return sendQuery(url, 'GET')
}

export function api_getAccountServers() {
    let token = localStorage.getItem('token');
    return sendQuery(makeUrl(`/servers?token=${token}`))
}

export function api_getServerById(serverId) {
    let token = localStorage.getItem('token')
    let url = makeUrl(`/server?serverId=${serverId}&token=${token}`)
    return sendQuery(url)
}

export function api_getTextChannelMessages(textChannelId) {
    let token = localStorage.getItem('token')
    let url = makeUrl(`/server/messages?textChannelId=${textChannelId}&token=${token}`)
    return sendQuery(url);
}

export function wsapi_createChat(ws, name, isGroup, members) {
    let msg = {
        type: 'chat',
        subtype: 'new',
        data: {
            name: name,
            isGroup: isGroup,
            members: members
        }
    };
    ws.send(JSON.stringify(msg));
}

export function wsapi_leaveVoiceChat(ws, chatId) {
    let msg = {
        type: "room",
        subtype: "leave",
        data: {
            id: chatId
        }
    };
    ws.send(JSON.stringify(msg));
}

export function wsapi_joinVoiceChat(ws, chatId) {
    let msg = {
        type: "room",
        subtype: "join",
        data: {
            id: chatId
        }
    };
    ws.send(JSON.stringify(msg));
}

export function wsapi_webrtcStartCall(ws, chatId, senderId) {
    let msg = {
        type: "webrtc",
        subtype: "startCall",
        data: {
            roomId: chatId,
            senderId: senderId
        }
    };
    ws.send(JSON.stringify(msg));
}

export function wsapi_webrtcOffer(ws, chatId, senderId, receiverId, dsc) {
    let msg = {
        type: "webrtc",
        subtype: "offer",
        data: {
            roomId: chatId,
            senderId: senderId,
            receiverId: receiverId,
            dsc: dsc
        }
    };
    ws.send(JSON.stringify(msg));
}

export function wsapi_webrtcAnswer(ws, chatId, senderId, receiverId, dsc) {
    let msg = {
        type: "webrtc",
        subtype: "answer",
        data: {
            roomId: chatId,
            senderId: senderId,
            receiverId: receiverId,
            dsc: dsc
        }
    };
    ws.send(JSON.stringify(msg));
}

export function wsapi_webrtcCandidate(ws, chatId, senderId, receiverId, candidate) {
    let msg = {
        type: "webrtc",
        subtype: "candidate",
        data: {
            roomId: chatId,
            senderId: senderId,
            receiverId: receiverId,
            candidate: candidate
        }
    };
    ws.send(JSON.stringify(msg));
}