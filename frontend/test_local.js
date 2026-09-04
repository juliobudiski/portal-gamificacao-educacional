import { io } from 'socket.io-client';

const USER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc4ODEyNTM0MywianRpIjoiZWEyNTc1ZTQtMGU1OS00MGJjLWJjZmMtOWViYTY3NDI2Yzg0IiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjEiLCJuYmYiOjE3ODgxMjUzNDMsImNzcmYiOiI3YWMxMzFlMC1iNTdhLTRmOTItYWU5Mi1kZWQ2OGRhYzUzMjgiLCJleHAiOjE3ODgxMzI1NDN9.EYvFVvHOBck5njMA8_TTJzJXD23xy9w1oNyCvaiBgsk"; 
const userId = "1";
const API_URL = "http://localhost:5001";

async function runTest() {
    console.log("Iniciando simulação de Geração de IA LOCALLY...");

    const socket = io(API_URL, {
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        timeout: 120000,
        forceNew: true
    });

    socket.onAny((eventName, ...args) => {
        console.log(`[SOCKET DEBUG] Evento Recebido: ${eventName}`, args);
    });

    socket.on('connect', () => {
        console.log(`Socket conectado via LOCAL! ID: ${socket.id}`);
        socket.emit('join', `user_ai_${userId}`);
        
        console.log("Enviando requisição POST para /api/content_editor/test_socket...");
        fetch(`${API_URL}/api/content_editor/test_socket`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${USER_TOKEN}`
            },
            body: JSON.stringify({})
        }).then(res => res.json()).then(data => {
            console.log("Resposta POST:", data);
        }).catch(err => console.error(err));
    });
}
runTest();
