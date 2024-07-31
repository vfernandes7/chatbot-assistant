import express from 'express'
import OpenAI from "openai";
import * as dotenv from 'dotenv';
import cors from 'cors';
dotenv.config()

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()


const app = express()
app.use(express.json());
app.use(cors())


// Funções OpenAI

const openai = new OpenAI({
    organization: "org-kYuoCYt8CuTHDkqNNlv908Jz",
    project: "proj_XqkWq0Q6SQvJkRC7Uei4Jdp2",
});

const assistantId = 'asst_zXH21vCs7lcfrydrjHDvYWrA';

async function criarThread() {
  console.log('criando thread');
  const thread = await openai.beta.threads.create();
  return thread;
};

async function criarMensagem(threadId, conteudoMensagem) {
  const message = await openai.beta.threads.messages.create(
    threadId,
      {
        role: "user",
        content: conteudoMensagem
      }
    );
};

async function runMessage(threadId,assistantId, instrucoesExtras = undefined) {
  let run = await openai.beta.threads.runs.createAndPoll(
    threadId,
    { 
      assistant_id: assistantId,
      instructions: instrucoesExtras
    }
  );
  return run;
};

async function checkRun(runStatus, threadId) {
  if (runStatus === 'completed') {
    const messages = await openai.beta.threads.messages.list(
      threadId
    );
    // console.log(messages.data);
    for (const message of messages.data) {
      let mensagemAssistant = message.content[0].text.value;
      //console.log(mensagemAssistant);
      if (message.role === 'assistant') {
        return mensagemAssistant;
      }
      else {
        let mensagemAssistant = 'não encontrou mensagem assistente';
        return mensagemAssistant
      }
          
    }
    
  } else {
    console.log(runStatus);
    let mensagemAssistant = 'falha na requisição';
    return mensagemAssistant;
  };
};

// Rotas


app.post('/thread', async (req,res) => {
    const thread = await criarThread();

    await prisma.threadsCriadas.create({
      data : {
        threadId : thread.id
      }
    })


    res.status(201).json(thread)
})

app.post('/mensagem', async (req,res) => {
    let threadId = req.body.threadId;
    let conteudoMensagem = req.body.conteudoMensagem;
    let instrucoesExtras = req.body.instrucoesExtras;

    // salvar requisicao no DB

    const dbRequisicao = await prisma.requisicaoMensagem.create({
      data : {
        threadId : threadId,
        conteudoMensagem : conteudoMensagem,
        instrucoesExtras : instrucoesExtras
      }
    })

    // retorna o id da linha criada
    const idDbRequisicao = dbRequisicao.id

    await criarMensagem(threadId,conteudoMensagem);
    const run = await runMessage(threadId,assistantId,instrucoesExtras);
    let runStatus = run.status;
    let mensagemRetornada = await checkRun(runStatus, threadId);

    // atualiza a linha com a resposta

    await prisma.requisicaoMensagem.update({
      where : {
        id: idDbRequisicao
      },
      data : {
        repostaChatbot : mensagemRetornada,
        dateTimeResposta : new Date()
      }
    })

    const respostaMensagem = {
      id: idDbRequisicao,
      resposta: mensagemRetornada
    }

    
    res.status(200).json(respostaMensagem)
})

app.get('/conversas', async (req,res) => {
  
  let mensagens = []

  const parametrosQuery = req.query

  if (parametrosQuery) {
    mensagens = await prisma.requisicaoMensagem.findMany({
      where : {
        threadId: parametrosQuery.threadId
      }
    })
  }
  else {
    mensagens = await prisma.requisicaoMensagem.findMany()
  }
  
  res.status(200).json(mensagens)
})

app.get('/conversas/:idMensagem', async (req,res) => {

  const idMensagem = req.params.idMensagem;
  
  let mensagens = []

  if (idMensagem) {
    mensagens = await prisma.requisicaoMensagem.findMany({
      where : {
        id: idMensagem
      }
    })
  }
  else {
    mensagens = await prisma.requisicaoMensagem.findMany()
  }
  
  res.status(200).json(mensagens)
})

app.delete('/conversas/:idMensagem', async (req,res) => {

  const idMensagem = req.params.idMensagem;
  

  const deletarMensagem = await prisma.requisicaoMensagem.delete({
    where : {
      id: idMensagem
    }
  })
  
  res.status(200).json({
    system: deletarMensagem,
    message: 'Conversa deletada com sucesso'})
})


app.listen(3000)