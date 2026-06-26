import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663028326461/T5ftWUvfkBh5pRx7KLbqse/condojob-logo-cropped_a273700c.png";

const HIGHLIGHTS = [
  "Curso online com certificado",
  "Acesso a oportunidades CondoJob",
  "Formacao organizada por modulos",
];

const SECTIONS = [
  {
    kicker: "Experiencia inicial",
    title: "Uma entrada mais clara para a CondoJob Educacional.",
    text:
      "A nova pagina inicial apresenta a plataforma, mostra a experiencia real do aplicativo e conduz o interessado para a area atual de cadastro e matricula.",
    image: "/home/screenshot-01-hero.png",
    reverse: false,
  },
  {
    kicker: "Cadastro guiado",
    title: "Onboarding simples para quem quer entrar e comecar rapido.",
    text:
      "O interessado entende o fluxo, visualiza a proposta da plataforma e segue para a pagina atual da CondoJob EAD, onde faz cadastro, pagamento e liberacao do curso.",
    image: "/home/screenshot-02-onboarding.png",
    reverse: true,
  },
  {
    kicker: "Estrutura da plataforma",
    title: "Conteudo, servicos e organizacao em um ambiente unico.",
    text:
      "A CondoJob Educacional concentra aulas, progresso, apoio ao aluno e recursos da plataforma em uma experiencia visual mais premium e objetiva.",
    image: "/home/screenshot-03-servicos.png",
    reverse: false,
  },
  {
    kicker: "Publico atendido",
    title: "Uma plataforma pensada para formar profissionais e conectar oportunidades.",
    text:
      "A pagina inicial apresenta para quem a CondoJob foi feita e destaca o principal caminho comercial: entrar, se cadastrar e seguir para a EAD atual.",
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
            <Image src={LOGO_URL} alt="CondoJob Educacional" width={170} height={52} priority />
          </Link>
          <div className="home-landing-nav-actions">
            <Link href={painelHref} className="home-landing-nav-link">
              {session ? "Ir para plataforma" : "Entrar"}
            </Link>
            <Link href="/curso-assistente-condominial" className="home-landing-nav-cta">
              Quero entrar na CondoJob EAD
            </Link>
          </div>
        </nav>

        <div className="home-landing-hero-grid">
          <div className="home-landing-copy">
            <div className="home-landing-eyebrow">CondoJob Educacional</div>
            <h1>Pagina inicial da CondoJob com entrada direta para a plataforma EAD.</h1>
            <p>
              Esta home apresenta a CondoJob de forma mais premium, mostra a experiencia real da plataforma
              e destaca o acesso para cadastro e matricula na area educacional que ja existe hoje.
            </p>
            <div className="home-landing-badges">
              {HIGHLIGHTS.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <div className="home-landing-actions">
              <Link href="/curso-assistente-condominial" className="home-landing-primary">
                Cadastrar na CondoJob EAD
              </Link>
              <Link href="/login" className="home-landing-secondary">
                Ja sou aluno
              </Link>
            </div>
          </div>

          <div className="home-landing-hero-media">
            <div className="home-landing-device home-landing-device-hero">
              <Image
                src="/home/screenshot-01-hero.png"
                alt="Tela inicial CondoJob"
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
          <span className="home-landing-section-kicker">Acesso em destaque</span>
          <h2>Quem quiser se cadastrar segue daqui direto para a CondoJob EAD atual.</h2>
          <p>
            O botao principal leva para a pagina atual de venda e matricula da CondoJob, mantendo o fluxo de cadastro,
            pagamento e entrada no curso sem alterar a funcionalidade que ja esta no ar.
          </p>
        </div>
        <div className="home-landing-highlight-actions">
          <Link href="/curso-assistente-condominial" className="home-landing-highlight-cta">
            Ir para cadastro na CondoJob EAD
          </Link>
          <Link href="/cadastro" className="home-landing-secondary">
            Ir direto para matricula
          </Link>
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
