const { WebSocketServer } = require('ws');

// O Render define a porta automaticamente usando process.env.PORT
const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

const rooms = {}; 

wss.on('connection', (ws) => {
    let currentRoom = null;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            switch (data.type) {
                case 'join':
                    currentRoom = data.room;
                    if (!rooms[currentRoom]) rooms[currentRoom] = [];
                    
                    // 🚀 CORREÇÃO: Aumentamos o limite para até 5 conexões para acomodar o painel duplo de vocês
                    if (rooms[currentRoom].length < 5) {
                        // Evita duplicar exatamente a mesma instância de conexão
                        if (!rooms[currentRoom].includes(ws)) {
                            rooms[currentRoom].push(ws);
                            console.log(`Dispositivo conectado na sala: ${currentRoom} (Total: ${rooms[currentRoom].length})`);
                        }
                    } else {
                        ws.send(JSON.stringify({ type: 'error', message: 'Sala cheia' }));
                    }
                    break;

                case 'offer':
                case 'answer':
                case 'candidate':
                    if (rooms[currentRoom]) {
                        rooms[currentRoom].forEach((client) => {
                            // Encaminha os dados do WebRTC apenas para os outros dispositivos na sala
                            if (client !== ws && client.readyState === ws.OPEN) {
                                client.send(JSON.stringify(data));
                            }
                        });
                    }
                    break;
            }
        } catch (e) {
            console.error("Erro ao processar mensagem JSON:", e);
        }
    });

    ws.on('close', () => {
        if (currentRoom && rooms[currentRoom]) {
            rooms[currentRoom] = rooms[currentRoom].filter((client) => client !== ws);
            console.log(`Dispositivo saiu da sala: ${currentRoom} (Restantes: ${rooms[currentRoom].length})`);
            if (rooms[currentRoom].length === 0) {
                delete rooms[currentRoom];
                console.log(`Sala ${currentRoom} esvaziada e removida.`);
            }
        }
    });
});

console.log(`Servidor de sinalização WebRTC atualizado rodando na porta ${PORT}`);
