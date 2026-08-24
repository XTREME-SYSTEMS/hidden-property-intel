import React from "react";

const ASSETS = {
  // variant="dark" = dark text on light background
  dark: {
    src768: "https://base44.app/api/apps/6a8ba268665196e93b7d57f7/files/mp/public/6a8ba268665196e93b7d57f7/54c549333_logo-header-768w.png",
    src512: "https://base44.app/api/apps/6a8ba268665196e93b7d57f7/files/mp/public/6a8ba268665196e93b7d57f7/cfd8c45f3_logo-header-512w.png",
    src320: "https://base44.app/api/apps/6a8ba268665196e93b7d57f7/files/mp/public/6a8ba268665196e93b7d57f7/cb2dc7ec7_logo-header-320w.png",
  },
  // variant="light" = light text on dark background
  light: {
    src768: "https://base44.app/api/apps/6a8ba268665196e93b7d57f7/files/mp/public/6a8ba268665196e93b7d57f7/3a14fe095_logo-header-dark-768w.png",
    src512: "https://base44.app/api/apps/6a8ba268665196e93b7d57f7/files/mp/public/6a8ba268665196e93b7d57f7/ba9012e33_logo-header-dark-512w.png",
    src320: "https://base44.app/api/apps/6a8ba268665196e93b7d57f7/files/mp/public/6a8ba268665196e93b7d57f7/d115f1924_logo-header-dark-320w.png",
  },
  icon: "https://base44.app/api/apps/6a8ba268665196e93b7d57f7/files/mp/public/6a8ba268665196e93b7d57f7/96fd67272_logo-icon-128.png",
};

export function Mark({ className = "h-8 w-8" }) {
  return <img src={ASSETS.icon} alt="" className={className} />;
}

export default function Logo({ variant = "dark", compact = false, className = "", style = {} }) {
  if (compact) {
    return (
      <img
        src={ASSETS.icon}
        alt="Hidden Property Intel"
        className={className}
        style={{ objectFit: "contain", ...style }}
      />
    );
  }
  const s = ASSETS[variant] || ASSETS.dark;
  return (
    <img
      src={s.src512}
      srcSet={`${s.src320} 320w, ${s.src512} 512w, ${s.src768} 768w`}
      sizes="(max-width: 768px) 170px, 250px"
      alt="Hidden Property Intel"
      className={className}
      style={{ ...style }}
    />
  );
}