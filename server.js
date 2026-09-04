const express = require('express')
const { createServer } = require('http')
const WebSocket = require('ws')

const app = express()
const server = createServer(app)
const port = process.env.PORT || 10000

app.get('/', (req, res) => {
  res.send('Servidor WebRTC Ativo!')
})

const wss = new WebSocket.Server({ server, path: '/ws' })

// Variáveis para guardar temporariamente as conexões ativas de cada lado
let transmissor = null;
let receptor = null;

function heartbeat() {
  this.isAlive = true
}

wss.on('connection', (ws) => {
  ws.isAlive = true
  ws.on('error', console.error)
  ws.on('pong', heartbeat)

  ws.on('message', (message) => {
    const data = JSON.parse(message.toString());

    // 1. Estúdio A avisa que o microfone está pronto
    if (data.type === 'producer-ready') {
      transmissor = ws;
      console.log('Estúdio A (Transmissor) está pronto.');
      // Se o receptor já estiver esperando na linha, avisa o transmissor para ligar o P2P
      if (receptor && receptor.readyState === WebSocket.OPEN) {
        transmissor.send(JSON.stringify({ type: 'start-call' }));
      }
    }

    // 2. Estúdio B avisa que a escuta está aberta
    if (data.type === 'consumer-joined') {
      receptor = ws;
      console.log('Estúdio B (Receptor) entrou.');
      // Se o transmissor já estiver online, dá o comando para ele começar a gerar a oferta WebRTC
      if (transmissor && transmissor.readyState === WebSocket.OPEN) {
        transmissor.send(JSON.stringify({ type: 'start-call' }));
      }
    }

    // 3. Encaminha as mensagens técnicas de oferta, resposta e candidatos ICE entre as pontas
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  });

  ws.on('close', () => {
    if (ws === transmissor) transmissor = null;
    if (ws === receptor) receptor = null;
    console.log('Um estúdio desconectou');
  });
});

const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate()
    ws.isAlive = false
    ws.ping()
  })
}, 30000)

wss.on('close', () => clearInterval(interval))

server.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`)
})
