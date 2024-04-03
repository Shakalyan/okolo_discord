DROP TABLE IF EXISTS account;
CREATE TABLE account (
    id UUID PRIMARY KEY,
    login VARCHAR(256) UNIQUE NOT NULL,
    password VARCHAR(256) NOT NULL,
    salt VARCHAR(256) NOT NULL
);
INSERT INTO account VALUES('6bde3a2e-fc1b-4485-bcba-f9aec1326fdf', 'test', 'JDJiJDEyJExFbHdQSWNHMVFWU2NXeFFWUGhaSGVkLzZOcXdJMFFLOTcxakRWMW11T3pUY09qTzEvcWYu', 'JDJiJDEyJExFbHdQSWNHMVFWU2NXeFFWUGhaSGU=');

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
    FOREIGN KEY (chat_id) REFERENCES chat(id),
    FOREIGN KEY (account_id) REFERENCES account(id)
);
