import React from 'react';
import { getInitials, colorFromString } from '@/lib/utils';

export const Avatar: React.FC<{ name: string; size?: number }> = ({ name, size = 40 }) => (
    <div
        className="flex items-center justify-center rounded-full text-white font-semibold shadow-inner"
        style={{ width: size, height: size, background: `linear-gradient(135deg, ${colorFromString(name)}, #333)` }}
        title={name}
    >
        {getInitials(name)}
    </div>
);