# Foresail
**Inteligência de risco para projetos de software, com IA e integrações reais com GitHub e Jira.**
O **Foresail** é uma plataforma de análise de risco para times de engenharia. A proposta é
simples: projetos de software quase nunca “quebram do nada” — antes disso, eles emitem sinais.
Esses sinais aparecem em repositórios, tickets, inconsistências de execução, padrões de
evolução do código e possíveis fragilidades de segurança. O Foresail conecta essas fontes,
interpreta os sinais com IA e devolve relatórios estruturados para ajudar equipes a agir antes que
o problema vire atraso, retrabalho ou incidente.

---

## Visão geral
Durante o desenvolvimento de software, muitos problemas relevantes passam despercebidos no
dia a dia:
- inconsistências no código;
- riscos de segurança;
- sinais de fragilidade técnica;
- desalinhamento entre execução e acompanhamento;
- acúmulo silencioso de risco operacional.
Na prática, isso costuma ser percebido tarde demais.
O **Foresail** foi criado para transformar esses sinais espalhados em uma leitura mais clara da
saúde do projeto. Para isso, o produto se integra a **GitHub** e **Jira**, coleta dados reais do
projeto e utiliza **Gemini 2.5 Flash via OpenRouter** para gerar análises detalhadas sobre risco
técnico, segurança, incongruências e possíveis pontos de atenção para a evolução do software.

---

## O problema
Times de tecnologia frequentemente trabalham no escuro quando o assunto é risco de projeto.
Mesmo quando existem métricas, dashboards e ferramentas isoladas, ainda é difícil responder
perguntas como:
- este projeto está ficando mais frágil?
- existem sinais de falha futura no código?
- há indícios de risco de segurança?
- o estado atual do repositório e do fluxo de execução sugere estabilidade ou acúmulo de risco?
- estamos descobrindo os problemas cedo ou tarde demais?
Esse problema é especialmente relevante em ambientes de entrega rápida, onde pequenos erros
invisíveis no começo acabam custando caro depois.

---

## A solução
O Foresail funciona como uma camada de **inteligência de risco** sobre o projeto.
Em vez de depender apenas de leitura manual, percepção individual ou revisão tardia, a
plataforma:
1. conecta fontes reais de dados do projeto;
2. consolida sinais vindos do **GitHub** e do **Jira**;
3. envia esses dados para um motor de análise com IA;
4. gera um relatório estruturado com riscos, inconsistências e pontos de melhoria;
5. armazena esse histórico para reanálises, acompanhamento e comparação futura.
O objetivo não é substituir revisão técnica humana, mas dar mais visibilidade e antecipação para
decisões de engenharia.

---

## Como funciona
### Fluxo principal do usuário
1. O usuário acessa a **landing page**
2. Escolhe um plano (**Free**, **Pro** ou **Teams**)
3. Conecta uma fonte de dados via **GitHub** e/ou **Jira**
4. Solicita a análise do projeto
5. O backend coleta os dados por meio das APIs integradas
6. A IA processa os sinais e gera um relatório detalhado
7. O resultado fica salvo no histórico para consultas futuras, reanálises e acompanhamento de
evolução

---

## O que o MVP já entrega
O MVP do hackathon foi construído para provar uma tese central: **é possível detectar sinais
relevantes de risco de projeto a partir de dados reais de ferramentas já usadas pelos times**.
### Funcionalidades presentes no MVP
- integração real com **GitHub**
- integração real com **Jira**
- envio de dados do projeto para análise com IA
- geração de **relatórios detalhados** sobre risco técnico
- identificação de **incongruências** e sinais de fragilidade
- apontamento de **possíveis riscos de segurança**
- leitura de **indicadores de probabilidade de erro**
- armazenamento do histórico de análises
- estrutura de produto com planos **Free / Pro / Teams**
- base para acompanhamento de evolução e relatórios comparativos
> O projeto foi pensado para operar com dados reais. A equipe evitou depender de relatórios
mockados, justamente para manter a demonstração mais crível para a banca.

---

## Que tipo de análise o Foresail faz
A análise do Foresail busca olhar o projeto como um todo, e não apenas um trecho isolado de
código.
Os relatórios gerados pela IA procuram destacar, entre outros pontos:
- sinais de inconsistência no projeto;
- fragilidades técnicas;
- riscos potenciais relacionados à segurança;
- indícios de maior probabilidade de erro;
- padrões que podem sugerir evolução saudável ou aumento de risco;
- oportunidades de melhoria na base atual.
A saída é um **relatório estruturado**, com linguagem explicativa e foco em apoiar decisão
técnica.
> Importante: o Foresail atua como uma camada de apoio analítico. Ele **não substitui** revisão
humana especializada, auditoria de segurança dedicada ou processos formais de engenharia.

---

## Fontes de dados e integrações
### GitHub
O Foresail utiliza dados obtidos por meio da API do GitHub para analisar o estado do repositório e
sinais ligados à evolução do projeto.
### Jira
O Foresail também utiliza dados de projetos no Jira para enriquecer a leitura do contexto
operacional e de execução.
### Integrações ativas no MVP
- **GitHub**
- **Jira**
### Roadmap de integrações futuras
- **Slack**
- **Azure**

---

