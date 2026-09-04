const { WebSocketServer } = require('ws');

// Cria o servidor na porta 8080
const wss = new WebSocketServer({ port: 8080 });
console.log('Servidor de sinalização WebRTC rodando na porta 8080');

wss.on('connection', (ws) => {
    ws.on('message', (data) => {
        // Retransmite a mensagem recebida para todos os OUTROS clientes conectados
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === 1) {
                client.send(data.toString());
            }
        });
    });
});
