import React from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import Logo from "@/components/luxury/Logo";

export default function PageNotFound({}) {
  const location = useLocation();
  const pageName = location.pathname.substring(1);

  const { data: authData, isFetched } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        return { user, isAuthenticated: true };
      } catch (error) {
        return { user: null, isAuthenticated: false };
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-off-white">
      <div className="max-w-md w-full">
        <div className="text-center space-y-6">
          <Logo variant="dark" className="mx-auto h-12 w-auto" />
          <div className="space-y-2">
            <h1 className="text-7xl font-light text-black/20">404</h1>
            <div className="h-0.5 w-16 bg-gold mx-auto"></div>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-medium text-ink">Page Not Found</h2>
            <p className="text-muted-text leading-relaxed">
              The page <span className="font-medium text-ink">"{pageName}"</span> could not be found in this application.
            </p>
          </div>
          {isFetched && authData.isAuthenticated && authData.user?.role === "admin" && (
            <div className="mt-8 p-4 bg-light-surface rounded-lg border border-brand-border">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-gold"></div>
                </div>
                <div className="text-left space-y-1">
                  <p className="text-sm font-medium text-ink">Admin Note</p>
                  <p className="text-sm text-muted-text leading-relaxed">
                    This could mean that the AI hasn't implemented this page yet. Ask it to implement it in the chat.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="pt-6">
            <button
              onClick={() => (window.location.href = "/")}
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-ink rounded-lg hover:bg-charcoal transition-colors duration-200"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}