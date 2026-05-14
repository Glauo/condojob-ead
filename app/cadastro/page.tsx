import Image from "next/image";
import Link from "next/link";
import { dbQuery, initSchema } from "@/lib/db";
import { CadastroCheckoutForm } from "@/components/cadastro-checkout-form";

export const dynamic = "force-dynamic";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663028326461/T5ftWUvfkBh5pRx7KLbqse/condojob-logo-cropped_a273700c.png";

type Curso = {
  id: string;
  nome: string;
  descricao: string | null;
  carga_horaria: number;
  preco: number;
};

export default async function CadastroPage() {
  await initSchema();
  const cursos = await dbQuery<Curso>(
    "SELECT id, nome, descricao, carga_horaria, preco FROM cj_cursos WHERE preco > 0 ORDER BY criado_em ASC"
  );

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-left-orb login-left-orb-1" />
        <div className="login-left-orb login-left-orb-2" />
        <div className="login-left-inner">
          <div className="login-left-logo">
            <div className="login-left-logo-wrap">
              <Image src={LOGO_URL} alt="CondoJob" width={160} height={48} style={{ objectFit: "contain" }} />
            </div>
          </div>
          <h1 className="login-left-title">
            Comece sua formacao<br />
            <span className="login-left-title-accent">condominial agora.</span>
          </h1>
          <p className="login-left-desc">
            Cadastre seus dados, conclua o pagamento pelo Mercado Pago e tenha o curso liberado automaticamente quando a transacao for aprovada.
          </p>
          <div className="login-stats">
            <div className="login-stat">
              <div className="login-stat-value">8</div>
              <div className="login-stat-label">Modulos</div>
            </div>
            <div className="login-stat-divider" />
            <div className="login-stat">
              <div className="login-stat-value">70%</div>
              <div className="login-stat-label">Aprovacao</div>
            </div>
            <div className="login-stat-divider" />
            <div className="login-stat">
              <div className="login-stat-value">PIX</div>
              <div className="login-stat-label">Cartao ou boleto</div>
            </div>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-right-orb login-right-orb-1" />
        <div className="login-right-orb login-right-orb-2" />
        <div className="login-card">
          <div className="login-logo">
            <div className="login-logo-beacon" />
            <div className="login-logo-wrap">
              <Image src={LOGO_URL} alt="CondoJob" width={190} height={56} style={{ objectFit: "contain" }} />
            </div>
            <div className="login-logo-divider" />
          </div>

          <h2 className="login-title">Cadastro do aluno</h2>
          <p className="login-subtitle">Preencha os dados e siga para o pagamento seguro</p>

          {cursos.length === 0 ? (
            <div className="form-error">Nenhum curso com preco configurado para venda.</div>
          ) : (
            <CadastroCheckoutForm cursos={cursos} />
          )}

          <p className="login-footer-text">
            Ja tem cadastro? <Link href="/login" style={{ color: "var(--cj-teal)" }}>Entrar na plataforma</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
