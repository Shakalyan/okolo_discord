import psycopg2, uuid, enum


class _FetchType(enum.Enum):
    NONE = 0,
    ONE = 1,
    MANY = 2,
    ALL = 3


def _execute_query(conn, query: str, fetchType: _FetchType, fetchSize: int):
    try:
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
                            
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return -1


def _eq_none(conn, query):
    return _execute_query(conn, query, _FetchType.NONE, 0)


def _eq_one(conn, query):
    return _execute_query(conn, query, _FetchType.ONE, 0)


def _eq_many(conn, query, size):
    return _execute_query(conn, query, _FetchType.MANY, size)


def _eq_all(conn, query):
    return _execute_query(conn, query, _FetchType.ALL, 0)


class Account:
    id: uuid.UUID
    login: str
    password: str
    salt: str

    def __init__(self, query_result):
        self.id = query_result[0]
        self.login = query_result[1]
        self.password = query_result[2]
        self.salt = query_result[3]


class DataManager:
    def __init__(self):
        try:
            self.connection = psycopg2.connect("dbname='od_database' user='shakalyan' host='localhost' password='123'")
            self.connection.autocommit = True
            self.userRepo = AccountRepo(self.connection)
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
        return _eq_none(self.conn, f"INSERT INTO account VALUES('{uuid.uuid4()}', '{login}', '{password}', '{salt}')")

    def findByLogin(self, login):
        res = _eq_one(self.conn, f"SELECT * FROM account WHERE login = '{login}'")
        if res == -1 or res == None:
            return res
        return Account(res)