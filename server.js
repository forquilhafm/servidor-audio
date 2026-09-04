const { WebSocketServer } = require('ws');
const http = require('http');

// 1. Cria um servidor HTTP simples para o Render validar a porta
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Servidor de Sinalizacao WebRTC Ativo\n');
});

// 2. Usa a porta dinâmica do Render (process.env.PORT) ou 8080 localmente
const PORT = process.env.PORT || 8080;

// 3. Vincula o WebSocketServer ao servidor HTTP
const wss = new WebSocketServer({ server });

console.log(`Servidor rodando na porta ${PORT}`);

wss.on('connection', (ws) => {
    ws.on('message', (data) => {
        // Retransmite para os outros clientes conectados
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === 1) {
                client.send(data.toString());
            }
        });
    });
});

// Inicia o servidor escutando a porta correta
server.listen(PORT);
