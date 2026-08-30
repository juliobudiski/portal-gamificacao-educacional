import socketio
import time

sio = socketio.Client()

@sio.event
def connect():
    print("Connected!")
    sio.emit('join', 'user_ai_test')

@sio.on('ai_progress')
def on_progress(data):
    print("PROGRESS:", data)

@sio.on('ai_complete')
def on_complete(data):
    print("COMPLETE:", data)

if __name__ == '__main__':
    sio.connect('http://localhost:5000')
    time.sleep(2)
    sio.disconnect()
