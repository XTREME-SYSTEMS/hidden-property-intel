import React from "react";
import Logo from "@/components/luxury/Logo";

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-off-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Logo variant="dark" className="mx-auto h-12 w-auto" />
          <h1 className="mt-6 text-2xl font-heading font-semibold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="text-muted-text mt-2 text-sm">{subtitle}</p>}
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-brand-border p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-text mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}