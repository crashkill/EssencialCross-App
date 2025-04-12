import React from "react";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, LogOut, Settings } from "lucide-react";

const Header: React.FC = () => {
  // Versão simplificada para demonstração
  const user = { username: "demo" };
  const isAuthenticated = true;

  const handleLogout = async () => {
    // Versão simplificada para demonstração
    console.log('Logout clicado');
  };

  return (
    <header className="bg-secondary py-4 px-4 flex justify-between items-center">
      <div className="logo flex items-center">
        <Link href="/">
          <span className="text-accent font-bold text-xl cursor-pointer">
            Essencial<span className="text-white">Cross</span>
          </span>
        </Link>
      </div>
      <div className="user-profile">
        {isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full bg-gray-800 w-10 h-10 flex items-center justify-center">
                <Avatar>
                  <AvatarFallback className="bg-gray-800 text-white">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <span className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <span className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <span className="flex items-center">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link href="/login">
            <button className="bg-accent text-white px-4 py-2 rounded-lg text-sm">
              Login
            </button>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
