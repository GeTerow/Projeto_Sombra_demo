import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`animate-pulse rounded-md bg-slate-200/70 dark:bg-slate-700/50 ${className}`} />
);