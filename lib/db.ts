import { Pool } from "pg";

const rawUrl = (process.env.DATABASE_URL ?? "").replace(/^﻿/, "");
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
      email TEXT UNIQUE NOT NULL,
      senha_hash TEXT NOT NULL,
      perfil TEXT NOT NULL CHECK (perfil IN ('aluno','coordenador')),
      telefone TEXT,
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
  `);
}
