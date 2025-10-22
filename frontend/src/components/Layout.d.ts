import React from 'react';
interface LayoutProps {
    children: React.ReactNode;
    user: any;
    signOut?: () => void;
}
declare const Layout: React.FC<LayoutProps>;
export default Layout;
