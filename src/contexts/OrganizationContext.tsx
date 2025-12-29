'use client';

import React, { createContext, useContext } from 'react';

interface Organization {
    id: string;
    name: string;
    slug: string;
    theme_config?: any;
    // Adicione outros campos conforme necessário
}

interface OrganizationContextType {
    organization: Organization | null;
}

const OrganizationContext = createContext<OrganizationContextType>({
    organization: null,
});

export function OrganizationProvider({
    children,
    organization,
}: {
    children: React.ReactNode;
    organization: Organization;
}) {
    return (
        <OrganizationContext.Provider value={{ organization }}>
            {children}
        </OrganizationContext.Provider>
    );
}

export function useOrganization() {
    const context = useContext(OrganizationContext);
    if (context === undefined) {
        throw new Error('useOrganization must be used within an OrganizationProvider');
    }
    return context;
}
