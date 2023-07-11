'use strict';

const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
var nodemailer = require('nodemailer');

function enviarEmail(usuario, produto, quantidade) {
    // Configurações do Email
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'seuemail@gmail.com',
            pass: 'suasenha'
            // Para gerar uma senha no Gmail: 
            // 1 - Entre na configuração de segurança da conta da Google (https://myaccount.google.com/security)
            // 2 - Abra opção "App Passwords"
            // 3 - Escolha o App "Mail"
            // 4 - Escolha o Dispositivo "Other" e dê um nome desejado ("nodemailer", por exemplo)
            // 5 - Copie a senha gerada e cole aqui no código
        }
    });

    var mailOptions = {
        from: 'seuemail@gmail.com',
        to: 'emaildestino@gmail.com',
        subject: 'Nova Compra!',
        text: ('Usuário: ' + usuario + '\n Comprou: \n ' + quantidade + ' - ' + produto)
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

// Criação da Função no Firebase
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {

    // Definição do objeto controlador do 'agent'
    const agent = new WebhookClient({ request, response });

    // Dicionário de Plural e Artigo
    const dict = {
        'Antídoto': {
            'plural': 'Antídotos',
            'artigo': 'o'
        },
        'MonsterBola': {
            'plural': 'MonsterBolas',
            'artigo': 'a'
        },
        'Poção': {
            'plural': 'Poções',
            'artigo': 'a'
        },
    }

    // 'Handler' para finalizar a compra
    function finalizarCompra(agent) {
        const quantidade = agent.parameters.quantidade;
        const produto = agent.parameters.produto;

        const artigo = dict[produto].artigo;
        const plural = dict[produto].plural;

        // Processar o Singular
        if (quantidade == 1) {
            agent.add('Pronto! ' + artigo + ' ' + produto + ' foi adicionad' + artigo + ' no seu inventório!');
        }

        // Processar o Plural
        else {
            agent.add("Pronto! " + artigo + 's ' + quantidade + ' ' + plural + ' foram adicionad' + artigo + 's no seu inventório!');
        }

        enviarEmail(agent.session, produto, quantidade)
    }

    // 'Handler' para confirmar a compra
    function confirmarCompra(agent) {
        const quantidade = agent.parameters.quantidade;
        const produto = agent.parameters.produto;

        const plural = dict[produto].plural;

        if (quantidade == 1) {
            agent.add('Ok, ' + quantidade + ' ' + produto + ', posso confirmar a compra?');
        }
        else {
            agent.add('Ok, ' + quantidade + ' ' + plural + ', posso confirmar a compra?');
        }
    }

    // Executar a função adequada de acordo com a Intent recebida
    let intentMap = new Map();
    intentMap.set('Finalizar Compra', finalizarCompra);
    intentMap.set('Escolha do Produto', confirmarCompra);

    try {
        agent.handleRequest(intentMap);
    }
    catch (e) {
        console.log(e);
    }
});