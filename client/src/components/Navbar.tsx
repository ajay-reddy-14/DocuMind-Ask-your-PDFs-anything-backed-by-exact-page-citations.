import { Link, useNavigate } from 'react-router-dom';
import { FileText, LogOut, Menu, Moon, Sun, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
          <FileText className="h-5 w-5 text-brand-600" />
          <span>DocuMind</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/documents"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Documents
              </Link>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Hi, {user?.name.split(' ')[0]}
              </span>
              <button onClick={handleLogout} className="btn-secondary text-xs py-1.5 px-3">
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary text-xs py-1.5 px-3">
                Log in
              </Link>
              <Link to="/register" className="btn-primary text-xs py-1.5 px-3">
                Sign up
              </Link>
            </>
          )}
          <button
            onClick={() => setDark((d) => !d)}
            className="rounded-md p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-gray-500"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3 space-y-2">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="block text-sm py-2" onClick={() => setMenuOpen(false)}>
                Dashboard
              </Link>
              <Link to="/documents" className="block text-sm py-2" onClick={() => setMenuOpen(false)}>
                Documents
              </Link>
              <button onClick={handleLogout} className="block text-sm py-2 text-red-600">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="block text-sm py-2" onClick={() => setMenuOpen(false)}>
                Log in
              </Link>
              <Link to="/register" className="block text-sm py-2" onClick={() => setMenuOpen(false)}>
                Sign up
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}

