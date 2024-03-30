export const backendHost = "http://127.0.0.1:5000";

export function makeUrl(endpoint) {
    let url = `${backendHost}${endpoint}`;
    console.log(url);
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