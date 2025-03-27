# canal_confia
Protótipo do Chat do Confia

## Descrição Geral
Este projeto é um protótipo de um sistema de comunicação para o programa "Confia Paraná". Ele permite que auditores fiscais e empresas interajam por meio de um painel de comunicação e um sistema de chat. O sistema também inclui funcionalidades de avaliação de comunicação e gerenciamento de tarefas.

## Estrutura do Sistema
O arquivo `index.html` contém a interface principal do sistema, que é dividida em várias seções:

### 1. **Troca de Papéis**
- O sistema permite alternar entre diferentes papéis:
  - **AUDITOR**: Acesso completo ao painel de comunicações, chat e funcionalidades de divulgação.
  - **CASA LIMPA**, **ABS LOG**, **CAPIXABA**: Representam empresas com acesso limitado às comunicações relacionadas a elas.
- A troca de papéis é feita por meio de botões no topo da página.

### 2. **Painel de Comunicações**
- Disponível apenas para o papel **AUDITOR**.
- Permite visualizar e filtrar comunicações existentes por CNPJ e razão social.
- Exibe uma tabela com informações como ID da comunicação, CNPJ, empresa, assunto, status e ações disponíveis.

### 3. **Consulta de Empresas**
- Exibe uma lista de empresas com filtros por status da última comunicação e CNPJ.
- Para cada empresa, são exibidos:
  - **CNPJ**
  - **Razão Social**
  - **Classificação**
  - Botão para **Divulgar** (apenas para auditores).
  - Botão para iniciar ou abrir uma comunicação existente.

### 4. **Caixa de Entrada**
- Mostra empresas que possuem comunicações pendentes de atenção.
- O botão "Caixa de Entrada" alterna entre a visualização de todas as empresas e apenas aquelas com comunicações pendentes.

### 5. **Chat**
- Permite a troca de mensagens entre auditores e empresas.
- Inclui:
  - Campo para selecionar o assunto.
  - Opção de anexar arquivos.
  - Campo de texto para mensagens.
  - Botão para enviar mensagens.
  - Botão para encerrar a comunicação (apenas para auditores).
- Exibe o histórico de mensagens com informações sobre o remetente, texto e status.

### 6. **Avaliação**
- Após o encerramento de uma comunicação:
  - **Auditor** pode avaliar o contato com a empresa, incluindo nota e feedback detalhado.
  - **Empresa** pode avaliar a comunicação com o auditor, incluindo nota e comentário opcional.

### 7. **Notificações**
- Um popup é exibido quando uma nova comunicação é iniciada, informando que um e-mail foi enviado.

## Funcionalidades Principais
- **Filtragem de Empresas e Comunicações**: Por status, CNPJ e razão social.
- **Gerenciamento de Comunicações**: Criação, visualização e encerramento de comunicações.
- **Avaliação de Comunicação**: Coleta de feedback de ambas as partes.
- **Distribuição de Tarefas**: Auditores podem divulgar tarefas para empresas.

## Tecnologias Utilizadas
- **HTML/CSS**: Estrutura e estilização da interface.
- **Bootstrap**: Framework CSS para design responsivo.
- **Font Awesome**: Ícones para botões e indicadores.
- **JavaScript**: Lógica de interação e manipulação de dados.

## Como Utilizar
1. Abra o arquivo `index.html` em um navegador.
2. Use os botões de troca de papéis para alternar entre auditor e empresas.
3. Utilize os filtros para localizar empresas ou comunicações específicas.
4. Inicie ou continue uma comunicação por meio do chat.
5. Após o encerramento, preencha as avaliações conforme necessário.

## Estrutura de Dados
- **Empresas**: Lista de empresas com CNPJ, razão social, classificação e papel.
- **Comunicações**: Histórico de mensagens, status e informações relacionadas.
- **Avaliações**: Feedback de auditores e empresas, incluindo notas e comentários.

Este protótipo serve como base para um sistema mais robusto de comunicação e gerenciamento de tarefas no contexto do programa "Confia Paraná".
