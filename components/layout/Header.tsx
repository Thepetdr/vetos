'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Bell, LogOut, User, Search } from 'lucide-react'
import { toast } from 'sonner'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/appointments': 'Appointments',
  '/patients': 'Patients',
  '/clients': 'Clients',
  '/records': 'Medical Records',
  '/billing': 'Billing',
  '/inventory': 'Inventory',
  '/staff': 'Staff',
  '/settings': 'Settings',
}

export default function Header({ user }: { user: SupabaseUser }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const title = Object.entries(pageTitles).find(([key]) =>
    pathname === key || pathname.startsWith(key + '/')
  )?.[1] ?? 'VetCare OS'

  const initials = user.email?.slice(0, 2).toUpperCase() ?? 'VC'

  async function handleSignOut() {
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-14 glass-dark border-b border-white/40 flex items-center justify-between px-4 sm:px-6 shrink-0">
      <h1 className="text-base font-semibold text-slate-700">{title}</h1>

      <div className="flex items-center gap-2">
        {/* Search — hidden on mobile */}
        <Button
          variant="ghost"
          size="sm"
          className="hidden sm:flex items-center gap-2 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-xl px-3 text-xs"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search...</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative rounded-xl">
          <Bell className="h-4 w-4 text-slate-500" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 rounded-xl">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-gradient-to-br from-rose-400 to-rose-600 text-white text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-slate-600 hidden sm:block max-w-[140px] truncate">
                {user.email}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuLabel className="text-xs text-slate-500">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-lg">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-rose-600 rounded-lg">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}