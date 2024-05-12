DROP TABLE IF EXISTS account;
CREATE TABLE account (
    id UUID PRIMARY KEY,
    login VARCHAR(256) UNIQUE NOT NULL,
    password VARCHAR(256) NOT NULL,
    salt VARCHAR(256) NOT NULL,
    is_bot BOOLEAN NOT NULL,
    avatar BYTEA
);
INSERT INTO account VALUES('6bde3a2e-fc1b-4485-bcba-f9aec1326fdf', 'test', 'JDJiJDEyJExFbHdQSWNHMVFWU2NXeFFWUGhaSGVkLzZOcXdJMFFLOTcxakRWMW11T3pUY09qTzEvcWYu', 'JDJiJDEyJExFbHdQSWNHMVFWU2NXeFFWUGhaSGU=', FALSE);
INSERT INTO account VALUES('841d147f-d2d8-41ac-a1e4-3612766a4280', 'asdf', 'JDJiJDEyJGxjaU04a2lFbzhmdkdCQmVDeUo4cS5rRi5XUXE3Z0dlM1k3aWdiT3VNRndQbUhDaEhTYjdh', 'JDJiJDEyJGxjaU04a2lFbzhmdkdCQmVDeUo4cS4=', FALSE);

DROP TABLE IF EXISTS chat;
CREATE TABLE chat (
    id UUID PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    is_group BOOLEAN NOT NULL
);

DROP TABLE IF EXISTS chat_account_map;
CREATE TABLE chat_account_map (
    chat_id UUID NOT NULL,
    account_id UUID NOT NULL,
    PRIMARY KEY (chat_id, account_id),
    FOREIGN KEY (chat_id) REFERENCES chat(id),
    FOREIGN KEY (account_id) REFERENCES account(id)
);

DROP TABLE IF EXISTS message;
CREATE TABLE message (
    id UUID PRIMARY KEY,
    account_id UUID NOT NULL,
    chat_id UUID NOT NULL,
    text TEXT NOT NULL,
    datetime timestamp NOT NULL,
    FOREIGN KEY (account_id) REFERENCES account(id)
);

DROP TABLE IF EXISTS server;
CREATE TABLE server (
    id UUID PRIMARY KEY,
    name VARCHAR(256) NOT NULL
);

DROP TABLE IF EXISTS server_account_map;
CREATE TABLE server_account_map (
    server_id UUID NOT NULL,
    account_id UUID NOT NULL,
    PRIMARY KEY (server_id, account_id),
    FOREIGN KEY (server_id) REFERENCES server(id),
    FOREIGN KEY (account_id) REFERENCES account(id)
);

DROP TABLE IF EXISTS text_channel;
CREATE TABLE text_channel (
    id UUID PRIMARY KEY,
    server_id UUID NOT NULL,
    name VARCHAR NOT NULL
);

DROP TABLE IF EXISTS voice_channel;
CREATE TABLE voice_channel (
    id UUID PRIMARY KEY,
    server_id UUID NOT NULL,
    name VARCHAR NOT NULL
);