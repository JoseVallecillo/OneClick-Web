import { ErrorBoundary } from '@/components/error-boundary';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { createInertiaApp } from '@inertiajs/react';

const appName = import.meta.env.VITE_APP_NAME || 'OneClick';

const pages = import.meta.glob('./pages/**/*.tsx');
const modulePages = import.meta.glob('../../Modules/**/resources/js/pages/**/*.tsx');

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => {
        if (name.includes('::')) {
            const [module, page] = name.split('::');
            const key = `../../Modules/${module}/resources/js/pages/${page}.tsx`;
            if (modulePages[key]) {
                return modulePages[key]();
            }
        }
        return pages[`./pages/${name}.tsx`]();
    },
    layout: (name) => {
        const pageName = name.includes('::') ? name.split('::')[1] : name;
        switch (true) {
            case pageName === 'welcome':
                return null;
            case pageName.startsWith('auth/') || pageName.startsWith('Auth/'):
                return AuthLayout;
            case pageName.startsWith('settings/') || pageName.startsWith('Settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <ErrorBoundary>
                <TooltipProvider delayDuration={0}>{app}</TooltipProvider>
            </ErrorBoundary>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
