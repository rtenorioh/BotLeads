const { Client, LocalAuth, MessageMedia, List } = require('whatsapp-web.js');
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fileUpload = require('express-fileupload');
const axios = require('axios');
const mime = require('mime-types');
const db = require('./database');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const fs = require('fs');
const port = process.env.PORT || 8000;

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(fileUpload({
  debug: true
}));
app.use("/", express.static(__dirname + "/"))

app.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: __dirname
  });
});

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'bot-leads' }),
  puppeteer: {
    //executablePath: '/usr/bin/google-chrome-stable', // VPS
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Localhost
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // <- this one doesn't works in Windows
      '--disable-gpu'
    ]
  }
});

client.initialize();

io.on('connection', function (socket) {
  socket.emit('message', '© Bot Leads - Iniciado');
  socket.emit('qr', './logo.svg');

  client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', '© Bot Leads - QRCode recebido, aponte a câmera seu celular!');
    });
  });

  client.on('ready', () => {
    socket.emit('ready', '© Bot Leads - Dispositivo pronto!');
    socket.emit('message', '© Bot Leads - Dispositivo pronto!');
    socket.emit('qr', './checked.svg')
    console.log('© Bot Leads - Dispositivo pronto');
  });

  client.on('authenticated', () => {
    socket.emit('authenticated', '© Bot Leads - Autenticado!');
    socket.emit('message', '© Bot Leads - Autenticado!');
    console.log('© Bot Leads - Autenticado');
  });

  client.on('auth_failure', function () {
    socket.emit('message', '© Bot Leads - Falha na autenticação, reiniciando...');
    console.error('© Bot Leads - Falha na autenticação');
  });

  client.on('change_state', state => {
    console.log('© Bot Leads - Status de conexão: ', state);
  });

  client.on('disconnected', (reason) => {
    socket.emit('message', '© Bot Leads - Cliente desconectado!');
    console.log('© Bot Leads - Cliente desconectado', reason);
    client.initialize();
  });
});

// Funções do bot
client.on('message', async (msg) => {

  // Captura o numero do usuario para poder fazer as verificações
  const user = msg.from.replace(/\D/g, '');

  // Verifica se o usuário foi salvo na tabela clientes
  const getNumberFrom = await db.getNumber(user);

  // Verifica se o usuário já aceitou a autorização
  const getAcceptFrom = await db.getAccept(user);

  // Enviar uma lista para solicitar autorização
  if (msg.body !== null && getNumberFrom == false && getAcceptFrom == false) {
    let sections = [{
      title: 'Autorização',
      rows: [
        { title: '!Sim' },
        { title: '!Não' }
      ]
    }];
    let list = new List(
      `Pedimos que nos autorize a manter seu número e e-mail em nossa base de dados, para que possamos melhor lhe atender. 
      \n\nCaso não aceite, manteremos apenas seu número para poder guardar sua opção, mas não receberá nenhuma mensagem promocional de nossa parte.
      \nCaso deseje visualizar seus dados, digite o comando *!dados*.`,
      'Autorizar',
      sections,
      'Seja bem-vindo ao Bot Leads!',
      'Bot Leads'
    );
    client.sendMessage(msg.from, list);
    await db.setNumber(user);

    // Salva o numero do usuario, informando que ele aceitou a autorização e solicita o email
  } else if (msg.body === "!Sim") {
    await db.setAccept(msg.body, user);
    const sendMsg = "Para um melhor atendimento, informe seu e-mail.";
    client.sendMessage(msg.from, sendMsg);

    // Salva o numero do usuario, informando que ele não aceitou a autorização
  } else if (msg.body === "!Não") {
    await db.setAccept(msg.body, user);
    const sendMsg = `Seu número foi salvo apenas para guardar sua opção, não receberá nenhuma mensagem promocional de nossa parte.
    \n\n_Se desejar, poderá excluir seu contato enviando:_ \n*!del*.`;
    client.sendMessage(msg.from, sendMsg);
  }

  // Verificar se email existe na tabela clientes 
  if (msg.body.includes('@') && getAcceptFrom === "!Sim") {
    const getEmailFrom = await db.getEmail(user);

    // Salva o email do usuario
    if (getEmailFrom == false) {
      await db.setEmail(msg.body, user);
      const sendMsg = "E-mail cadastrado com sucesso.";
      client.sendMessage(msg.from, sendMsg);

      // Atualizar email na tabela clientes
    } else if (msg.body.startsWith('up ') && getAcceptFrom === "!Sim") {
      const newEmail = msg.body.split(' ')[1];
      await db.updateEmail(newEmail, user);
      msg.reply(`Seu e-mail foi atualizado para: *${newEmail}*`);
    
    // Caso o email já exista, informa como atualizar
    } else if (getEmailFrom !== false) {
      const sendMsg = "Para atualizar seu email, digite: \nup seu@email.com";
      client.sendMessage(msg.from, sendMsg);
    }
  }

  // Deletar usuario da tabela clientes
  if (msg.body === "!del" && getAcceptFrom !== false) {
    await db.delNumber(user);
    const sendMsg = "Seu cadastratro foi apagado de nosso BD.";
    client.sendMessage(msg.from, sendMsg);
  }

  // Buscar dados do usuario da tabela clientes
  if (msg.body === "!dados" && getAcceptFrom !== false) {
    const getuserFrom = await db.getUser(user);
    const nr = getuserFrom[0];
    const email = getuserFrom[1];
    const accept = getuserFrom[2];
    const create = getuserFrom[3];
    const update = getuserFrom[4];

    const sendMsg = `*SEUS DADOS:*\n\nNúmero: *${nr}*\nE-mail: *${email}*\nAutorização: *${accept}*\nCadastrado em: *${create}*\nÚltima atualização: *${update}*
    `;
    client.sendMessage(msg.from, sendMsg);
  }

  // Verificar se a pergunta existe na tabela e retorna a resposta
  const question = msg.body;
  const answer = await db.getAnswer(question);

  // Responde o usuario com a resposta do BD
  if (answer !== false && getAcceptFrom !== false) {
    client.sendMessage(msg.from, answer);

    // Caso a pergunta não exista apenas da um return
  } else if (answer === false && msg.body !== "!del" && getAcceptFrom !== false) {
    //client.sendMessage(msg.from, 'Não entendi sua pergunta.');
    return;
  }

});

