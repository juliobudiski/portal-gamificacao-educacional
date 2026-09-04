from flask import Flask
from flask_socketio import SocketIO

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

@socketio.on('connect')
def on_connect():
    print("TEST SERVER CONNECTED!")

@socketio.on('join')
def on_join(data):
    print(f"TEST SERVER JOIN: {data}")

if __name__ == '__main__':
    socketio.run(app, port=5002)
