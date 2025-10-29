import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, Calculator, LogOut, TrendingUp, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const location = useLocation();
    const { logout } = useAuth();

    const menuItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/business-profile', icon: Building2, label: 'Business Profile' },
        { path: '/valuation', icon: Calculator, label: 'Valuation' },
        { path: '/valuation-dashboard', icon: TrendingUp, label: 'Valuation Dashboard' },
        { path: '/gap-analysis', icon: ClipboardCheck, label: 'Gap Analysis' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
            {/* Logo/Brand */}
            <div className="p-6 border-b border-gray-800">
                <h1 className="text-2xl font-bold text-blue-400">ExitReady Pro</h1>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 p-4">
                <ul className="space-y-2">
                    {menuItems.map((item) => (
                        <li key={item.path}>
                            <Link
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive(item.path)
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-800'
                                    }`}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-gray-800">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 w-full transition"
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
