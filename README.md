# Bot Leads <img alt="GitHub package.json dependency version (subfolder of monorepo)" src="https://img.shields.io/github/package-json/dependency-version/rtenorioh/BotLeads/whatsapp-web.js">

Esta é uma implementação desse repositório <a href="https://github.com/pedroslopez/whatsapp-web.js">whatsapp-web.js</a>.

O BotLeads é um bot que realiza a captura de leads do WhatsApp e envia para o banco de dados, solicitando ao usuário que confirme o cadastro, no caso de aceitar o cadastro, o usuário receberá a solicitação de seu e-mail, caso não aceite, o usuário receberá uma mensagem de informando que apenas seu número será salvo para poder guardar a escolha que fez.

É informado ao usuário o comando ```!del``` para deletar o cadastro, caso o mesmo desejar, assim como o comando ```!dados``` para verificar seus dados.

O BotLeads também é um chatbot MySQL, pois pode esta cadastrando perguntas e respostas no BD.

O Sistema é composto por um bot de captura de leads, um chatbot com um banco de dados MySQL e 2 endpoints para envio de mensagem e media usando a API.

### Como usar o BotLeads

- Clone ou faça download deste repositório
- Entre na pasta do projeto
- Acessar a pasta database/db.sql e copiar os dados para criar o banco de dados no seu MySQL
- Acessar a pasta database/index.js e inserir as credenciais de acesso ao banco de dados MySQL
- Rode o comando `npm install`
- Depois `npm start`
- Com o projeto rodando, acessar o browser no endereço `http://localhost:8000`
- Ecaneio o QR Code
- Pronto para uso! 

### Observação
- O sistema vem configurado para rodar localmente, mas pode ser rodado em uma VPS, basta comentar a linha do comando Localhost e tirar o comentário da linha VPS no arquivo index.js, deixando assim:
```executablePath: '/usr/bin/google-chrome-stable', // VPS```
```//executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Localhost```