const express = require('express')
const { createServer } = require('http')
const WebSocket = require('ws')

const app = express()
const server = createServer(app)
const port = process.env.PORT || 10000

// Rota HTTP essencial para o Render monitorar a saúde do servidor (Health Check)
app.get('/', (req, res) => {
  res.send('Servidor de Sinalizacao WebRTC Ativo e Saudavel!')
})

// Configura o servidor WebSocket na rota /ws
const wss = new WebSocket.Server({ server, path: '/ws' })

function heartbeat() {
  this.isAlive = true
}

wss.on('connection', (ws) => {
  console.log('Cliente conectado ao WebSocket')
  ws.isAlive = true
  
  ws.on('error', console.error)
  ws.on('pong', heartbeat) // Responde ao ping automático para manter a conexão ativa

  ws.on('message', (message) => {
    const msgString = message.toString()
    
    // RETRANSMISSÃO: Envia as chaves WebRTC de um estúdio para o outro
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msgString)
      }
    })
  })

  ws.on('close', () => {
    console.log('Cliente desconectou')
  })
})

// LOOP DE PING: Mantém a conexão viva a cada 30 segundos contra o timeout do Render
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log('Removendo conexão inativa...')
      return ws.terminate()
    }
    ws.isAlive = false
    ws.ping()
  })
}, 30000)

wss.on('close', () => {
  clearInterval(interval)
})

server.listen(port, () => {
  console.log(`Servidor escutando na porta ${port}`)
})
