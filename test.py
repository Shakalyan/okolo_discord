import requests

json = {
    'login': '<имя бота>',
    'isBot': 'True'
}
r = requests.post('http://localhost:5000/signup', json=json)
if r.status_code == 200:
    jwt = r.text
