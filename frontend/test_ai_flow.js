import { io } from 'socket.io-client';

const USER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc4ODEyNTM0MywianRpIjoiZWEyNTc1ZTQtMGU1OS00MGJjLWJjZmMtOWViYTY3NDI2Yzg0IiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjEiLCJuYmYiOjE3ODgxMjUzNDMsImNzcmYiOiI3YWMxMzFlMC1iNTdhLTRmOTItYWU5Mi1kZWQ2OGRhYzUzMjgiLCJleHAiOjE3ODgxMzI1NDN9.EYvFVvHOBck5njMA8_TTJzJXD23xy9w1oNyCvaiBgsk"; 
const userId = "1";
const API_URL = "https://wing-april-roughly-behavioral.trycloudflare.com";

async function runTest() {
    console.log("Iniciando simulação de Geração de IA via Cloudflare...");

    // 2. Conectar Socket
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
        console.log(`Socket conectado via Cloudflare! ID: ${socket.id}`);
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

    socket.on('ai_progress', (data) => {
        console.log(`[PROGRESS] ${data.percent}% - ${data.message}`);
    });

    socket.on('ai_complete', (data) => {
        console.log(`[COMPLETE] IA gerou conteúdo:`, data);
        process.exit(0);
    });

    socket.on('ai_error', (data) => {
        console.error(`[ERROR] Erro da IA:`, data);
        process.exit(1);
    });
    
    socket.on('disconnect', (reason) => {
        console.log(`Socket desconectado: ${reason}`);
    });
}

runTest();
