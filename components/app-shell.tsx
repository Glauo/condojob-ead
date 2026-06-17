"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

type NavItem = { label: string; href: string; icon: React.ReactNode };
type UserRole = "aluno" | "coordenador" | "comercial";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663028326461/T5ftWUvfkBh5pRx7KLbqse/condojob-logo-cropped_a273700c.png";

function NavIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path d={d} />
    </svg>
  );
}

const ALUNO_NAV: NavItem[] = [
  { label: "Dashboard", href: "/aluno", icon: <NavIcon d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /> },
  { label: "Meus Cursos", href: "/aluno/cursos", icon: <NavIcon d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /> },
  { label: "Especializacoes", href: "/aluno/especializacoes", icon: <NavIcon d="M11 17a1 1 0 102 0v-1.586l.293.293a1 1 0 001.414-1.414L12 11.586l-2.707 2.707a1 1 0 101.414 1.414L11 15.414V17zM4 4a2 2 0 012-2h7a3 3 0 013 3v4a1 1 0 11-2 0V5a1 1 0 00-1-1H6v12h2a1 1 0 110 2H6a2 2 0 01-2-2V4z" /> },
  { label: "Biblioteca", href: "/aluno/biblioteca", icon: <NavIcon d="M4 3a2 2 0 00-2 2v11.5A1.5 1.5 0 003.5 18H16a1 1 0 100-2H3.5a.5.5 0 010-1H16a2 2 0 002-2V5a2 2 0 00-2-2H4zm2 4a1 1 0 011-1h7a1 1 0 110 2H7a1 1 0 01-1-1zm0 3a1 1 0 011-1h5a1 1 0 110 2H7a1 1 0 01-1-1z" /> },
  { label: "Chat", href: "/aluno/chat", icon: <NavIcon d="M18 10c0 3.866-3.582 7-8 7a8.9 8.9 0 01-3.468-.692L3 17l.89-3.26A6.7 6.7 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" /> },
  { label: "ClubCondoJob", href: "/aluno/club-condojob", icon: <NavIcon d="M17.414 2.586a2 2 0 00-2.828 0L12 5.172 9.414 2.586a2 2 0 00-2.828 0L2.586 6.586a2 2 0 000 2.828L10 16.828l7.414-7.414a2 2 0 000-2.828l-4-4z" /> },
  { label: "Certificados", href: "/aluno/certificados", icon: <NavIcon d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /> },
  { label: "Financeiro", href: "/aluno/financeiro", icon: <NavIcon d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" /> },
  { label: "Documentos", href: "/aluno/documentos", icon: <NavIcon d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" /> },
  { label: "Minha senha", href: "/aluno/conta", icon: <NavIcon d="M10 2a4 4 0 00-4 4v2H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-1V6a4 4 0 00-4-4zM8 8V6a2 2 0 114 0v2H8z" /> },
  { label: "Suporte", href: "/aluno/suporte", icon: <NavIcon d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" /> },
];

const COORD_NAV: NavItem[] = [
  { label: "Dashboard", href: "/coordenador", icon: <NavIcon d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /> },
  { label: "Cursos", href: "/coordenador/cursos", icon: <NavIcon d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /> },
  { label: "Conteudo", href: "/coordenador/aulas", icon: <NavIcon d="M15 8a3 3 0 10-5.977-.75l-4.124 2.053a3 3 0 100 1.394l4.124 2.053A3 3 0 1015 12a3 3 0 00-1.977-2.83l-2.81 1.398A3.01 3.01 0 0010 11a2.99 2.99 0 00-.023-.17l2.834-1.41A2.992 2.992 0 0015 8z" /> },
  { label: "Alunos", href: "/coordenador/alunos", icon: <NavIcon d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /> },
  { label: "Chat", href: "/coordenador/chat", icon: <NavIcon d="M18 10c0 3.866-3.582 7-8 7a8.9 8.9 0 01-3.468-.692L3 17l.89-3.26A6.7 6.7 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" /> },
  { label: "ClubCondoJob", href: "/coordenador/club-condojob", icon: <NavIcon d="M17.414 2.586a2 2 0 00-2.828 0L12 5.172 9.414 2.586a2 2 0 00-2.828 0L2.586 6.586a2 2 0 000 2.828L10 16.828l7.414-7.414a2 2 0 000-2.828l-4-4z" /> },
  { label: "Financeiro", href: "/coordenador/financeiro", icon: <NavIcon d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" /> },
  { label: "Relatorios", href: "/coordenador/relatorios", icon: <NavIcon d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /> },
  { label: "Alunos / Docs", href: "/coordenador/documentos", icon: <NavIcon d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" /> },
];

const COMMERCIAL_NAV: NavItem[] = [
  { label: "Dashboard", href: "/comercial", icon: <NavIcon d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /> },
  { label: "Leads", href: "/comercial/leads", icon: <NavIcon d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /> },
  { label: "Funil", href: "/comercial/funil", icon: <NavIcon d="M3 4a1 1 0 011-1h12a1 1 0 01.8 1.6L12 11v5a1 1 0 01-1.447.894l-2-1A1 1 0 018 15v-4L3.2 4.6A1 1 0 013 4z" /> },
  { label: "Campanhas", href: "/comercial/campanhas", icon: <NavIcon d="M2 5a2 2 0 012-2h8a2 2 0 012 2v1h1a3 3 0 013 3v5a3 3 0 01-3 3h-1v1a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm2 1v10h8V6H4zm11 4a1 1 0 100-2 1 1 0 000 2zm-8 1a1 1 0 100 2h2a1 1 0 100-2H7z" /> },
  { label: "Templates IA", href: "/comercial/campanhas#templates", icon: <NavIcon d="M9.664 2.53a1 1 0 01.672 0l6 2A1 1 0 0117 5.47V10c0 4.418-2.91 7.438-6.264 8.818a1 1 0 01-.736 0C6.646 17.438 3.736 14.418 3.736 10V5.47a1 1 0 01.664-.94l5.264-2zm.336 3.108a1 1 0 00-1 1v3a1 1 0 001.447.894l2.5-1.25a1 1 0 000-1.788l-2.5-1.25A1 1 0 0010 5.638z" /> },
];

export function AppShell({
  children,
  userName,
  userRole,
  breadcrumb,
  notifCount = 0,
}: {
  children: React.ReactNode;
  userName: string;
  userRole: UserRole;
  breadcrumb?: string;
  notifCount?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = userRole === "coordenador" ? COORD_NAV : userRole === "comercial" ? COMMERCIAL_NAV : ALUNO_NAV;
  const initials = userName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const roleLabel = userRole === "coordenador" ? "Coordenador" : userRole === "comercial" ? "Comercial" : "Aluno";
  const sectionLabel = userRole === "coordenador" ? "Gestao" : userRole === "comercial" ? "Comercial" : "Minha Area";
  const topbarLabel = userRole === "comercial" ? "CondoJob Comercial" : "CondoJob Educacional";

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push(userRole === "comercial" ? "/comercial/login" : "/login");
  }

  return (
    <div className="shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <Image src={LOGO_URL} alt="CondoJob" width={120} height={36} style={{ objectFit: "contain" }} />
          <span className="sidebar-logo-tag">{userRole === "comercial" ? "CRM" : "Educacional"}</span>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-group-label">{sectionLabel}</span>
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/aluno" && item.href !== "/coordenador" && item.href !== "/comercial" && pathname.startsWith(item.href));
            return (
              <a
                key={item.href}
                href={item.href}
                className={`sidebar-link ${active ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon}
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{userName}</div>
              <div className="sidebar-user-role">{roleLabel}</div>
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={logout}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            Sair
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen((o) => !o)}>
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="topbar-breadcrumb">
            {topbarLabel} {breadcrumb ? <> / <strong>{breadcrumb}</strong></> : null}
          </div>
          <div className="topbar-spacer" />
          <div className="topbar-actions">
            <button className="notif-btn">
              <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              {notifCount > 0 && <span className="notif-dot" />}
            </button>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>

      {sidebarOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 199, background: "rgba(0,0,0,0.5)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
