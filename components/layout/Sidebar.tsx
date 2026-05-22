'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  CalendarDays,
  PawPrint,
  Users,
  FileText,
  Receipt,
  Package,
  UserCog,
  Settings,
  ChevronLeft,
  Stethoscope,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/appointments', icon: CalendarDays, label: 'Appointments' },
  { href: '/patients', icon: PawPrint, label: 'Patients' },
  { href: '/clients', icon: Users, label: 'Clients' },
  { href: '/records', icon: FileText, label: 'Medical Records' },
  { href: '/billing', icon: Receipt, label: 'Billing' },
  { href: '/inventory', icon: Package, label: 'Inventory' },
  { href: '/staff', icon: UserCog, label: 'Staff' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={cn(
      'flex flex-col transition-all duration-300 relative shrink-0',
      'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800',
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Subtle pink glow at top */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-rose-500/10 to-transparent pointer-events-none" />

      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 border-b border-white/5 relative z-10',
        collapsed ? 'px-3 py-5 justify-center' : 'px-5 py-5'
      )}>
        <div className="w-8 h-8 bg-gradient-to-br from-rose-400 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
          <Stethoscope className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-sm text-white leading-tight">VetCare OS</p>
            <p className="text-[10px] text-rose-300/70 leading-tight">The Pet Doctor</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto relative z-10">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150',
                collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5',
                active
                  ? 'bg-gradient-to-r from-rose-500/20 to-rose-500/5 text-rose-300 border border-rose-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              )}
            >
              <Icon className={cn('shrink-0', collapsed ? 'h-5 w-5' : 'h-4 w-4')} />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center p-3 border-t border-white/5 text-slate-500 hover:text-slate-300 transition-colors relative z-10"
      >
        <ChevronLeft className={cn('h-4 w-4 transition-transform duration-300', collapsed && 'rotate-180')} />
        {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
      </button>
    </aside>
  )
}