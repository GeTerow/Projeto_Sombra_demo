import React from 'react';
import { BadgeColor } from '@/types/types';

export const Badge: React.FC<{ children: React.ReactNode; color?: BadgeColor; className?: string }> = ({ children, color = 'slate', className }) => {
    const colorMap: Record<BadgeColor, string> = {
        slate: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
        green: 'bg-green-100 text-green-700 dark:bg-green-600/20 dark:text-green-300',
        amber: 'bg-amber-100 text-amber-700 dark:bg-amber-600/20 dark:text-amber-300',
        indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-600/20 dark:text-indigo-300',
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${colorMap[color]} ${className || ''}`}>
            {children}
        </span>
    );
};