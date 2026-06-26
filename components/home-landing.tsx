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
    title: "Entrar na plataforma",
    text: "Acesso para usuarios ja cadastrados na CondoJob.",
    href: "/login",
    style: "primary" as const,
  },
  {
    title: "Criar cadastro",
    text: "Cadastro inicial para entrar no ecossistema CondoJob.",
    href: "/cadastro",
    style: "secondary" as const,
  },
  {
    title: "Entrar na CondoJob EAD",
    text: "Acesso em destaque para a plataforma educacional que ja existe hoje.",
    href: "/curso-assistente-condominial",
    style: "primary" as const,
  },
  {
    title: "Area comercial",
    text: "Funil, campanhas, leads e operacao comercial.",
    href: "/comercial/login",
    style: "secondary" as const,
  },
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
  const painelHref = session?.perfil === "coordenador" ? "/coordenador" : session ? "/aluno" : "/login";

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
              <Link href="/login" className="home-landing-primary">
                Entrar na CondoJob
              </Link>
              <Link href="/cadastro" className="home-landing-secondary">
                Criar cadastro
              </Link>
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
