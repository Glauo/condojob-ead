import { Pool } from "pg";

import bcrypt from "bcryptjs";

const rawUrl = (process.env.DATABASE_URL ?? "").replace(/^\uFEFF/, "");
const connectionString = rawUrl
  .replace(/[?&]sslmode=[^&]*/g, "")
  .replace(/[?&]channel_binding=[^&]*/g, "")
  .replace(/\?$/, "");

const pool = new Pool({
  connectionString,
  ssl: rawUrl.includes("neon.tech") ? { rejectUnauthorized: false } : undefined,
});

export const db = pool;

export async function dbQuery<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const res = await pool.query(sql, params);
  return res.rows as T[];
}

export async function dbQueryOne<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const res = await pool.query(sql, params);
  return (res.rows[0] as T) ?? null;
}

export async function dbRun(sql: string, params?: unknown[]): Promise<void> {
  await pool.query(sql, params);
}

/* ---- Schema migration (run once on startup) ---- */
export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cj_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nome TEXT NOT NULL,
      login TEXT,
      email TEXT UNIQUE NOT NULL,
      senha_hash TEXT NOT NULL,
      perfil TEXT NOT NULL CHECK (perfil IN ('aluno','coordenador','comercial')),
      telefone TEXT,
      celular_whatsapp TEXT,
      data_nascimento DATE,
      rg TEXT,
      cpf TEXT,
      estado_civil TEXT,
      cep TEXT,
      cidade TEXT,
      rua TEXT,
      numero TEXT,
      complemento TEXT,
      foto_url TEXT,
      ativo BOOLEAN DEFAULT true,
      criado_em TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS cj_cursos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nome TEXT NOT NULL,
      descricao TEXT,
      carga_horaria INTEGER DEFAULT 0,
      preco NUMERIC(10,2) DEFAULT 0,
      link_pagamento TEXT,
      tipo TEXT DEFAULT 'principal',
      nota_minima NUMERIC(4,2) DEFAULT 7.0,
      max_tentativas INTEGER DEFAULT 3,
      criado_por UUID REFERENCES cj_users(id),
      criado_em TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS cj_aulas (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      curso_id UUID REFERENCES cj_cursos(id) ON DELETE CASCADE,
      titulo TEXT NOT NULL,
      ordem INTEGER NOT NULL DEFAULT 1,
      video_url TEXT,
      conteudo TEXT,
      materiais JSONB DEFAULT '[]',
      criado_em TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS cj_matriculas (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      usuario_id UUID REFERENCES cj_users(id) ON DELETE CASCADE,
      curso_id UUID REFERENCES cj_cursos(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo','concluido','reprovado','inativo')),
      matriculado_em TIMESTAMPTZ DEFAULT now(),
      UNIQUE(usuario_id, curso_id)
    );

    CREATE TABLE IF NOT EXISTS cj_progresso (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      usuario_id UUID REFERENCES cj_users(id) ON DELETE CASCADE,
      aula_id UUID REFERENCES cj_aulas(id) ON DELETE CASCADE,
      percentual INTEGER DEFAULT 0,
      concluido BOOLEAN DEFAULT false,
      concluido_em TIMESTAMPTZ,
      atualizado_em TIMESTAMPTZ DEFAULT now(),
      UNIQUE(usuario_id, aula_id)
    );

    CREATE TABLE IF NOT EXISTS cj_atividades (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      aula_id UUID REFERENCES cj_aulas(id) ON DELETE CASCADE,
      titulo TEXT NOT NULL,
      tipo TEXT DEFAULT 'multipla_escolha' CHECK (tipo IN ('multipla_escolha','verdadeiro_falso','dissertativa','upload')),
      questoes JSONB DEFAULT '[]',
      criado_em TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS cj_submissoes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      usuario_id UUID REFERENCES cj_users(id) ON DELETE CASCADE,
      atividade_id UUID REFERENCES cj_atividades(id) ON DELETE CASCADE,
      respostas JSONB DEFAULT '[]',
      nota NUMERIC(4,2),
      status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','corrigida','aguardando_correcao')),
      tentativas INTEGER DEFAULT 1,
      submetido_em TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS cj_certificados (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      usuario_id UUID REFERENCES cj_users(id) ON DELETE CASCADE,
      curso_id UUID REFERENCES cj_cursos(id) ON DELETE CASCADE,
      codigo TEXT UNIQUE NOT NULL,
      emitido_em TIMESTAMPTZ DEFAULT now(),
      UNIQUE(usuario_id, curso_id)
    );

    CREATE TABLE IF NOT EXISTS cj_documentos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      usuario_id UUID REFERENCES cj_users(id) ON DELETE CASCADE,
      tipo TEXT NOT NULL,
      arquivo_url TEXT,
      nome_arquivo TEXT,
      status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado','rejeitado')),
      observacoes TEXT,
      enviado_por TEXT DEFAULT 'aluno',
      criado_em TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS cj_pagamentos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      usuario_id UUID REFERENCES cj_users(id) ON DELETE CASCADE,
      curso_id UUID REFERENCES cj_cursos(id),
      descricao TEXT,
      valor NUMERIC(10,2) NOT NULL,
      status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','pago','vencido','cancelado')),
      vencimento DATE,
      pago_em TIMESTAMPTZ,
      criado_em TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS cj_notificacoes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      usuario_id UUID REFERENCES cj_users(id) ON DELETE CASCADE,
      mensagem TEXT NOT NULL,
      tipo TEXT DEFAULT 'info',
      lida BOOLEAN DEFAULT false,
      criado_em TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS cj_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      usuario_id UUID,
      acao TEXT NOT NULL,
      detalhes JSONB,
      criado_em TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS cj_user_delete_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      usuario_id UUID NOT NULL,
      perfil TEXT NOT NULL,
      evento TEXT NOT NULL,
      dados JSONB NOT NULL,
      criado_em TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS cj_chat_mensagens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      aluno_id UUID REFERENCES cj_users(id) ON DELETE CASCADE,
      coordenador_id UUID REFERENCES cj_users(id) ON DELETE SET NULL,
      remetente_id UUID REFERENCES cj_users(id) ON DELETE CASCADE,
      mensagem TEXT NOT NULL,
      lida BOOLEAN DEFAULT false,
      criado_em TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS cj_club_beneficios (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nome_empresa TEXT NOT NULL,
      categoria TEXT NOT NULL,
      descricao TEXT,
      desconto TEXT NOT NULL,
      cupom TEXT,
      link_url TEXT,
      contato TEXT,
      endereco TEXT,
      regras TEXT,
      ativo BOOLEAN DEFAULT true,
      criado_por UUID REFERENCES cj_users(id) ON DELETE SET NULL,
      criado_em TIMESTAMPTZ DEFAULT now(),
      atualizado_em TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS cj_comercial_leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      empresa TEXT NOT NULL,
      nome_contato TEXT NOT NULL,
      email TEXT,
      whatsapp TEXT,
      cargo TEXT,
      origem TEXT DEFAULT 'site',
      segmento TEXT,
      cidade TEXT,
      tags JSONB DEFAULT '[]',
      score INTEGER DEFAULT 50,
      valor_potencial NUMERIC(10,2) DEFAULT 0,
      estagio TEXT NOT NULL DEFAULT 'novo' CHECK (estagio IN ('mensagem_enviada','novo','qualificado','reuniao','proposta','negociacao','ganho','perdido')),
      status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','ganho','perdido','inativo')),
      observacoes TEXT,
      ai_resumo TEXT,
      ultima_interacao_em TIMESTAMPTZ,
      proxima_acao_em TIMESTAMPTZ,
      responsavel_id UUID REFERENCES cj_users(id) ON DELETE SET NULL,
      criado_por UUID REFERENCES cj_users(id) ON DELETE SET NULL,
      criado_em TIMESTAMPTZ DEFAULT now(),
      atualizado_em TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS cj_comercial_atividades (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lead_id UUID REFERENCES cj_comercial_leads(id) ON DELETE CASCADE,
      tipo TEXT NOT NULL CHECK (tipo IN ('nota','whatsapp','email','ligacao','tarefa','movimentacao','campanha')),
      titulo TEXT NOT NULL,
      descricao TEXT,
      meta JSONB DEFAULT '{}'::jsonb,
      criado_por UUID REFERENCES cj_users(id) ON DELETE SET NULL,
      criado_em TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS cj_comercial_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nome TEXT NOT NULL,
      canal TEXT NOT NULL CHECK (canal IN ('whatsapp','email')),
      objetivo TEXT NOT NULL DEFAULT 'prospeccao',
      tom TEXT NOT NULL DEFAULT 'consultivo',
      assunto TEXT,
      conteudo TEXT NOT NULL,
      ai_gerado BOOLEAN DEFAULT false,
      ativo BOOLEAN DEFAULT true,
      criado_por UUID REFERENCES cj_users(id) ON DELETE SET NULL,
      criado_em TIMESTAMPTZ DEFAULT now(),
      atualizado_em TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS cj_comercial_campanhas (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nome TEXT NOT NULL,
      canal TEXT NOT NULL CHECK (canal IN ('whatsapp','email')),
      status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','agendada','enviando','concluida','pausada')),
      template_id UUID REFERENCES cj_comercial_templates(id) ON DELETE SET NULL,
      filtro_estagio TEXT,
      filtro_origem TEXT,
      assunto TEXT,
      mensagem TEXT NOT NULL,
      publico_total INTEGER DEFAULT 0,
      enviados INTEGER DEFAULT 0,
      entregues INTEGER DEFAULT 0,
      respostas INTEGER DEFAULT 0,
      agendado_em TIMESTAMPTZ,
      ultimo_disparo_em TIMESTAMPTZ,
      criado_por UUID REFERENCES cj_users(id) ON DELETE SET NULL,
      criado_em TIMESTAMPTZ DEFAULT now(),
      atualizado_em TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS cj_comercial_disparos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      campanha_id UUID REFERENCES cj_comercial_campanhas(id) ON DELETE CASCADE,
      lead_id UUID REFERENCES cj_comercial_leads(id) ON DELETE CASCADE,
      canal TEXT NOT NULL CHECK (canal IN ('whatsapp','email')),
      destino TEXT,
      assunto TEXT,
      mensagem TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','enviado','erro','rascunho')),
      provider_resposta JSONB,
      erro_texto TEXT,
      enviado_em TIMESTAMPTZ,
      criado_em TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`
    ALTER TABLE cj_users DROP CONSTRAINT IF EXISTS cj_users_perfil_check;
    ALTER TABLE cj_users ADD CONSTRAINT cj_users_perfil_check CHECK (perfil IN ('aluno','coordenador','comercial'));
    ALTER TABLE cj_comercial_leads DROP CONSTRAINT IF EXISTS cj_comercial_leads_estagio_check;
    ALTER TABLE cj_comercial_leads ADD CONSTRAINT cj_comercial_leads_estagio_check CHECK (estagio IN ('mensagem_enviada','novo','qualificado','reuniao','proposta','negociacao','ganho','perdido'));

    ALTER TABLE cj_users ADD COLUMN IF NOT EXISTS celular_whatsapp TEXT;
    ALTER TABLE cj_users ADD COLUMN IF NOT EXISTS login TEXT;
    ALTER TABLE cj_users ADD COLUMN IF NOT EXISTS data_nascimento DATE;
    ALTER TABLE cj_users ADD COLUMN IF NOT EXISTS rg TEXT;
    ALTER TABLE cj_users ADD COLUMN IF NOT EXISTS cpf TEXT;
    ALTER TABLE cj_users ADD COLUMN IF NOT EXISTS estado_civil TEXT;
    ALTER TABLE cj_users ADD COLUMN IF NOT EXISTS cep TEXT;
    ALTER TABLE cj_users ADD COLUMN IF NOT EXISTS cidade TEXT;
    ALTER TABLE cj_users ADD COLUMN IF NOT EXISTS rua TEXT;
    ALTER TABLE cj_users ADD COLUMN IF NOT EXISTS numero TEXT;
    ALTER TABLE cj_users ADD COLUMN IF NOT EXISTS complemento TEXT;
    ALTER TABLE cj_users ADD COLUMN IF NOT EXISTS acesso_enviado_em TIMESTAMPTZ;

    ALTER TABLE cj_cursos ADD COLUMN IF NOT EXISTS link_pagamento TEXT;
    ALTER TABLE cj_cursos ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'principal';

    ALTER TABLE cj_pagamentos ADD COLUMN IF NOT EXISTS mp_preference_id TEXT;
    ALTER TABLE cj_pagamentos ADD COLUMN IF NOT EXISTS mp_payment_id TEXT;
    ALTER TABLE cj_pagamentos ADD COLUMN IF NOT EXISTS mp_external_reference TEXT;
    ALTER TABLE cj_pagamentos ADD COLUMN IF NOT EXISTS mp_status_detail TEXT;
    ALTER TABLE cj_pagamentos ADD COLUMN IF NOT EXISTS checkout_url TEXT;

    ALTER TABLE cj_club_beneficios ADD COLUMN IF NOT EXISTS cupom TEXT;
    ALTER TABLE cj_club_beneficios ADD COLUMN IF NOT EXISTS contato TEXT;
    ALTER TABLE cj_club_beneficios ADD COLUMN IF NOT EXISTS endereco TEXT;
    ALTER TABLE cj_club_beneficios ADD COLUMN IF NOT EXISTS regras TEXT;
    ALTER TABLE cj_club_beneficios ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

    ALTER TABLE cj_comercial_leads ADD COLUMN IF NOT EXISTS cargo TEXT;
    ALTER TABLE cj_comercial_leads ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'site';
    ALTER TABLE cj_comercial_leads ADD COLUMN IF NOT EXISTS segmento TEXT;
    ALTER TABLE cj_comercial_leads ADD COLUMN IF NOT EXISTS cidade TEXT;
    ALTER TABLE cj_comercial_leads ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';
    ALTER TABLE cj_comercial_leads ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 50;
    ALTER TABLE cj_comercial_leads ADD COLUMN IF NOT EXISTS valor_potencial NUMERIC(10,2) DEFAULT 0;
    ALTER TABLE cj_comercial_leads ADD COLUMN IF NOT EXISTS ai_resumo TEXT;
    ALTER TABLE cj_comercial_leads ADD COLUMN IF NOT EXISTS ultima_interacao_em TIMESTAMPTZ;
    ALTER TABLE cj_comercial_leads ADD COLUMN IF NOT EXISTS proxima_acao_em TIMESTAMPTZ;
    ALTER TABLE cj_comercial_leads ADD COLUMN IF NOT EXISTS responsavel_id UUID REFERENCES cj_users(id) ON DELETE SET NULL;
    ALTER TABLE cj_comercial_leads ADD COLUMN IF NOT EXISTS criado_por UUID REFERENCES cj_users(id) ON DELETE SET NULL;
    ALTER TABLE cj_comercial_leads ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ DEFAULT now();

    ALTER TABLE cj_comercial_templates ADD COLUMN IF NOT EXISTS objetivo TEXT DEFAULT 'prospeccao';
    ALTER TABLE cj_comercial_templates ADD COLUMN IF NOT EXISTS tom TEXT DEFAULT 'consultivo';
    ALTER TABLE cj_comercial_templates ADD COLUMN IF NOT EXISTS assunto TEXT;
    ALTER TABLE cj_comercial_templates ADD COLUMN IF NOT EXISTS ai_gerado BOOLEAN DEFAULT false;
    ALTER TABLE cj_comercial_templates ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;
    ALTER TABLE cj_comercial_templates ADD COLUMN IF NOT EXISTS criado_por UUID REFERENCES cj_users(id) ON DELETE SET NULL;
    ALTER TABLE cj_comercial_templates ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ DEFAULT now();

    ALTER TABLE cj_comercial_campanhas ADD COLUMN IF NOT EXISTS filtro_estagio TEXT;
    ALTER TABLE cj_comercial_campanhas ADD COLUMN IF NOT EXISTS filtro_origem TEXT;
    ALTER TABLE cj_comercial_campanhas ADD COLUMN IF NOT EXISTS assunto TEXT;
    ALTER TABLE cj_comercial_campanhas ADD COLUMN IF NOT EXISTS publico_total INTEGER DEFAULT 0;
    ALTER TABLE cj_comercial_campanhas ADD COLUMN IF NOT EXISTS enviados INTEGER DEFAULT 0;
    ALTER TABLE cj_comercial_campanhas ADD COLUMN IF NOT EXISTS entregues INTEGER DEFAULT 0;
    ALTER TABLE cj_comercial_campanhas ADD COLUMN IF NOT EXISTS respostas INTEGER DEFAULT 0;
    ALTER TABLE cj_comercial_campanhas ADD COLUMN IF NOT EXISTS agendado_em TIMESTAMPTZ;
    ALTER TABLE cj_comercial_campanhas ADD COLUMN IF NOT EXISTS ultimo_disparo_em TIMESTAMPTZ;
    ALTER TABLE cj_comercial_campanhas ADD COLUMN IF NOT EXISTS criado_por UUID REFERENCES cj_users(id) ON DELETE SET NULL;
    ALTER TABLE cj_comercial_campanhas ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ DEFAULT now();

    ALTER TABLE cj_comercial_disparos ADD COLUMN IF NOT EXISTS provider_resposta JSONB;
    ALTER TABLE cj_comercial_disparos ADD COLUMN IF NOT EXISTS erro_texto TEXT;
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS cj_users_login_unique
    ON cj_users (LOWER(login))
    WHERE login IS NOT NULL AND login <> '';

    CREATE INDEX IF NOT EXISTS cj_comercial_leads_estagio_idx ON cj_comercial_leads (estagio, status);
    CREATE INDEX IF NOT EXISTS cj_comercial_leads_responsavel_idx ON cj_comercial_leads (responsavel_id);
    CREATE INDEX IF NOT EXISTS cj_comercial_atividades_lead_idx ON cj_comercial_atividades (lead_id, criado_em DESC);
    CREATE INDEX IF NOT EXISTS cj_comercial_disparos_campanha_idx ON cj_comercial_disparos (campanha_id, criado_em DESC);
  `);

  await pool.query(`
    CREATE OR REPLACE FUNCTION cj_protect_aluno_delete()
    RETURNS TRIGGER AS $$
    DECLARE
      allow_delete BOOLEAN;
    BEGIN
      allow_delete := COALESCE(current_setting('app.allow_user_delete', true), '') = 'true';

      INSERT INTO cj_user_delete_events (usuario_id, perfil, evento, dados)
      VALUES (
        OLD.id,
        OLD.perfil,
        CASE WHEN OLD.perfil = 'aluno' AND NOT allow_delete THEN 'exclusao_bloqueada' ELSE 'exclusao_permitida' END,
        jsonb_build_object(
          'id', OLD.id,
          'nome', OLD.nome,
          'login', OLD.login,
          'email', OLD.email,
          'ativo', OLD.ativo,
          'criado_em', OLD.criado_em
        )
      );

      IF OLD.perfil = 'aluno' AND NOT allow_delete THEN
        RETURN NULL;
      END IF;

      RETURN OLD;
    END;
    $$ LANGUAGE plpgsql;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'cj_protect_aluno_delete_trigger'
          AND tgrelid = 'cj_users'::regclass
      ) THEN
        CREATE TRIGGER cj_protect_aluno_delete_trigger
        BEFORE DELETE ON cj_users
        FOR EACH ROW
        EXECUTE FUNCTION cj_protect_aluno_delete();
      END IF;
    END;
    $$;
  `);

  await ensureCommercialTemplates();
  await ensureDefaultAdmin();
  await ensureDefaultCommercial();
}

async function ensureDefaultAdmin() {
  const login = (process.env.DEFAULT_ADMIN_LOGIN || "admin").toLowerCase().trim();
  const password = process.env.DEFAULT_ADMIN_PASSWORD || "250488";
  const email = (process.env.DEFAULT_ADMIN_EMAIL || "admin@condojobeducacional.local").toLowerCase().trim();
  const nome = process.env.DEFAULT_ADMIN_NAME || "Administrador";

  const admin = await pool.query<{ id: string; senha_hash: string }>(
    `SELECT id, senha_hash
       FROM cj_users
      WHERE perfil='coordenador'
        AND (LOWER(COALESCE(login, ''))=$1 OR LOWER(email)=$2)
      ORDER BY CASE WHEN LOWER(COALESCE(login, ''))=$1 THEN 1 ELSE 2 END
      LIMIT 1`,
    [login, email]
  );

  const current = admin.rows[0];
  const hashOk = current ? await bcrypt.compare(password, current.senha_hash) : false;
  const hash = hashOk ? current.senha_hash : await bcrypt.hash(password, 10);

  if (current) {
    await pool.query(
      `UPDATE cj_users
          SET login=$1, senha_hash=$2, ativo=true
        WHERE id=$3`,
      [login, hash, current.id]
    );
    return;
  }

  await pool.query(
    `INSERT INTO cj_users (nome, login, email, senha_hash, perfil, ativo)
     VALUES ($1,$2,$3,$4,'coordenador',true)
     ON CONFLICT (email) DO UPDATE
       SET nome=EXCLUDED.nome,
           login=EXCLUDED.login,
           senha_hash=EXCLUDED.senha_hash,
           ativo=true`,
    [nome, login, email, hash]
  );
}

async function ensureCommercialTemplates() {
  const existentes = await pool.query<{ total: string }>("SELECT COUNT(*)::text AS total FROM cj_comercial_templates");
  if (Number(existentes.rows[0]?.total || 0) > 0) return;

  await pool.query(
    `INSERT INTO cj_comercial_templates (nome, canal, objetivo, tom, assunto, conteudo, ai_gerado, ativo)
     VALUES
      ('Primeiro contato premium', 'whatsapp', 'prospeccao', 'consultivo', NULL, 'Ola, {{nome_contato}}. Sou da CondoJob Educacional. Hoje estamos apoiando condominios e administradoras com capacitacao profissional para equipes operacionais. Posso te mostrar, em 2 minutos, como a plataforma ajuda a elevar padrao de atendimento, seguranca e performance do time?', true, true),
      ('Follow-up com autoridade', 'whatsapp', 'followup', 'premium', NULL, 'Ola, {{nome_contato}}. Retomando nosso contato sobre a CondoJob Educacional. Estruturamos uma solucao que facilita treinamento, acompanhamento e certificacao da equipe condominial. Se fizer sentido, posso te enviar uma proposta objetiva ainda hoje.', true, true),
      ('Apresentacao comercial por email', 'email', 'prospeccao', 'consultivo', 'Capacitacao profissional para sua operacao condominial', 'Ola, {{nome_contato}}.\n\nSou da CondoJob Educacional e entro em contato porque muitas operacoes condominiais estao buscando mais padrao, seguranca e preparo nas equipes de atendimento e portaria.\n\nNossa plataforma organiza cursos, trilhas, certificacao e acompanhamento de desempenho em um unico ambiente.\n\nSe fizer sentido, posso te enviar uma apresentacao objetiva com o formato comercial ideal para {{empresa}}.\n\nFico a disposicao.', true, true),
      ('Reativacao de lead', 'email', 'reativacao', 'direto', 'Posso retomar sua apresentacao da CondoJob?', 'Ola, {{nome_contato}}.\n\nPassando para retomar nosso contato sobre a CondoJob Educacional. Houve boa evolucao na forma como estruturamos treinamentos, acompanhamento por funil e campanhas de relacionamento.\n\nSe ainda estiver avaliando uma solucao para desenvolver sua equipe, posso reenviar os pontos principais e sugerir o melhor formato para sua operacao.\n\nFico a disposicao.', true, true)`
  );
}

async function ensureDefaultCommercial() {
  const login = (process.env.DEFAULT_COMMERCIAL_LOGIN || "comercial").toLowerCase().trim();
  const password = process.env.DEFAULT_COMMERCIAL_PASSWORD || "250488";
  const email = (process.env.DEFAULT_COMMERCIAL_EMAIL || "comercial@condojobeducacional.local").toLowerCase().trim();
  const nome = process.env.DEFAULT_COMMERCIAL_NAME || "Equipe Comercial";

  const comercial = await pool.query<{ id: string; senha_hash: string }>(
    `SELECT id, senha_hash
       FROM cj_users
      WHERE perfil='comercial'
        AND (LOWER(COALESCE(login, ''))=$1 OR LOWER(email)=$2)
      ORDER BY CASE WHEN LOWER(COALESCE(login, ''))=$1 THEN 1 ELSE 2 END
      LIMIT 1`,
    [login, email]
  );

  const current = comercial.rows[0];
  const hashOk = current ? await bcrypt.compare(password, current.senha_hash) : false;
  const hash = hashOk ? current.senha_hash : await bcrypt.hash(password, 10);

  if (current) {
    await pool.query(
      `UPDATE cj_users
          SET login=$1, senha_hash=$2, ativo=true
        WHERE id=$3`,
      [login, hash, current.id]
    );
    return;
  }

  await pool.query(
    `INSERT INTO cj_users (nome, login, email, senha_hash, perfil, ativo)
     VALUES ($1,$2,$3,$4,'comercial',true)
     ON CONFLICT (email) DO UPDATE
       SET nome=EXCLUDED.nome,
           login=EXCLUDED.login,
           senha_hash=EXCLUDED.senha_hash,
           ativo=true`,
    [nome, login, email, hash]
  );
}
