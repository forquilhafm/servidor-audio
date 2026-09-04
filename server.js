const { WebSocketServer } = require('ws');

// O Render define a porta automaticamente usando process.env.PORT
const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

const rooms = {}; 

wss.on('connection', (ws) => {
    let currentRoom = null;

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        switch (data.type) {
            case 'join':
                currentRoom = data.room;
                if (!rooms[currentRoom]) rooms[currentRoom] = [];
                
                if (rooms[currentRoom].length < 2) {
                    rooms[currentRoom].push(ws);
                    console.log(`Usuário entrou na sala: ${currentRoom}`);
                } else {
                    ws.send(JSON.stringify({ type: 'error', message: 'Sala cheia' }));
                }
                break;

            case 'offer':
            case 'answer':
            case 'candidate':
                if (rooms[currentRoom]) {
                    rooms[currentRoom].forEach((client) => {
                        if (client !== ws) client.send(JSON.stringify(data));
                    });
                }
                break;
        }
    });

    ws.on('close', () => {
        if (currentRoom && rooms[currentRoom]) {
            rooms[currentRoom] = rooms[currentRoom].filter((client) => client !== ws);
            if (rooms[currentRoom].length === 0) delete rooms[currentRoom];
            console.log(`Usuário saiu da sala: ${currentRoom}`);
        }
    });
});

console.log(`Servidor de sinalização WebRTC rodando na porta ${PORT}`);
