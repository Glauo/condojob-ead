import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663028326461/T5ftWUvfkBh5pRx7KLbqse/condojob-logo-cropped_a273700c.png";

const HIGHLIGHTS = [
  "Plataforma principal CondoJob",
  "Trabalho em condominio",
  "Educacao profissional integrada",
];

const PORTAL_ACTIONS = [
  {
    title: "Entrar como trabalhador",
    text: "Login da plataforma de empregos para aceitar trabalhos e acompanhar vagas.",
    href: "/profissionais/login",
    style: "primary" as const,
  },
  {
    title: "Cadastrar trabalhador",
    text: "Criar o acesso do profissional para receber vagas e aceitar servicos.",
    href: "/profissionais/cadastro",
    style: "secondary" as const,
  },
  {
    title: "Entrar como empresa",
    text: "Acesso para publicar vagas e acompanhar aceite dos trabalhadores.",
    href: "/empresas/login",
    style: "primary" as const,
  },
  {
    title: "Cadastrar empresa",
    text: "Criar o acesso da empresa ou condominio para postar vagas.",
    href: "/empresas/cadastro",
    style: "secondary" as const,
  },
];

const PLATFORM_MODULES = [
  {
    title: "Area do aluno",
    text: "Cursos, conteudo, biblioteca, notas, certificados, documentos, chat e suporte.",
    items: ["Dashboard", "Meus cursos", "Biblioteca", "Notas e certificados"],
    href: "/aluno",
  },
  {
    title: "Gestao academica",
    text: "Cursos, modulos, avaliacoes, alunos, financeiro, chat, relatorios e ClubCondoJob.",
    items: ["Cursos", "Conteudo", "Alunos", "Relatorios"],
    href: "/coordenador",
  },
  {
    title: "Plataforma de empregos",
    text: "Login do trabalhador, aceite de vaga, painel de trabalhos e publicacao pelas empresas.",
    items: ["Login do trabalhador", "Cadastro da empresa", "Aceite de vaga", "Painel de trabalhos"],
    href: "/empregos",
  },
  {
    title: "Operacao comercial",
    text: "Leads, funil, campanhas, templates IA e disparos comerciais por WhatsApp e e-mail.",
    items: ["Leads", "Funil", "Campanhas", "Templates IA"],
    href: "/comercial",
  },
];

const FEATURE_LINKS = [
  { label: "Login do trabalhador", href: "/profissionais/login" },
  { label: "Cadastro do trabalhador", href: "/profissionais/cadastro" },
  { label: "Login da empresa", href: "/empresas/login" },
  { label: "Cadastro da empresa", href: "/empresas/cadastro" },
  { label: "CondoJob EAD", href: "/curso-assistente-condominial" },
  { label: "Cursos extras", href: "/aluno/especializacoes" },
  { label: "Area comercial", href: "/comercial/login" },
  { label: "Plataforma de empregos", href: "/empregos" },
];

const SECTIONS = [
  {
    kicker: "Tela principal",
    title: "A CondoJob como plataforma principal, nao como leadpage da EAD.",
    text:
      "A nova pagina inicial apresenta a CondoJob como ecossistema principal para trabalho em condominio, cadastro, entrada de usuarios e acesso aos servicos.",
    image: "/home/screenshot-01-hero.png",
    reverse: false,
  },
  {
    kicker: "Fluxo de entrada",
    title: "Login, cadastro e uso da plataforma em um ponto central.",
    text:
      "A pagina principal passa a funcionar como porta de entrada do sistema, enquanto a CondoJob EAD continua disponivel como uma opcao destacada dentro do mesmo ambiente.",
    image: "/home/screenshot-02-onboarding.png",
    reverse: true,
  },
  {
    kicker: "Servicos",
    title: "As areas da CondoJob aparecem como funcoes reais da plataforma.",
    text:
      "A home agora organiza melhor os caminhos principais da CondoJob e deixa o modulo educacional no lugar certo: como um recurso integrado, nao como a home inteira.",
    image: "/home/screenshot-03-servicos.png",
    reverse: false,
  },
  {
    kicker: "Publico",
    title: "Entrada clara para profissionais, empresas e alunos.",
    text:
      "A pagina inicial mostra para quem a CondoJob foi feita e abre os caminhos principais da operacao sem transformar o site principal em uma pagina de anuncio do curso.",
    image: "/home/screenshot-04-publico.png",
    reverse: true,
  },
];

