import Image from "next/image";
import Link from "next/link";
import { JobsAuthForm } from "@/components/jobs-auth-form";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663028326461/T5ftWUvfkBh5pRx7KLbqse/condojob-logo-cropped_a273700c.png";

export default function EmpresasLoginPage() {
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
          <h1 className="login-left-title">Acesso da empresa<br /><span className="login-left-title-accent">Cadastre vagas e acompanhe quem aceitou.</span></h1>
          <p className="login-left-desc">Entre para publicar vagas com disponibilidade, pagamentos, requisitos e acompanhar os trabalhadores que aceitaram o servico.</p>
          <div className="jobs-login-links">
            <Link href="/empresas/cadastro" className="jobs-btn jobs-btn-primary">Cadastrar empresa</Link>
          </div>
        </div>
      </div>
      <div className="login-right">
        <div className="login-right-orb login-right-orb-1" />
        <div className="login-right-orb login-right-orb-2" />
        <JobsAuthForm perfil="company" modo="login" />
      </div>
    </div>
  );
}
