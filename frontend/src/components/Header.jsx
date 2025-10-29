import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, User, Building2 } from 'lucide-react';

const Header = () => {
    const { user } = useAuth();

    return (
        <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-end">
                {/* Right side - Business info and User info */}
                <div className="flex items-center gap-4">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                        <Bell size={20} className="text-gray-600" />
                    </button>

                    {/* Business Name & Industry */}
                    {user?.business_name && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                            <Building2 size={18} className="text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">
                                {user.business_name}
                                {user.industry && (
                                    <span className="text-blue-600 ml-1">| {user.industry}</span>
                                )}
                            </span>
                        </div>
                    )}

                    {/* User Email */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                        <User size={18} className="text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">
                            {user?.email || 'User'}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;