export async function HomeLanding() {
  const session = await getSession();
  const painelHref =
    session?.perfil === "coordenador"
      ? "/coordenador"
      : session?.perfil === "comercial"
        ? "/comercial"
        : session
          ? "/aluno"
          : "/login";
  const roleLabel =
    session?.perfil === "coordenador"
      ? "Gestao academica"
      : session?.perfil === "comercial"
        ? "Area comercial"
        : session?.perfil === "aluno"
          ? "Area do aluno"
          : "Acesso principal";

  return (
    <main className="home-landing-page">
      <section className="home-landing-hero">
        <nav className="home-landing-nav" aria-label="Navegacao principal">
          <Link href="/" className="home-landing-logo">
            <Image src={LOGO_URL} alt="CondoJob" width={170} height={52} priority />
          </Link>
          <div className="home-landing-nav-actions">
            <Link href={painelHref} className="home-landing-nav-link">
              {session ? "Ir para plataforma" : "Entrar"}
            </Link>
            <Link href="/curso-assistente-condominial" className="home-landing-nav-cta">
              CondoJob EAD
            </Link>
          </div>
        </nav>

        <div className="home-landing-hero-grid">
          <div className="home-landing-copy">
            <div className="home-landing-eyebrow">CondoJob - Plataforma principal</div>
            <h1>Login, cadastro e acessos principais da CondoJob em uma home funcional.</h1>
            <p>
              A raiz da CondoJob passa a funcionar como pagina principal da plataforma, com entrada real para usuarios,
              cadastro e operacao. A CondoJob EAD continua em destaque como um dos acessos do ecossistema.
            </p>
            <div className="home-landing-badges">
              {HIGHLIGHTS.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <div className="home-landing-actions">
              <Link href={painelHref} className="home-landing-primary">
                {session ? "Ir para minha area" : "Entrar na CondoJob"}
              </Link>
              <Link href="/cadastro" className="home-landing-secondary">
                Criar cadastro
              </Link>
            </div>
            <div className="home-landing-session-card">
              <strong>{roleLabel}</strong>
              <span>
                {session
                  ? `Sessao ativa para ${session.nome}. Acesse diretamente sua area principal da CondoJob.`
                  : "Entre com seu acesso atual ou faca um novo cadastro para usar a plataforma principal."}
              </span>
            </div>
          </div>

          <div className="home-landing-hero-media">
            <div className="home-landing-device home-landing-device-hero">
              <Image
                src="/home/screenshot-01-hero.png"
                alt="Tela principal CondoJob"
                width={1280}
                height={2778}
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="home-landing-highlight">
        <div className="home-landing-highlight-copy">
          <span className="home-landing-section-kicker">Acessos principais</span>
          <h2>A CondoJob EAD continua dentro da plataforma, mas a pagina principal agora funciona como home real da CondoJob.</h2>
          <p>
            Cadastro, login e acessos principais ficam na pagina inicial. A CondoJob EAD continua como uma opcao em
            destaque para quem quer entrar no ambiente educacional atual.
          </p>
        </div>
        <div className="home-landing-portal-grid">
          {PORTAL_ACTIONS.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={`home-landing-portal-card ${item.style === "primary" ? "is-primary" : ""}`}
            >
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-landing-platform-grid">
        {PLATFORM_MODULES.map((module) => (
          <div key={module.title} className="home-landing-platform-card">
            <div className="home-landing-platform-kicker">Modulo principal</div>
            <h3>{module.title}</h3>
            <p>{module.text}</p>
            <div className="home-landing-platform-tags">
              {module.items.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <Link href={module.href} className="home-landing-platform-link">
              Abrir area
            </Link>
          </div>
        ))}
      </section>

      <section className="home-landing-functions">
        <div className="home-landing-functions-copy">
          <span className="home-landing-section-kicker">Funcoes da plataforma</span>
          <h2>A pagina inicial agora concentra os caminhos reais da CondoJob.</h2>
          <p>
            O acesso principal passa a organizar login, cadastro, area do aluno, gestao academica, operacao comercial
            e CondoJob EAD dentro do mesmo ecossistema.
          </p>
        </div>
        <div className="home-landing-functions-grid">
          {FEATURE_LINKS.map((item) => (
            <Link key={item.label} href={item.href} className="home-landing-function-chip">
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      {SECTIONS.map((section) => (
        <section
          key={section.title}
          className={`home-landing-section ${section.reverse ? "reverse" : ""}`}
        >
          <div className="home-landing-section-copy">
            <span className="home-landing-section-kicker">{section.kicker}</span>
            <h2>{section.title}</h2>
            <p>{section.text}</p>
          </div>
          <div className="home-landing-section-media">
            <div className="home-landing-device">
              <Image
                src={section.image}
                alt={section.title}
                width={1280}
                height={2778}
              />
            </div>
          </div>
        </section>
      ))}
    </main>
  );
}
