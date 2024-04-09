import psycopg2, uuid, enum

class _FetchType(enum.Enum):
    NONE = 0,
    ONE = 1,
    MANY = 2,
    ALL = 3


def _execute_query(conn, query: str, fetchType: _FetchType, fetchSize: int):
    with conn.cursor() as curs:
        curs.execute(query)
        match fetchType:
            case _FetchType.NONE:
                return 0
            case _FetchType.ONE:
                return curs.fetchone()
            case _FetchType.MANY:
                return curs.fetchmany(fetchSize)
            case _FetchType.ALL:
                return curs.fetchall()                 


def _eq_none(conn, query):
    return _execute_query(conn, query, _FetchType.NONE, 0)


def _eq_one(conn, query):
    return _execute_query(conn, query, _FetchType.ONE, 0)


def _eq_many(conn, query, size):
    return _execute_query(conn, query, _FetchType.MANY, size)


def _eq_all(conn, query):
    return _execute_query(conn, query, _FetchType.ALL, 0)


def _generateUUID():
    return str(uuid.uuid4())


class Account:
    id: str
    login: str
    password: str
    salt: str

    def __init__(self, query_result):
        self.id = query_result[0]
        self.login = query_result[1]
        self.password = query_result[2]
        self.salt = query_result[3]


class Chat:
    id: str
    name: str
    isGroup: bool

    def __init__(self, query_result):
        self.id = query_result[0]
        self.name = query_result[1]
        self.isGroup = query_result[2]
        self.members = []


class Message:
    id: str
    accountId: str
    chatId: str
    text: str

    def __init__(self, queryResult):
        self.id = queryResult[0]
        self.accountId = queryResult[1]
        self.chatId = queryResult[2]
        self.text = queryResult[3]
        self.datetime = str(queryResult[4])
        self.login = ''


class DataManager:
    def __init__(self):
        try:
            self.connection = None
            self.connection = psycopg2.connect("dbname='od_database' user='shakalyan' host='localhost' password='123'")
            self.connection.autocommit = True
            self.accountRepo = AccountRepo(self.connection)
            self.chatRepo = ChatRepo(self.connection)
            self.messageRepo = MessageRepo(self.connection)
        except:
            print("Failed to connect to database")
            raise BaseException()
    
    def __del__(self):
        if self.connection:
            self.connection.close()
    

class AccountRepo:
    def __init__(self, conn):
        self.conn = conn
    
    def getAll(self):
        return _eq_all(self.conn, 'SELECT * FROM account')

    def insert(self, login, password, salt):
        return _eq_none(self.conn, f"INSERT INTO account VALUES('{_generateUUID()}', '{login}', '{password}', '{salt}')")

    def findByLogin(self, login):
        res = _eq_one(self.conn, f"SELECT * FROM account WHERE login = '{login}'")
        if res == None:
            return res
        return Account(res)

    def findById(self, id):
        res = _eq_one(self.conn, f"SELECT * FROM account WHERE id = '{id}'")
        if res == None:
            return res
        return Account(res)


class ChatRepo:
    def __init__(self, conn):
        self.conn = conn
    
    def getAll(self):
        return _eq_all(self.conn, 'SELECT * FROM chat')
    
    def insert(self, name, isGroup):
        return _eq_none(self.conn, f"INSERT INTO chat VALUES('{uuid.uuid4()}', '{name}',  {isGroup})")
    
    def createNew(self, name, isGroup, members):
        chatId = _generateUUID()
        _eq_none(self.conn, f"INSERT INTO chat VALUES('{chatId}', '{name}',  {isGroup})")
        
        for member in members:
            _eq_none(self.conn, f"INSERT INTO chat_account_map VALUES('{chatId}', '{member}')")

        return chatId

    def _findChatMembers(self, chatId):
        members = _eq_all(self.conn, f"SELECT account.id, account.login FROM chat_account_map JOIN account ON chat_account_map.account_id = account.id WHERE chat_account_map.chat_id = '{chatId}'") 
        return list(map(lambda m: {'id': m[0], 'login': m[1]}, members))

    def findAllByAccountId(self, accountId):
        result = _eq_all(self.conn, f"SELECT chat.id, chat.name, chat.is_group FROM chat_account_map JOIN chat ON chat_account_map.chat_id = chat.id WHERE account_id = '{accountId}'")
        
        chats = list(map(lambda row: Chat(row), result))
        for chat in chats:
            chat.members = self._findChatMembers(chat.id)

        return chats
    
    def findById(self, chatId):
        chat = Chat(_eq_one(self.conn, f"SELECT * FROM chat WHERE id = '{chatId}'"))
        chat.members = self._findChatMembers(chat.id)
        return chat


class MessageRepo():
    def __init__(self, conn):
        self.conn = conn
    
    def insert(self, accountId, chatId, text, datetime):
        id = _generateUUID()
        _eq_none(self.conn, f"INSERT INTO message VALUES('{id}', '{accountId}', '{chatId}', '{text}', '{datetime}')")
        return id
    
    def getAllByChatId(self, chatId):
        result = _eq_all(self.conn, f"SELECT * FROM message WHERE chat_id = '{chatId}'")
        return list(map(lambda r: Message(r), result))