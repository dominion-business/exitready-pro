import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, Calculator, LogOut, TrendingUp, ClipboardCheck, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const location = useLocation();
    const { logout } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const menuItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/business-profile', icon: Building2, label: 'Client Profile' },
        { path: '/valuation', icon: Calculator, label: 'Valuation' },
        { path: '/valuation-dashboard', icon: TrendingUp, label: 'Valuation Dashboard' },
        { path: '/gap-analysis', icon: ClipboardCheck, label: 'Gap Analysis' },
        { path: '/task-manager', icon: CheckCircle2, label: 'Task Manager' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <div className={`bg-gray-900 text-white min-h-screen flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
            {/* Logo/Brand and Toggle */}
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                {!isCollapsed && <h1 className="text-2xl font-bold text-blue-400">ExitReady Pro</h1>}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
                    title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
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
                                    } ${isCollapsed ? 'justify-center' : ''}`}
                                title={isCollapsed ? item.label : ''}
                            >
                                <item.icon size={20} />
                                {!isCollapsed && <span>{item.label}</span>}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-gray-800">
                <button
                    onClick={logout}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 w-full transition ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? 'Logout' : ''}
                >
                    <LogOut size={20} />
                    {!isCollapsed && <span>Logout</span>}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