// Endpoint para envio de Mensagens
app.post('/send-message', [
  body('number').notEmpty(),
  body('message').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const number = req.body.number;
  const numberDDD = number.substr(0, 2);
  const numberUser = number.substr(-8, 8);
  const message = req.body.message;

  if (numberDDD <= 30) {
    const numberNew = "55" + numberDDD + "9" + numberUser + "@c.us";
    client.sendMessage(numberNew, message).then(response => {
      res.status(200).json({
        status: true,
        message: 'Bot Leads - Mensagem enviada',
        response: response
      });
    }).catch(err => {
      res.status(500).json({
        status: false,
        message: 'Bot Leads - Mensagem não enviada',
        response: err.text
      });
    });
  }
  else if (numberDDD > 30) {
    const numberNew = "55" + numberDDD + numberUser + "@c.us";
    client.sendMessage(numberNew, message).then(response => {
      res.status(200).json({
        status: true,
        message: 'Bot Leads - Mensagem enviada',
        response: response
      });
    }).catch(err => {
      res.status(500).json({
        status: false,
        message: 'Bot Leads - Mensagem não enviada',
        response: err.text
      });
    });
  }

  else {
    const numberNew = number + "@c.us";
    client.sendMessage(numberNew, message).then(response => {
      res.status(200).json({
        status: true,
        message: 'Bot Leads - Mensagem enviada',
        response: response
      });
    }).catch(err => {
      res.status(500).json({
        status: false,
        message: 'Bot Leads - Mensagem não enviada',
        response: err.text
      });
    });
  }
});

// Endpoint para envio de Media
app.post('/send-media', async (req, res) => {
  const number = req.body.number;
  const numberDDD = number.substr(0, 2);
  const numberUser = number.substr(-8, 8);
  const caption = req.body.caption;
  const fileUrl = req.body.file;

  let mimetype;
  const attachment = await axios.get(fileUrl, {
    responseType: 'arraybuffer'
  }).then(response => {
    mimetype = response.headers['content-type'];
    return response.data.toString('base64');
  });

  const media = new MessageMedia(mimetype, attachment, 'Media');

  if (numberDDD <= 30) {
    const numberNew = "55" + numberDDD + "9" + numberUser + "@c.us";
    client.sendMessage(numberNew, media, { caption: caption }).then(response => {
      res.status(200).json({
        status: true,
        message: 'Bot Leads - Imagem enviada',
        response: response
      });
    }).catch(err => {
      res.status(500).json({
        status: false,
        message: 'Bot Leads - Imagem não enviada',
        response: err.text
      });
    });
  }

  else if (numberDDD > 30) {
    const numberNew = "55" + numberDDD + numberUser + "@c.us";
    client.sendMessage(numberNew, media, { caption: caption }).then(response => {
      res.status(200).json({
        status: true,
        message: 'Bot Leads - Imagem enviada',
        response: response
      });
    }).catch(err => {
      res.status(500).json({
        status: false,
        message: 'Bot Leads - Imagem não enviada',
        response: err.text
      });
    });
  }

  else {
    const numberNew = number + "@c.us";
    client.sendMessage(numberNew, media, { caption: caption }).then(response => {
      res.status(200).json({
        status: true,
        message: 'Bot Leads - Imagem enviada',
        response: response
      });
    }).catch(err => {
      res.status(500).json({
        status: false,
        message: 'Bot Leads - Imagem não enviada',
        response: err.text
      });
    });
  }
});

server.listen(port, function () {
  console.log('API rodando na porta: ' + port);
});