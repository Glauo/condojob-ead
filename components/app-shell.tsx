"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

type NavItem = { label: string; href: string; icon: React.ReactNode };

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
  { label: "Certificados", href: "/aluno/certificados", icon: <NavIcon d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /> },
  { label: "Financeiro", href: "/aluno/financeiro", icon: <NavIcon d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" /> },
  { label: "Documentos", href: "/aluno/documentos", icon: <NavIcon d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" /> },
];

const COORD_NAV: NavItem[] = [
  { label: "Dashboard", href: "/coordenador", icon: <NavIcon d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /> },
  { label: "Cursos", href: "/coordenador/cursos", icon: <NavIcon d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /> },
  { label: "Alunos", href: "/coordenador/alunos", icon: <NavIcon d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /> },
  { label: "Atividades", href: "/coordenador/atividades", icon: <NavIcon d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" /> },
  { label: "Financeiro", href: "/coordenador/financeiro", icon: <NavIcon d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" /> },
  { label: "Relatórios", href: "/coordenador/relatorios", icon: <NavIcon d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /> },
  { label: "Documentos", href: "/coordenador/documentos", icon: <NavIcon d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" /> },
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
  userRole: "aluno" | "coordenador";
  breadcrumb?: string;
  notifCount?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = userRole === "coordenador" ? COORD_NAV : ALUNO_NAV;
  const initials = userName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <div className="shell">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <Image src={LOGO_URL} alt="CondoJob" width={120} height={36} style={{ objectFit: "contain" }} />
          <span className="sidebar-logo-tag">EAD</span>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-group-label">
            {userRole === "coordenador" ? "Gestão" : "Minha Área"}
          </span>
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/aluno" && item.href !== "/coordenador" && pathname.startsWith(item.href));
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
          <div className="sidebar-user" onClick={logout} title="Sair">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{userName}</div>
              <div className="sidebar-user-role">
                {userRole === "coordenador" ? "Coordenador" : "Aluno"} · Sair
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main">
        <header className="topbar">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen((o) => !o)}>
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="topbar-breadcrumb">
            CondoJob EAD {breadcrumb ? <> / <strong>{breadcrumb}</strong></> : null}
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
