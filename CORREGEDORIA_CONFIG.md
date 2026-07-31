# Configuração do módulo da Corregedoria

Adicione estas variáveis no Railway ou no arquivo `.env` local:

```env
# Categoria onde serão criados os canais PROC-000001, PROC-000002...
CORREGEDORIA_CATEGORY_ID=

# IDs dos cargos autorizados, separados por vírgula
CORREGEDORIA_ROLE_IDS=

# Canal de logs da Corregedoria (será usado nas próximas etapas)
CORREGEDORIA_LOG_CHANNEL_ID=

# Link direto do banner da Corregedoria (opcional)
CORREGEDORIA_BANNER_URL=
```

## Permissões necessárias para o bot

- Ver canais
- Gerenciar canais
- Enviar mensagens
- Gerenciar mensagens
- Incorporar links
- Anexar arquivos
- Ler histórico de mensagens

Administradores também possuem acesso ao painel. Quando nenhum cargo estiver configurado em `CORREGEDORIA_ROLE_IDS`, somente administradores poderão utilizar o módulo.

## Primeira etapa entregue

- Comando `/corregedoria`
- Painel principal
- Controle de acesso
- Seleção do investigado
- Formulário de abertura
- Numeração automática por servidor
- Canal privado por processo
- Registro no MongoDB
- Consulta por código
- Estatísticas iniciais
- Botões do processo preparados para as próximas etapas
