import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ADMIN_LINKS = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/aprovacoes", label: "Aprovações", end: false },
  { to: "/students", label: "Alunos", end: false },
  { to: "/enrollments", label: "Matrículas", end: false },
  { to: "/classes", label: "Turmas", end: false },
  { to: "/attendance", label: "Frequência", end: false },
  { to: "/payments", label: "Mensalidades", end: false },
  { to: "/admin/guias", label: "Guias", end: false },
];

const STUDENT_LINKS = [
  { to: "/portal", label: "Meu portal", end: false },
  { to: "/portal/turmas", label: "Minhas turmas", end: false },
  { to: "/portal/pagamentos", label: "Meus pagamentos", end: false },
  { to: "/portal/perfil", label: "Meu perfil", end: false },
  { to: "/portal/instrutores", label: "Instrutores", end: false },
  { to: "/portal/como-funciona", label: "Como funciona", end: false },
];

export function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const shouldHide = currentScrollY > lastScrollY.current && currentScrollY > 40;

      setNavHidden((previous) => {
        const next = shouldHide;
        return previous === next ? previous : next;
      });

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const links = isAdmin ? ADMIN_LINKS : STUDENT_LINKS;

  return (
    <div className={`layout${navHidden ? " is-nav-hidden" : ""}`}>
      <button
        className="sidebar-toggle"
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
      >
        <span />
        <span />
        <span />
      </button>

      <aside className={`sidebar${menuOpen ? " is-open" : ""}${navHidden ? " is-hidden" : ""}`}>
        <div className="sidebar__brand">
          <span className="sidebar__han" aria-hidden="true">
            功夫
          </span>
          <span className="sidebar__name">
            Kung Fu <em>Manager</em>
          </span>
        </div>

        <nav>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <span className="sidebar__user">{user?.name}</span>
          <span className="sidebar__role">
            {isAdmin ? "Administração" : "Aluno"}
          </span>
          <button className="btn btn--ghost btn--block" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </aside>

      {menuOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Fechar menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
