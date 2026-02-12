import React, { useEffect } from 'react';
import { useTenant } from '../../contexts/TenantContext';

/**
 * Debug component to log tenant context state
 * Remove this in production
 */
export const TenantDebugger: React.FC = () => {
    const { barbershopId, tenantId, slug, isValidTenant, barbershopData } = useTenant();

    useEffect(() => {
        console.log('🔍 TenantDebugger - Current State:', {
            barbershopId,
            tenantId,
            slug,
            isValidTenant,
            barbershopName: barbershopData?.name,
            localStorage_barbershopId: localStorage.getItem('barbershopId'),
            localStorage_tenantId: localStorage.getItem('tenantId'),
            localStorage_slug: localStorage.getItem('barbershopSlug')
        });
    }, [barbershopId, tenantId, slug, isValidTenant, barbershopData]);

    if (import.meta.env.PROD) return null;

    return (
        <div className="fixed bottom-4 left-4 bg-black/90 text-white p-3 rounded-lg text-xs font-mono z-50 max-w-sm">
            <div className="font-bold mb-2 text-yellow-400">🔍 Tenant Debug</div>
            <div className="space-y-1">
                <div>Slug: <span className="text-green-400">{slug || 'null'}</span></div>
                <div>BarbershopId: <span className="text-green-400">{barbershopId || 'null'}</span></div>
                <div>TenantId: <span className="text-green-400">{tenantId || 'null'}</span></div>
                <div>Valid: <span className={isValidTenant ? 'text-green-400' : 'text-red-400'}>{isValidTenant ? 'Yes' : 'No'}</span></div>
                <div className="pt-2 border-t border-white/20">
                    <div>LS barbershopId: <span className="text-blue-400">{localStorage.getItem('barbershopId') || 'null'}</span></div>
                    <div>LS tenantId: <span className="text-blue-400">{localStorage.getItem('tenantId') || 'null'}</span></div>
                </div>
            </div>
        </div>
    );
};
