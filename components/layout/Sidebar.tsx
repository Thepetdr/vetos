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
  Syringe,
  BarChart2,
  MessageSquare,
  Home,
  Scissors,
  HeartPulse,
  ShoppingBag,
  GitBranch,
  Heart,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  href: string
  icon: any
  label: string
  badge?: string
  soon?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/analytics',  icon: BarChart2,        label: 'Analytics' },
    ],
  },
  {
    label: 'Clinical',
    items: [
      { href: '/appointments', icon: CalendarDays, label: 'Appointments' },
      { href: '/patients',     icon: PawPrint,     label: 'Patients' },
      { href: '/clients',      icon: Users,         label: 'Clients' },
      { href: '/records',      icon: FileText,      label: 'Medical Records' },
      { href: '/vaccinations', icon: Syringe,       label: 'Vaccinations' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/billing',   icon: Receipt, label: 'Billing' },
      { href: '/inventory', icon: Package, label: 'Inventory' },
      { href: '/staff',     icon: UserCog, label: 'Staff' },
    ],
  },
  {
    label: 'Services',
    items: [
      { href: '/boarding',  icon: Home,     label: 'Boarding',  soon: true },
      { href: '/grooming',  icon: Scissors, label: 'Grooming',  soon: true },
      { href: '/pharmacy',  icon: ShoppingBag, label: 'Pharmacy', soon: true },
    ],
  },
  {
    label: 'Growth',
    items: [
      { href: '/communications', icon: MessageSquare, label: 'WhatsApp',     soon: true },
      { href: '/branches',       icon: GitBranch,     label: 'Multi-Branch', soon: true },
      { href: '/shelter',        icon: Heart,         label: 'Shelter',      soon: true },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'flex flex-col transition-all duration-300 relative shrink-0 h-screen sticky top-0',
        'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Top glow */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-rose-500/10 to-transparent pointer-events-none" />

      {/* Logo */}
      <div
        className={cn(
          'flex items-center gap-3 border-b border-white/5 relative z-10 shrink-0',
          collapsed ? 'px-3 py-5 justify-center' : 'px-5 py-5'
        )}
      >
        <div className="w-8 h-8 bg-gradient-to-br from-rose-400 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-900/40 shrink-0">
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
      <nav className="flex-1 px-2 py-3 overflow-y-auto relative z-10 space-y-4 scrollbar-none">
        {navGroups.map((group) => (
          <div key={group.label}>
            {/* Group label */}
            {!collapsed && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {group.label}
              </p>
            )}
            {collapsed && (
              <div className="my-1 mx-auto w-6 border-t border-white/5" />
            )}

            <div className="space-y-0.5">
              {group.items.map(({ href, icon: Icon, label, soon }) => {
                const active = pathname === href || pathname.startsWith(href + '/')

                return (
                  <Link
                    key={href}
                    href={soon ? '#' : href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150 group relative',
                      collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5',
                      active
                        ? 'bg-gradient-to-r from-rose-500/20 to-rose-500/5 text-rose-300 border border-rose-500/20'
                        : soon
                          ? 'text-slate-600 cursor-default'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    )}
                    onClick={soon ? (e) => e.preventDefault() : undefined}
                  >
                    <Icon className={cn('shrink-0', collapsed ? 'h-5 w-5' : 'h-4 w-4')} />

                    {!collapsed && (
                      <span className="flex-1 truncate">{label}</span>
                    )}

                    {!collapsed && soon && (
                      <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-slate-700 text-slate-500">
                        Soon
                      </span>
                    )}

                    {/* Tooltip when collapsed */}
                    {collapsed && (
                      <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 border border-white/10 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-xl">
                        {label}
                        {soon && <span className="ml-1.5 text-slate-500">(Soon)</span>}
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center p-3 border-t border-white/5 text-slate-500 hover:text-slate-300 transition-colors relative z-10 shrink-0"
      >
        <ChevronLeft
          className={cn('h-4 w-4 transition-transform duration-300', collapsed && 'rotate-180')}
        />
        {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
      </button>
    </aside>
  )
}