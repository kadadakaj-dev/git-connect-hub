import { ReactNode } from "react";

interface ClientLayoutProps {
  children: ReactNode;
}

const ClientLayout = ({ children }: ClientLayoutProps) => {
  return (
    <div className="client-theme-polish min-h-screen">
      {children}
    </div>
  );
};

export default ClientLayout;
