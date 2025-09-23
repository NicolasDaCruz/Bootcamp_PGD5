import React from 'react';

interface IconProps {
  className?: string;
}

export const KlarnaIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#FFB3C7"/>
    <path d="M6 6h3v12H6V6zm4.5 0H12l3 4.5L18 6h1.5v12H18v-7.5L15 14l-3-3.5V18h-1.5V6z" fill="#000"/>
  </svg>
);

export const PayPalIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#0070BA"/>
    <path d="M7.5 6h4.8c2.1 0 3.7 1.6 3.7 3.6 0 2.4-1.9 4.4-4.3 4.4H9.6l-.7 3H7.2L7.5 6zm1.8 1.5l-.4 1.8h1.8c.9 0 1.6-.7 1.6-1.5s-.7-1.3-1.6-1.3H9.3zm-1.2 5.5h1.8c.9 0 1.6.7 1.6 1.5s-.7 1.5-1.6 1.5H8.6l.5-3z" fill="white"/>
  </svg>
);

export const GooglePayIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#4285F4"/>
    <path d="M10.5 9v6h-1.5V9H10.5zm2.25 0c.825 0 1.5.675 1.5 1.5v3c0 .825-.675 1.5-1.5 1.5H11.25V9h1.5zm0 1.5H11.25v3h1.5v-3zm3.75-1.5v4.5c0 .825-.675 1.5-1.5 1.5s-1.5-.675-1.5-1.5V10.5c0-.825.675-1.5 1.5-1.5s1.5.675 1.5 1.5zm-1.5 0c0-.275-.225-.5-.5-.5s-.5.225-.5.5v3c0 .275.225.5.5.5s.5-.225.5-.5v-3z" fill="white"/>
    <circle cx="7" cy="12" r="1.5" fill="white"/>
  </svg>
);

export const ApplePayIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#000000"/>
    <path d="M8.2 6.5c-.2 1.2.3 2.4 1 3.2.8.9 2 1.5 3.3 1.4.1-1.2-.3-2.4-1-3.2-.8-.9-2.1-1.5-3.3-1.4zm2.6 1.8c-1.8-.1-3.3 1-4.1 1-.9 0-2.2-1-3.6-1-.9 0-1.8.5-2.3 1.3-1 1.7-.3 4.2.7 5.6.5.7 1.1 1.4 1.9 1.4.9 0 1.2-.6 2.2-.6s1.4.6 2.2.6c.9 0 1.3-.7 1.8-1.4.6-.8.8-1.6.8-1.6s-1.6-.6-1.6-2.4c0-1.5 1.2-2.2 1.3-2.3-.7-1-1.8-1.1-2.2-1.1-.1 0-.1 0-.1.5z" fill="white"/>
    <path d="M16.5 8.5v7h-.9V9.4h-.9v-.6h.9V8.2c0-.6.4-1 1-1h.6v.6h-.5c-.3 0-.5.2-.5.5v.6h1v.6h-1zm2.3 2.8c-.6 0-1 .4-1 1v2.2c0 .6.4 1 1 1s1-.4 1-1v-2.2c0-.6-.4-1-1-1zm.5 3.2c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-2.2c0-.3.2-.5.5-.5s.5.2.5.5v2.2z" fill="white"/>
  </svg>
);