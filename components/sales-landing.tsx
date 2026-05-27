import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663028326461/T5ftWUvfkBh5pRx7KLbqse/condojob-logo-cropped_a273700c.png";

export async function SalesLanding() {
  const session = await getSession();
  const painelHref = session?.perfil === "coordenador" ? "/coordenador" : session ? "/aluno" : "/login";

  return (
    <main className="landing-page">
      <section className="landing-hero">
        <nav className="landing-nav" aria-label="Navegação principal">
          <Link href="/" className="landing-logo">
            <Image src={LOGO_URL} alt="CondoJob Educacional" width={168} height={50} priority />
          </Link>
          <div className="landing-nav-actions">
            <Link href={painelHref} className="landing-nav-link">
              {session ? "Ir para plataforma" : "Entrar"}
            </Link>
            <Link href="/cadastro" className="landing-nav-cta">Matricular agora</Link>
          </div>
        </nav>

        <div className="landing-hero-content">
          <div className="landing-eyebrow">Curso online com certificado</div>
          <h1>Curso de Assistente Condominial</h1>
          <p>
            Formação prática para quem quer atuar em condomínios com atendimento profissional,
            tecnologia, segurança, rotina operacional e postura de alto padrão.
          </p>
          <div className="landing-price-row" aria-label="Preco do curso">
            <span className="landing-price-main">R$ 99,00</span>
            <span className="landing-price-divider">ou</span>
            <span className="landing-price-installments">12x de R$ 9,90</span>
          </div>
          <div className="landing-hero-actions">
            <Link href="/cadastro" className="landing-primary-btn">Ir para a plataforma e fazer matrícula</Link>
            <Link href="/login" className="landing-secondary-btn">Já sou aluno</Link>
          </div>
          <div className="landing-trust-row">
            <span>8 módulos</span>
            <span>Avaliações automáticas</span>
            <span>Certificado digital</span>
            <span>Acesso à plataforma de empregos</span>
            <span>Pagamento seguro</span>
          </div>
        </div>
      </section>

      <section className="landing-section landing-course-strip" aria-label="Resumo do curso">
        <div>
          <span className="landing-section-kicker">CondoJob Educacional</span>
          <h2>Uma trilha direta para o mercado condominial.</h2>
        </div>
        <p>
          O interessado é encaminhado para a plataforma CondoJob Educacional, onde faz o cadastro,
          conclui o pagamento pelo Mercado Pago e recebe acesso ao curso após a confirmação.
        </p>
      </section>

      <section className="landing-section landing-jobs-access" aria-label="Plataforma de empregos CondoJob">
        <div className="landing-jobs-stat">
          <span>+500</span>
          <strong>condomínios cadastrados</strong>
        </div>
        <div className="landing-jobs-copy">
          <span className="landing-section-kicker">Oportunidade após o curso</span>
          <h2>Concluiu, certificou, entrou no radar das oportunidades CondoJob.</h2>
          <p>
            O aluno aprovado no Curso de Assistente Condominial será liberado na plataforma
            de empregos da CondoJob, onde existem mais de 500 condomínios cadastrados em busca
            de profissionais preparados e com certificado CondoJob.
          </p>
          <div className="landing-jobs-points">
            <span>Certificado CondoJob como diferencial</span>
            <span>Perfil liberado para oportunidades</span>
            <span>Mais visibilidade para contratação</span>
          </div>
          <Link href="/cadastro" className="landing-jobs-cta">Quero me certificar e acessar as oportunidades</Link>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-head">
          <span className="landing-section-kicker">O que esta incluso</span>
          <h2>Conteudo organizado para formar um profissional pronto para atuar.</h2>
        </div>
        <div className="landing-feature-grid">
          {[
            ["Videoaulas por módulo", "Aulas organizadas em sequência, com liberação conforme o desempenho do aluno."],
            ["Avaliações com nota", "Cada módulo tem avaliação objetiva e correção automática pela plataforma."],
            ["Materiais de apoio", "Biblioteca com arquivos e conteúdos complementares para reforçar o aprendizado."],
            ["Certificado digital", "Conclusão com certificado para o aluno aprovado no curso."],
            ["Liberação para empregos", "Aluno aprovado fica liberado para acessar a plataforma de empregos da CondoJob."],
            ["Chat com coordenador", "Canal de suporte para tirar dúvidas durante a formação."],
            ["ClubCondoJob", "Clube de descontos para alunos premium, com benefícios cadastrados na plataforma."],
          ].map(([title, text]) => (
            <article className="landing-feature-card" key={title}>
              <div className="landing-feature-dot" />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-syllabus">
        <div className="landing-section-head">
          <span className="landing-section-kicker">Programa do curso</span>
          <h2>8 módulos essenciais para a rotina condominial.</h2>
        </div>
        <div className="landing-module-list">
          {[
            "Introdução à Profissão",
            "Comunicação de Excelência",
            "Atendimento ao Morador e Visitantes",
            "Tecnologia e Sistemas Modernos",
            "Segurança Patrimonial e Predial",
            "Rotinas e Procedimentos Operacionais",
            "Postura Profissional e Ética",
            "Soluções Proativas e Gestão de Conflitos",
          ].map((module, index) => (
            <div className="landing-module-item" key={module}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{module}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section landing-offer" aria-label="Oferta do curso">
        <div className="landing-offer-copy">
          <span className="landing-section-kicker">Matrícula online</span>
          <h2>Comece agora por R$ 99,00.</h2>
          <p>
            Também disponível em até 12x de R$ 9,90 pelo Mercado Pago.
            Após o cadastro, o aluno segue automaticamente para o pagamento dentro da plataforma.
          </p>
        </div>
        <div className="landing-offer-actions">
          <Link href="/cadastro" className="landing-primary-btn">Cadastrar e pagar</Link>
          <Link href="/login" className="landing-secondary-btn">Acessar minha conta</Link>
        </div>
      </section>
    </main>
  );
}
