'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Cuboid as Cube } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import { logout } from '@/features/auth/authSlice';

export function Navbar() {
  const pathname = usePathname();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const dispatch = useAppDispatch();
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
  };

  if (!isMounted) {
    return null;
  }

  return (
    <header className="bg-background border-b sticky top-0 z-30">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Cube className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">CubeTourneys</span>
          </Link>
          
          <nav className="ml-10 hidden md:flex items-center space-x-4">
            <Link href="/tournaments" className={`text-sm font-medium transition-colors ${pathname === '/tournaments' ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
              Tournaments
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/tournaments/new" className={`text-sm font-medium transition-colors ${pathname === '/tournaments/new' ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                  Create Tournament
                </Link>
                <Link href="/profile" className={`text-sm font-medium transition-colors ${pathname === '/profile' ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                  My Profile
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <div className="hidden md:flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    My Account
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-tournaments">My Tournaments</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="hidden md:flex space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Register</Link>
              </Button>
            </div>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col space-y-4 py-4">
                <Link href="/tournaments" className="text-base font-medium">
                  Tournaments
                </Link>
                
                {isAuthenticated && (
                  <>
                    <Link href="/tournaments/new" className="text-base font-medium">
                      Create Tournament
                    </Link>
                    <Link href="/profile" className="text-base font-medium">
                      My Profile
                    </Link>
                    <Link href="/my-tournaments" className="text-base font-medium">
                      My Tournaments
                    </Link>
                    <button 
                      className="text-base font-medium text-left text-destructive"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </>
                )}
                
                {!isAuthenticated && (
                  <>
                    <Link href="/login" className="text-base font-medium">
                      Login
                    </Link>
                    <Link href="/register" className="text-base font-medium">
                      Register
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}