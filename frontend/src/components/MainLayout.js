import React from 'react';
import { useLocation } from 'react-router-dom';

const MainLayout = ({ children }) => {
    const location = useLocation();
    const isHomePage = location.pathname === '/';

    // If it's the home page, we want full width (no container).
    // Otherwise, we apply the container class.
    const containerClass = isHomePage
        ? 'flex-grow'
        : 'flex-grow container mx-auto px-4 py-6';

    return (
        <main className={containerClass}>
            {children}
        </main>
    );
};

export default MainLayout;