## Diferenciais do produto
O Foresail não foi pensado apenas como mais um dashboard.
Seus principais diferenciais são:
- **análise orientada a risco**, e não só exibição de dados brutos;
- **uso combinado de IA com dados reais de ferramentas de engenharia**;
- **leitura em nível de projeto**, e não apenas checagens pontuais;
- **histórico de análises**, permitindo acompanhar evolução;
- **relatórios acionáveis**, com explicação de problemas e possíveis melhorias.

---

## Arquitetura do sistema
Em alto nível, o Foresail está organizado em quatro camadas:

### 1. Interface
Responsável por:
- onboarding do usuário;
- seleção de plano;
- fluxo de integrações;
- solicitação da análise;
- visualização de relatórios e histórico.

### 2. Backend
Responsável por:
- receber solicitações de análise;
- orquestrar integrações com GitHub e Jira;
- preparar os dados para o motor de IA;
- persistir análises e histórico.

### 3. Persistência
Responsável por armazenar:
- usuários;
- projetos;
- integrações;
- análises;
- indicadores e histórico.

### 4. Camada de inteligência
Responsável por:
- processar os dados coletados;
- gerar relatórios estruturados;
- devolver leitura de risco do projeto com apoio do modelo de IA.

---

## Stack principal
### Produto
- **React** — frontend
- **FastAPI** — backend
- **Supabase** — persistência de dados
- **GitHub API** — ingestão de dados do repositório
- **Jira / Atlassian** — ingestão de dados do projeto
- **Gemini 2.5 Flash via OpenRouter** — motor de análise com IA

### Workflow de desenvolvimento e prototipação
- Git
- GitHub
- Postman
- VS Code
- Cursor
- Claude
- Excalidraw
- Canva
- Antigravity

---

## Estrutura de produto
O Foresail foi desenhado com uma visão de produto, não apenas como experimento técnico.
Entre as superfícies pensadas no MVP estão:
- landing page;
- seleção de planos;
- integração com fontes externas;
- relatório de risco;
- histórico de análises;
- acompanhamento de evolução do projeto.

---

## Status atual do projeto
O Foresail é um **MVP de hackathon**.
O que já existe de forma central no projeto:
- integrações reais com GitHub e Jira;
- pipeline de análise com IA;
- relatórios detalhados;
- histórico de análises;
- narrativa de produto com onboarding e planos.
O que ainda está em evolução:
- maior profundidade de integrações;
- expansão das fontes de sinal;
- colaboração em equipe;
- refinamento de setup e operação;
- amadurecimento do produto para um cenário pós-hackathon.

---

## Limitações atuais
Como todo MVP construído em pouco tempo, o Foresail ainda possui limitações naturais:
- o escopo de integrações ainda está concentrado em **GitHub** e **Jira**;
- parte da robustez esperada de um produto em produção ainda está em evolução;
- o setup técnico ainda pode variar conforme a organização final do repositório;
- o sistema deve ser entendido como uma primeira camada de inteligência de risco, e não como
substituto completo de processos formais de segurança, observabilidade ou revisão técnica.

---

## Próximos passos
Entre as evoluções imaginadas para o produto estão:
- integração com **Slack**
- integração com **Azure**
- chat nativo com IA para investigação de risco
- relatórios históricos mais comparativos
- acompanhamento mais claro da evolução do projeto ao longo do tempo
- expansão da leitura para novas fontes e novos sinais operacionais

---

## Equipe
- **João Victor** — Desenvolvimento
- **Thomás Caveari** — Desenvolvimento
- **Pedro Mercês** — UI/UX Design
- **Daniel Rios** — Produto

---

## Setup
> Esta seção ainda pode ser refinada conforme a estrutura final do repositório.
Para rodar o projeto localmente, a base esperada inclui:
- frontend da aplicação
- backend em FastAPI
- configuração de banco no Supabase
- credenciais/tokens de integração com GitHub e Jira
- acesso ao provedor de IA via OpenRouter

### Pré-requisitos
- Node.js / ambiente para frontend
- Python / ambiente para backend
- projeto configurado no Supabase
- credenciais válidas para integrações externas

### Configuração básica
1. Configurar as variáveis de ambiente do projeto
2. Conectar backend, banco e provedor de IA
3. Subir a aplicação frontend
4. Subir a API backend
5. Informar os tokens/links necessários para análise

> Como o projeto foi montado em ritmo de hackathon, os comandos exatos de inicialização podem
variar conforme a organização final dos diretórios.

---

## Por que este projeto existe
A tese central por trás do Foresail nasceu de uma observação prática da própria equipe:
em empresas e projetos reais, atrasos e falhas muitas vezes começam com sinais aparentemente
pequenos, invisíveis à primeira vista, mas que já estavam presentes no código e no fluxo do time.

O insight foi perceber que esse problema não é pontual — ele é recorrente e global.
Se os sinais existem antes da falha, então existe espaço para uma ferramenta que ajude times a
enxergá-los mais cedo.

---

## Resumo
O **Foresail** é uma plataforma de inteligência de risco para projetos de software, construída em
hackathon, que integra **GitHub** e **Jira** e usa **IA** para gerar relatórios detalhados sobre
sinais de risco técnico, segurança e inconsistências do projeto.

Mais do que apontar problemas depois que eles aparecem, a proposta do Foresail é ajudar times
a saírem do modo reativo e ganharem **visibilidade antecipada** sobre a saúde do projeto.

**Porque projetos não falham de uma vez — eles emitem sinais antes.**
