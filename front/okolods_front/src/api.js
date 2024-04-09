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

export function api_auth_getAccountChats() {
    let token = localStorage.getItem('token')
    return sendQuery(makeUrl(`/chats?token=${token}`), 'GET');
}

export function api_auth_accountEcho() {
    let token = localStorage.getItem('token')
    return sendQuery(makeUrl(`/account/echo?token=${token}`), 'GET');
}

export function api_auth_getAccountId(login) {
    let token = localStorage.getItem('token')
    let url = makeUrl(`/account?login=${login}&token=${token}`)
    return sendQuery(url, 'GET');
}

export function api_auth_getAllMessagesByChatId(chatId) {
    let token = localStorage.getItem('token');
    console.log(token)
    console.log(chatId)
    let url = makeUrl(`/messages?chatId=${chatId}&token=${token}`)
    return sendQuery(url, 'GET')
}

export function wsapi_createChat(ws, name, isGroup, members) {
    let body = {
        type: 'chat',
        subtype: 'new',
        data: {
            name: name,
            isGroup: isGroup,
            members: members
        }
    };
    ws.send(JSON.stringify(body));
}