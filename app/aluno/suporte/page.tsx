import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

const FAQS = [
  {
    q: "Como acesso minhas aulas?",
    a: "No menu lateral, clique em 'Meus Cursos'. Selecione o curso e clique em 'Aula 01' para iniciar. As próximas aulas são liberadas após concluir a anterior.",
  },
  {
    q: "Preciso assistir todo o vídeo para avançar?",
    a: "Sim. Cada aula exige que você assista 100% do vídeo. Após a conclusão, a atividade avaliativa é liberada automaticamente.",
  },
  {
    q: "O que acontece se eu reprovar na atividade?",
    a: "Você pode tentar novamente até atingir a nota mínima. O número máximo de tentativas é definido pelo coordenador do curso.",
  },
  {
    q: "Como obtenho meu certificado?",
    a: "O certificado é emitido automaticamente ao concluir todas as 10 aulas e atingir a nota mínima em todas as atividades. Acesse 'Certificados' no menu.",
  },
  {
    q: "Esqueci minha senha. O que fazer?",
    a: "Entre em contato com seu coordenador pelo WhatsApp ou e-mail informado abaixo. Ele poderá redefinir sua senha.",
  },
  {
    q: "Onde vejo minhas notas?",
    a: "No painel principal (Dashboard) você vê a média geral. Dentro de cada curso é possível ver a nota de cada atividade.",
  },
];

export default async function SuportePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.perfil !== "aluno") redirect("/coordenador");

  return (
    <AppShell breadcrumb="Suporte" userName={session.nome} userRole="aluno">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />Ajuda</div>
          <h1 className="page-title">Central de Suporte</h1>
          <p className="page-desc">Tire suas dúvidas ou entre em contato com sua equipe.</p>
        </div>
      </div>

      <div className="content-grid grid-2-1">

        {/* FAQ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="section-eyebrow">Dúvidas frequentes</div>
                <h3 className="section-title">Perguntas & Respostas</h3>
              </div>
            </div>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {FAQS.map((faq, i) => (
                <div key={i} style={{ borderBottom: i < FAQS.length - 1 ? "1px solid var(--cj-dark-border)" : "none", paddingBottom: i < FAQS.length - 1 ? "16px" : "0" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--cj-text)", marginBottom: "6px", display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <span style={{ color: "var(--cj-teal)", fontWeight: 800, flexShrink: 0 }}>Q.</span>
                    {faq.q}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--cj-text-secondary)", lineHeight: "1.6", paddingLeft: "22px" }}>
                    {faq.a}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contato */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="section-eyebrow">Contato direto</div>
                <h3 className="section-title">Fale com seu coordenador</h3>
              </div>
            </div>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <a
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ justifyContent: "center", background: "#25D366" }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </a>
              <a
                href="mailto:financeiro@ativoeducacional.tech"
                className="btn btn-secondary"
                style={{ justifyContent: "center" }}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                E-mail
              </a>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="section-eyebrow">Horário de atendimento</div>
              <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { dia: "Segunda a Sexta", hora: "08h – 18h" },
                  { dia: "Sábado", hora: "08h – 12h" },
                  { dia: "Domingo e feriados", hora: "Fechado" },
                ].map((h) => (
                  <div key={h.dia} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                    <span style={{ color: "var(--cj-text-secondary)" }}>{h.dia}</span>
                    <span style={{ fontWeight: 600, color: h.hora === "Fechado" ? "var(--cj-text-muted)" : "var(--cj-teal)" }}>{h.hora}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="metric-card metric-card-purple">
            <div className="metric-label">Seu acesso</div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--cj-text)", marginTop: "4px" }}>{session.nome}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--cj-text-muted)", marginTop: "2px" }}>{session.email}</div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
