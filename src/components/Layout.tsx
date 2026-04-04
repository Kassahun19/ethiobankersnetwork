import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Briefcase, MessageSquare, User, LogOut, LayoutDashboard, CreditCard, Menu, X, Gift, Shield } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { name: "Jobs", path: "/jobs", icon: Briefcase },
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, protected: true },
    { name: "Messaging", path: "/messaging", icon: MessageSquare, protected: true },
    { name: "Subscription", path: "/subscription", icon: CreditCard, protected: true },
    { name: "Referrals", path: "/referrals", icon: Gift, protected: true },
    { name: "Profile", path: "/profile", icon: User, protected: true },
    { name: "Admin", path: "/admin", icon: Shield, adminOnly: true },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly) return user?.role === "admin";
    if (item.protected) return !!user;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-blue-800 tracking-tight">
                EthioBankers <span className="text-yellow-600">Network</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="flex items-center text-gray-600 hover:text-blue-800 font-medium transition-colors"
                >
                  <item.icon className="w-4 h-4 mr-1.5" />
                  {item.name}
                </Link>
              ))}
              {user ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center text-gray-600 hover:text-red-600 font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-1.5" />
                  Logout
                </button>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link to="/login" className="text-gray-600 hover:text-blue-800 font-medium">
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-900 transition-colors"
                  >
                    Register
                  </Link>
                </div>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 hover:text-blue-800 focus:outline-none"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
            >
              <div className="px-4 pt-2 pb-6 space-y-2">
                {filteredNavItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center px-3 py-2 text-gray-600 hover:bg-blue-50 hover:text-blue-800 rounded-md font-medium"
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                ))}
                {user ? (
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center px-3 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-md font-medium"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Logout
                  </button>
                ) : (
                  <div className="pt-4 space-y-2">
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="block w-full text-center px-3 py-2 text-gray-600 hover:bg-blue-50 rounded-md font-medium"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="block w-full text-center px-3 py-2 bg-blue-800 text-white rounded-md font-medium"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            <div className="text-center md:text-left">
              <Link to="/" className="text-xl font-bold text-blue-800 tracking-tight">
                EthioBankers <span className="text-yellow-600">Network</span>
              </Link>
              <p className="text-gray-500 text-sm mt-2">
                Connecting the banking professionals of Ethiopia.
              </p>
            </div>
            
            <div className="flex flex-col items-center space-y-4">
              <a 
                href="https://t.me/ethiobankers_bot" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center bg-blue-50 text-blue-700 px-6 py-2.5 rounded-full font-semibold hover:bg-blue-100 transition-all border border-blue-200 shadow-sm"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.91-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
                Chat with EthioBankers Bot
              </a>
              <p className="text-gray-400 text-xs">
                Get instant job alerts on Telegram
              </p>
            </div>

            <div className="text-center md:text-right">
              <p className="text-gray-500 text-sm">
                © {new Date().getFullYear()} EthioBankers Network.
              </p>
              <p className="text-gray-400 text-xs mt-1">
                All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
