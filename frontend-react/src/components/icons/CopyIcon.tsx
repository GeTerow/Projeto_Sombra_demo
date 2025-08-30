import React from 'react';

export const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5A2.25 2.25 0 005.25 10.5v8.25A2.25 2.25 0 007.5 21h8.25A2.25 2.25 0 0018 18.75V17M9.75 15h6A2.25 2.25 0 0018 12.75v-6A2.25 2.25 0 0015.75 4.5h-6A2.25 2.25 0 007.5 6.75v6A2.25 2.25 0 009.75 15z" />
  </svg>
);