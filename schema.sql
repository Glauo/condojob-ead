CREATE DATABASE IF NOT EXISTS condojobead CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE condojobead;

CREATE TABLE IF NOT EXISTS cj_users (
  id CHAR(36) PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  login VARCHAR(191) NULL,
  email VARCHAR(191) NOT NULL,
  senha_hash TEXT NOT NULL,
  perfil ENUM('aluno','coordenador','comercial') NOT NULL,
  telefone VARCHAR(60) NULL,
  celular_whatsapp VARCHAR(60) NULL,
  data_nascimento DATE NULL,
  rg VARCHAR(60) NULL,
  cpf VARCHAR(60) NULL,
  estado_civil VARCHAR(60) NULL,
  cep VARCHAR(20) NULL,
  cidade VARCHAR(150) NULL,
  rua VARCHAR(255) NULL,
  numero VARCHAR(40) NULL,
  complemento VARCHAR(255) NULL,
  foto_url TEXT NULL,
  ativo BOOLEAN DEFAULT true,
  acesso_enviado_em DATETIME NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY cj_users_email_unique (email),
  UNIQUE KEY cj_users_login_unique (login)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cj_cursos (
  id CHAR(36) PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT NULL,
  carga_horaria INT DEFAULT 0,
  preco DECIMAL(10,2) DEFAULT 0,
  link_pagamento TEXT NULL,
  tipo VARCHAR(50) DEFAULT 'principal',
  nota_minima DECIMAL(4,2) DEFAULT 7.0,
  max_tentativas INT DEFAULT 3,
  criado_por CHAR(36) NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cj_cursos_criado_por FOREIGN KEY (criado_por) REFERENCES cj_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cj_aulas (
  id CHAR(36) PRIMARY KEY,
  curso_id CHAR(36) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  ordem INT NOT NULL DEFAULT 1,
  video_url TEXT NULL,
  conteudo LONGTEXT NULL,
  materiais JSON NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cj_aulas_curso FOREIGN KEY (curso_id) REFERENCES cj_cursos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cj_matriculas (
  id CHAR(36) PRIMARY KEY,
  usuario_id CHAR(36) NOT NULL,
  curso_id CHAR(36) NOT NULL,
  status ENUM('ativo','concluido','reprovado','inativo') DEFAULT 'ativo',
  matriculado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY cj_matriculas_unique (usuario_id, curso_id),
  CONSTRAINT fk_cj_matriculas_usuario FOREIGN KEY (usuario_id) REFERENCES cj_users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cj_matriculas_curso FOREIGN KEY (curso_id) REFERENCES cj_cursos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cj_progresso (
  id CHAR(36) PRIMARY KEY,
  usuario_id CHAR(36) NOT NULL,
  aula_id CHAR(36) NOT NULL,
  percentual INT DEFAULT 0,
  concluido BOOLEAN DEFAULT false,
  concluido_em DATETIME NULL,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY cj_progresso_unique (usuario_id, aula_id),
  CONSTRAINT fk_cj_progresso_usuario FOREIGN KEY (usuario_id) REFERENCES cj_users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cj_progresso_aula FOREIGN KEY (aula_id) REFERENCES cj_aulas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cj_atividades (
  id CHAR(36) PRIMARY KEY,
  aula_id CHAR(36) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  tipo ENUM('multipla_escolha','verdadeiro_falso','dissertativa','upload') DEFAULT 'multipla_escolha',
  questoes JSON NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cj_atividades_aula FOREIGN KEY (aula_id) REFERENCES cj_aulas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cj_submissoes (
  id CHAR(36) PRIMARY KEY,
  usuario_id CHAR(36) NOT NULL,
  atividade_id CHAR(36) NOT NULL,
  respostas JSON NULL,
  nota DECIMAL(4,2) NULL,
  status ENUM('pendente','corrigida','aguardando_correcao') DEFAULT 'pendente',
  tentativas INT DEFAULT 1,
  submetido_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cj_submissoes_usuario FOREIGN KEY (usuario_id) REFERENCES cj_users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cj_submissoes_atividade FOREIGN KEY (atividade_id) REFERENCES cj_atividades(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cj_certificados (
  id CHAR(36) PRIMARY KEY,
  usuario_id CHAR(36) NOT NULL,
  curso_id CHAR(36) NOT NULL,
  codigo VARCHAR(191) NOT NULL,
  emitido_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY cj_certificados_unique (usuario_id, curso_id),
  UNIQUE KEY cj_certificados_codigo_unique (codigo),
  CONSTRAINT fk_cj_certificados_usuario FOREIGN KEY (usuario_id) REFERENCES cj_users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cj_certificados_curso FOREIGN KEY (curso_id) REFERENCES cj_cursos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cj_documentos (
  id CHAR(36) PRIMARY KEY,
  usuario_id CHAR(36) NOT NULL,
  tipo VARCHAR(120) NOT NULL,
  arquivo_url TEXT NULL,
  nome_arquivo VARCHAR(255) NULL,
  status ENUM('pendente','aprovado','rejeitado') DEFAULT 'pendente',
  observacoes TEXT NULL,
  enviado_por VARCHAR(50) DEFAULT 'aluno',
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cj_documentos_usuario FOREIGN KEY (usuario_id) REFERENCES cj_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cj_pagamentos (
  id CHAR(36) PRIMARY KEY,
  usuario_id CHAR(36) NOT NULL,
  curso_id CHAR(36) NULL,
  descricao TEXT NULL,
  valor DECIMAL(10,2) NOT NULL,
  status ENUM('pendente','pago','vencido','cancelado') DEFAULT 'pendente',
  vencimento DATE NULL,
  pago_em DATETIME NULL,
  mp_preference_id VARCHAR(191) NULL,
  mp_payment_id VARCHAR(191) NULL,
  mp_external_reference VARCHAR(191) NULL,
  mp_status_detail TEXT NULL,
  checkout_url TEXT NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cj_pagamentos_usuario FOREIGN KEY (usuario_id) REFERENCES cj_users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cj_pagamentos_curso FOREIGN KEY (curso_id) REFERENCES cj_cursos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cj_notificacoes (
  id CHAR(36) PRIMARY KEY,
  usuario_id CHAR(36) NOT NULL,
  mensagem TEXT NOT NULL,
  tipo VARCHAR(50) DEFAULT 'info',
  lida BOOLEAN DEFAULT false,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cj_notificacoes_usuario FOREIGN KEY (usuario_id) REFERENCES cj_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cj_logs (
  id CHAR(36) PRIMARY KEY,
  usuario_id CHAR(36) NULL,
  acao VARCHAR(191) NOT NULL,
  detalhes JSON NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cj_chat_mensagens (
  id CHAR(36) PRIMARY KEY,
  aluno_id CHAR(36) NOT NULL,
  coordenador_id CHAR(36) NULL,
  remetente_id CHAR(36) NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cj_chat_aluno FOREIGN KEY (aluno_id) REFERENCES cj_users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cj_chat_coord FOREIGN KEY (coordenador_id) REFERENCES cj_users(id) ON DELETE SET NULL,
  CONSTRAINT fk_cj_chat_remetente FOREIGN KEY (remetente_id) REFERENCES cj_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cj_club_beneficios (
  id CHAR(36) PRIMARY KEY,
  nome_empresa VARCHAR(255) NOT NULL,
  categoria VARCHAR(120) NOT NULL,
  descricao TEXT NULL,
  desconto VARCHAR(120) NOT NULL,
  cupom VARCHAR(120) NULL,
  link_url TEXT NULL,
  contato VARCHAR(120) NULL,
  endereco TEXT NULL,
  regras TEXT NULL,
  ativo BOOLEAN DEFAULT true,
  criado_por CHAR(36) NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cj_club_criado_por FOREIGN KEY (criado_por) REFERENCES cj_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cj_comercial_leads (
  id CHAR(36) PRIMARY KEY,
  empresa VARCHAR(255) NOT NULL,
  nome_contato VARCHAR(255) NOT NULL,
  email VARCHAR(191) NULL,
  whatsapp VARCHAR(60) NULL,
  cargo VARCHAR(120) NULL,
  origem VARCHAR(120) DEFAULT 'site',
  segmento VARCHAR(120) NULL,
  cidade VARCHAR(150) NULL,
  tags JSON NULL,
  score INT DEFAULT 50,
  valor_potencial DECIMAL(10,2) DEFAULT 0,
  estagio ENUM('mensagem_enviada','novo','qualificado','reuniao','proposta','negociacao','ganho','perdido') DEFAULT 'novo',
  status ENUM('ativo','ganho','perdido','inativo') DEFAULT 'ativo',
  observacoes TEXT NULL,
  ai_resumo TEXT NULL,
  ultima_interacao_em DATETIME NULL,
  proxima_acao_em DATETIME NULL,
  responsavel_id CHAR(36) NULL,
  criado_por CHAR(36) NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cj_leads_responsavel FOREIGN KEY (responsavel_id) REFERENCES cj_users(id) ON DELETE SET NULL,
  CONSTRAINT fk_cj_leads_criado_por FOREIGN KEY (criado_por) REFERENCES cj_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cj_comercial_atividades (
  id CHAR(36) PRIMARY KEY,
  lead_id CHAR(36) NOT NULL,
  tipo ENUM('nota','whatsapp','email','ligacao','tarefa','movimentacao','campanha') NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT NULL,
  meta JSON NULL,
  criado_por CHAR(36) NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cj_atividades_lead FOREIGN KEY (lead_id) REFERENCES cj_comercial_leads(id) ON DELETE CASCADE,
  CONSTRAINT fk_cj_atividades_criado_por FOREIGN KEY (criado_por) REFERENCES cj_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cj_comercial_templates (
  id CHAR(36) PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  canal ENUM('whatsapp','email') NOT NULL,
  objetivo VARCHAR(100) DEFAULT 'prospeccao',
  tom VARCHAR(100) DEFAULT 'consultivo',
  assunto VARCHAR(255) NULL,
  conteudo LONGTEXT NOT NULL,
  ai_gerado BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  criado_por CHAR(36) NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cj_templates_criado_por FOREIGN KEY (criado_por) REFERENCES cj_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cj_comercial_campanhas (
  id CHAR(36) PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  canal ENUM('whatsapp','email') NOT NULL,
  status ENUM('rascunho','agendada','enviando','concluida','pausada') DEFAULT 'rascunho',
  template_id CHAR(36) NULL,
  filtro_estagio VARCHAR(120) NULL,
  filtro_origem VARCHAR(120) NULL,
  assunto VARCHAR(255) NULL,
  mensagem LONGTEXT NOT NULL,
  publico_total INT DEFAULT 0,
  enviados INT DEFAULT 0,
  entregues INT DEFAULT 0,
  respostas INT DEFAULT 0,
  agendado_em DATETIME NULL,
  ultimo_disparo_em DATETIME NULL,
  criado_por CHAR(36) NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cj_campanhas_template FOREIGN KEY (template_id) REFERENCES cj_comercial_templates(id) ON DELETE SET NULL,
  CONSTRAINT fk_cj_campanhas_criado_por FOREIGN KEY (criado_por) REFERENCES cj_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cj_comercial_disparos (
  id CHAR(36) PRIMARY KEY,
  campanha_id CHAR(36) NOT NULL,
  lead_id CHAR(36) NOT NULL,
  canal ENUM('whatsapp','email') NOT NULL,
  destino VARCHAR(191) NULL,
  assunto VARCHAR(255) NULL,
  mensagem LONGTEXT NOT NULL,
  status ENUM('pendente','enviado','erro','rascunho') DEFAULT 'pendente',
  provider_resposta JSON NULL,
  erro_texto TEXT NULL,
  enviado_em DATETIME NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cj_disparos_campanha FOREIGN KEY (campanha_id) REFERENCES cj_comercial_campanhas(id) ON DELETE CASCADE,
  CONSTRAINT fk_cj_disparos_lead FOREIGN KEY (lead_id) REFERENCES cj_comercial_leads(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cj_job_workers (
  id CHAR(36) PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(191) NULL,
  senha_hash TEXT NULL,
  telefone VARCHAR(60) NULL,
  cidade VARCHAR(150) NULL,
  nivel VARCHAR(80) DEFAULT 'operacional',
  disponibilidade TEXT NULL,
  onboarding_concluido BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY cj_job_workers_email_unique (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cj_job_condos (
  id CHAR(36) PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  responsavel_nome VARCHAR(255) NULL,
  email VARCHAR(191) NULL,
  senha_hash TEXT NULL,
  telefone VARCHAR(60) NULL,
  tipo VARCHAR(80) DEFAULT 'residencial',
  total_unidades INT NULL,
  endereco TEXT NULL,
  bairro VARCHAR(150) NULL,
  cidade VARCHAR(150) NULL,
  uf VARCHAR(10) NULL,
  premium BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY cj_job_condos_email_unique (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cj_job_opportunities (
  id CHAR(36) PRIMARY KEY,
  condo_id CHAR(36) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT NULL,
  tipo_jornada VARCHAR(120) DEFAULT 'efetivo',
  faixa_pagamento VARCHAR(120) NULL,
  requisitos TEXT NULL,
  disponibilidade TEXT NULL,
  data_servico DATE NULL,
  hora_servico TIME NULL,
  status ENUM('aberta','aceita','concluida','cancelada') DEFAULT 'aberta',
  worker_id CHAR(36) NULL,
  aceito_em DATETIME NULL,
  ativo BOOLEAN DEFAULT true,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cj_job_op_condo FOREIGN KEY (condo_id) REFERENCES cj_job_condos(id) ON DELETE CASCADE,
  CONSTRAINT fk_cj_job_op_worker FOREIGN KEY (worker_id) REFERENCES cj_job_workers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cj_job_applications (
  id CHAR(36) PRIMARY KEY,
  opportunity_id CHAR(36) NOT NULL,
  worker_id CHAR(36) NOT NULL,
  status ENUM('pendente','aceita','rejeitada','concluida','cancelada') DEFAULT 'pendente',
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY cj_job_applications_unique (opportunity_id, worker_id),
  CONSTRAINT fk_cj_job_app_opportunity FOREIGN KEY (opportunity_id) REFERENCES cj_job_opportunities(id) ON DELETE CASCADE,
  CONSTRAINT fk_cj_job_app_worker FOREIGN KEY (worker_id) REFERENCES cj_job_workers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
