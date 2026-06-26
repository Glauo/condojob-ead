# CondoJob EAD / Plataforma CondoJob

Preparacao aplicada para hospedagem Node.js na Hostinger:

- `package.json` ja possui `start`
- `next start` ja respeita `process.env.PORT`
- `.env.example` e `.env.hostinger.example` foram alinhados para Hostinger
- `schema.sql` foi criado como base de importacao no MySQL
- `UPLOADS_DIR` foi preparado para uploads persistentes fora da pasta do app
- o primeiro administrador pode ser criado automaticamente por variaveis de ambiente

## Importante

O projeto ainda usa PostgreSQL na camada de runtime atual.

Isso aparece em pontos como:

- dependencia `pg`
- `RETURNING`
- `ON CONFLICT`
- `JSONB`
- casts `::text` e `::jsonb`
- backup via `pg_dump`

Entao esta entrega deixa o projeto organizado para operacao na Hostinger e documenta o fluxo com MySQL, mas a migracao completa de runtime para MySQL ainda precisa ser feita antes de publicar em producao final sem PostgreSQL.

## 1. Como instalar dependencias

```bash
npm install
```

## 2. Como configurar o `.env`

Use um dos arquivos de exemplo:

```bash
cp .env.hostinger.example .env
```

Ou:

```bash
cp .env.example .env
```

Campos principais:

- `PORT`: porta do processo Node.js
- `APP_URL`: URL publica principal
- `APP_BASE_URL`: URL base usada em callbacks e webhooks
- `NEXT_PUBLIC_APP_URL`: URL publica usada no frontend
- `JWT_SECRET`: segredo das sessoes
- `ADMIN_KEY`: chave administrativa
- `UPLOADS_DIR`: pasta persistente de uploads
- `DEFAULT_ADMIN_*`: dados do primeiro administrador
- `DEFAULT_COMMERCIAL_*`: dados do usuario comercial padrao
- `DB_CLIENT=mysql`: alvo da infraestrutura
- `MYSQL_*`: credenciais do MySQL
- `DATABASE_URL`: compatibilidade temporaria com a versao atual, que ainda depende de PostgreSQL

## 3. Como importar o `schema.sql` no MySQL

Depois de criar o banco MySQL na Hostinger, importe o schema:

```bash
mysql -u SEU_USUARIO -p SEU_BANCO < schema.sql
```

Ou pelo phpMyAdmin:

1. Abra o banco MySQL.
2. Clique em `Importar`.
3. Selecione `schema.sql`.
4. Execute a importacao.

## 4. Como rodar localmente

### Ambiente atual do projeto

Enquanto a camada SQL nao for migrada por completo, a execucao integral do app ainda depende do banco PostgreSQL.

```bash
npm install
npm run dev
```

### Teste local em modo producao

```bash
npm run build
npm start
```

O comando `start` usa `process.env.PORT`.

## 5. Como publicar na Hostinger

Passo a passo:

1. Crie uma aplicacao Node.js no painel da Hostinger.
2. Selecione a versao do Node compativel com o projeto.
3. Envie os arquivos do projeto para a aplicacao.
4. Configure as variaveis do `.env` no painel.
5. Execute:

```bash
npm install
npm run build
```

6. Configure o comando de inicializacao:

```bash
npm start
```

7. Confirme que a pasta definida em `UPLOADS_DIR` existe e tem permissao de escrita.

## 6. Como configurar dominio

No painel da Hostinger:

1. Aponte o dominio para a aplicacao Node.js.
2. Ative o SSL.
3. Ajuste as variaveis:

```env
APP_URL=https://seudominio.com.br
APP_BASE_URL=https://seudominio.com.br
NEXT_PUBLIC_APP_URL=https://seudominio.com.br
```

Se usar `www`, faca o redirecionamento no painel da Hostinger.

## 7. Como configurar pasta de uploads

Defina no `.env`:

```env
UPLOADS_DIR=/home/usuario/uploads/condojob
```

Estrutura recomendada:

```text
/home/usuario/uploads/condojob/videos
/home/usuario/uploads/condojob/materiais
/home/usuario/uploads/condojob/respostas
```

Criacao manual:

```bash
mkdir -p /home/usuario/uploads/condojob/videos
mkdir -p /home/usuario/uploads/condojob/materiais
mkdir -p /home/usuario/uploads/condojob/respostas
```

## 8. Como criar o primeiro usuario administrador

Antes da primeira subida, configure:

```env
DEFAULT_ADMIN_LOGIN=admin
DEFAULT_ADMIN_PASSWORD=250488
DEFAULT_ADMIN_EMAIL=admin@seudominio.com.br
DEFAULT_ADMIN_NAME=Administrador
```

Ao iniciar o app, o bootstrap do banco cria ou atualiza esse usuario automaticamente.

## Observacao final

Se a exigencia for rodar a aplicacao em MySQL de ponta a ponta na Hostinger, o proximo passo tecnico obrigatorio e migrar `lib/db.ts` e todas as consultas PostgreSQL para uma camada compativel com MySQL.
