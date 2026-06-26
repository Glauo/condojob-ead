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

const PORTAL_HUBS = [
  {
    title: "CondoJob EAD",
    text: "Portal educacional com cadastro do aluno, login proprio e painel de cursos, certificados e biblioteca.",
    actions: [
      { label: "Entrar no EAD", href: "/login", style: "primary" as const },
      { label: "Cadastrar no EAD", href: "/cadastro", style: "secondary" as const },
      { label: "Painel EAD", href: "/aluno", style: "ghost" as const },
    ],
  },
  {
    title: "CondoJob Comercial",
    text: "Portal comercial com login, cadastro proprio e painel de leads, funil, campanhas e templates IA.",
    actions: [
      { label: "Entrar no Comercial", href: "/comercial/login", style: "primary" as const },
      { label: "Cadastrar no Comercial", href: "/comercial/cadastro", style: "secondary" as const },
      { label: "Painel Comercial", href: "/comercial", style: "ghost" as const },
    ],
  },
  {
    title: "CondoJob Empregos",
    text: "Portal de trabalho com cadastro e login separados para profissional e empresa, cada um com seu painel.",
    actions: [
      { label: "Entrar em Empregos", href: "/profissionais/login", style: "primary" as const },
      { label: "Cadastrar em Empregos", href: "/profissionais/cadastro", style: "secondary" as const },
      { label: "Painel de Empregos", href: "/profissionais/painel", style: "ghost" as const },
    ],
    extras: [
      { label: "Empresa login", href: "/empresas/login" },
      { label: "Empresa cadastro", href: "/empresas/cadastro" },
      { label: "Painel empresa", href: "/empresas/painel" },
    ],
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
  { label: "Login EAD", href: "/login" },
  { label: "Cadastro EAD", href: "/cadastro" },
  { label: "Login comercial", href: "/comercial/login" },
  { label: "Cadastro comercial", href: "/comercial/cadastro" },
  { label: "Login trabalhador", href: "/profissionais/login" },
  { label: "Cadastro trabalhador", href: "/profissionais/cadastro" },
  { label: "Login empresa", href: "/empresas/login" },
  { label: "Cadastro empresa", href: "/empresas/cadastro" },
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
              <Link href="/comercial/cadastro" className="home-landing-secondary">
                Criar acesso comercial
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
          <span className="home-landing-section-kicker">Portais principais</span>
          <h2>Entradas separadas para EAD, Comercial e Empregos, cada uma com cadastro, login e painel proprio.</h2>
          <p>
            A pagina principal agora destaca os tres portais da CondoJob. Cada area tem seu proprio fluxo de entrada,
            seu proprio cadastro e seu proprio painel operacional.
          </p>
        </div>
        <div className="home-landing-portal-grid">
          {PORTAL_HUBS.map((portal) => (
            <div key={portal.title} className="home-landing-portal-card is-hub">
              <strong>{portal.title}</strong>
              <span>{portal.text}</span>
              <div className="home-landing-portal-actions">
                {portal.actions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={`home-landing-portal-btn is-${action.style}`}
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
              {"extras" in portal && portal.extras ? (
                <div className="home-landing-portal-links">
                  {portal.extras.map((item) => (
                    <Link key={item.label} href={item.href}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
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
