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
        <nav className="landing-nav" aria-label="Navegacao principal">
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
          <div className="landing-eyebrow">Curso online com certificado e acesso a oportunidades</div>
          <h1>Curso de Assistente Condominial</h1>
          <p>
            Forma&ccedil;&atilde;o pr&aacute;tica para quem quer atuar em condom&iacute;nios com atendimento profissional,
            tecnologia, seguran&ccedil;a, rotina operacional e postura de alto padr&atilde;o.
          </p>
          <div className="landing-hero-actions">
            <Link href="/cadastro" className="landing-primary-btn">Ir para a plataforma e fazer matr&iacute;cula</Link>
            <Link href="/login" className="landing-secondary-btn">J&aacute; sou aluno</Link>
          </div>
          <div className="landing-trust-row">
            <span>8 m&oacute;dulos</span>
            <span>Avalia&ccedil;&otilde;es autom&aacute;ticas</span>
            <span>Certificado digital</span>
            <span>Acesso &agrave; plataforma de empregos</span>
            <span>Pagamento seguro</span>
          </div>
        </div>
      </section>

      <section className="landing-section landing-jobs-access landing-jobs-priority" aria-label="Plataforma de empregos CondoJob">
        <div className="landing-jobs-stat">
          <span>+500</span>
          <strong>condom&iacute;nios cadastrados</strong>
        </div>
        <div className="landing-jobs-copy">
          <span className="landing-section-kicker">Primeiro: oportunidade real de trabalho</span>
          <h2>Ao concluir o curso, o aluno entra no radar das vagas da CondoJob.</h2>
          <p>
            O aluno aprovado no Curso de Assistente Condominial &eacute; liberado na plataforma
            de empregos da CondoJob, onde existem mais de 500 condom&iacute;nios cadastrados buscando
            profissionais preparados, confi&aacute;veis e com certificado CondoJob.
          </p>
          <div className="landing-jobs-points">
            <span>Certificado CondoJob como diferencial</span>
            <span>Perfil liberado para oportunidades</span>
            <span>Mais visibilidade para contrata&ccedil;&atilde;o</span>
          </div>
          <Link href="/cadastro" className="landing-jobs-cta">Quero me certificar e acessar as oportunidades</Link>
        </div>
      </section>

      <section className="landing-section landing-how" aria-label="Como funciona a CondoJob">
        <div className="landing-section-head">
          <span className="landing-section-kicker">Como funciona a CondoJob</span>
          <h2>Do cadastro &agrave; oportunidade: uma jornada simples dentro da plataforma.</h2>
        </div>
        <div className="landing-how-grid">
          {[
            ["1", "Cadastro e pagamento", "O aluno faz a matr&iacute;cula online, paga com seguran&ccedil;a pelo Mercado Pago e recebe acesso &agrave; plataforma."],
            ["2", "Curso liberado", "As videoaulas, materiais e avalia&ccedil;&otilde;es ficam organizados por m&oacute;dulo para o aluno estudar no pr&oacute;prio ritmo."],
            ["3", "Avalia&ccedil;&otilde;es e certificado", "Ao concluir os m&oacute;dulos e atingir a nota m&iacute;nima, o certificado CondoJob &eacute; liberado automaticamente."],
            ["4", "Acesso &agrave;s vagas", "Com o certificado, o aluno aprovado passa a fazer parte da plataforma de empregos da CondoJob."],
          ].map(([step, title, text]) => (
            <article className="landing-how-card" key={step}>
              <span>{step}</span>
              <h3>{title}</h3>
              <p dangerouslySetInnerHTML={{ __html: text }} />
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-course-strip" aria-label="Resumo do curso">
        <div>
          <span className="landing-section-kicker">CondoJob Educacional</span>
          <h2>Uma trilha direta para o mercado condominial.</h2>
        </div>
        <p>
          O interessado &eacute; encaminhado para a plataforma CondoJob Educacional, onde faz o cadastro,
          conclui o pagamento pelo Mercado Pago e recebe acesso ao curso ap&oacute;s a confirma&ccedil;&atilde;o.
        </p>
      </section>

      <section className="landing-section">
        <div className="landing-section-head">
          <span className="landing-section-kicker">O que est&aacute; incluso</span>
          <h2>Conte&uacute;do organizado para formar um profissional pronto para atuar.</h2>
        </div>
        <div className="landing-feature-grid">
          {[
            ["Videoaulas por m&oacute;dulo", "Aulas organizadas em sequ&ecirc;ncia, com libera&ccedil;&atilde;o conforme o desempenho do aluno."],
            ["Avalia&ccedil;&otilde;es com nota", "Cada m&oacute;dulo tem avalia&ccedil;&atilde;o objetiva e corre&ccedil;&atilde;o autom&aacute;tica pela plataforma."],
            ["Materiais de apoio", "Biblioteca com arquivos e conte&uacute;dos complementares para refor&ccedil;ar o aprendizado."],
            ["Certificado digital", "Conclus&atilde;o com certificado para o aluno aprovado no curso."],
            ["Libera&ccedil;&atilde;o para empregos", "Aluno aprovado fica liberado para acessar a plataforma de empregos da CondoJob."],
            ["Chat com coordenador", "Canal de suporte para tirar d&uacute;vidas durante a forma&ccedil;&atilde;o."],
            ["ClubCondoJob", "Clube de descontos para alunos premium, com benef&iacute;cios cadastrados na plataforma."],
          ].map(([title, text]) => (
            <article className="landing-feature-card" key={title}>
              <div className="landing-feature-dot" />
              <h3 dangerouslySetInnerHTML={{ __html: title }} />
              <p dangerouslySetInnerHTML={{ __html: text }} />
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-syllabus">
        <div className="landing-section-head">
          <span className="landing-section-kicker">Programa do curso</span>
          <h2>8 m&oacute;dulos essenciais para a rotina condominial.</h2>
        </div>
        <div className="landing-module-list">
          {[
            "Introdu&ccedil;&atilde;o &agrave; Profiss&atilde;o",
            "Comunica&ccedil;&atilde;o de Excel&ecirc;ncia",
            "Atendimento ao Morador e Visitantes",
            "Tecnologia e Sistemas Modernos",
            "Seguran&ccedil;a Patrimonial e Predial",
            "Rotinas e Procedimentos Operacionais",
            "Postura Profissional e &Eacute;tica",
            "Solu&ccedil;&otilde;es Proativas e Gest&atilde;o de Conflitos",
          ].map((module, index) => (
            <div className="landing-module-item" key={module}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong dangerouslySetInnerHTML={{ __html: module }} />
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section landing-offer" aria-label="Oferta do curso">
        <div className="landing-offer-copy">
          <span className="landing-section-kicker">Matr&iacute;cula online</span>
          <h2>Comece agora por R$ 99,00.</h2>
          <p>
            Tamb&eacute;m dispon&iacute;vel em at&eacute; 12x de R$ 9,90 pelo Mercado Pago.
            Ap&oacute;s o cadastro, o aluno segue automaticamente para o pagamento dentro da plataforma.
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
