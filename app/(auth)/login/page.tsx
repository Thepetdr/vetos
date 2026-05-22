'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Stethoscope, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('Welcome back!')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Logo */}
      <div className="text-center space-y-3">
        <div className="inline-flex w-14 h-14 bg-gradient-to-br from-rose-400 to-rose-600 rounded-2xl items-center justify-center shadow-lg shadow-rose-200">
          <Stethoscope className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">VetCare OS</h1>
          <p className="text-slate-400 text-sm">The Pet Doctor — Dubai</p>
        </div>
      </div>

      {/* Card */}
      <div className="card-premium p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800">Sign in</h2>
          <p className="text-slate-400 text-sm mt-1">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-slate-600">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="vet@clinic.ae"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-xl border-slate-200 bg-white/80 focus:border-rose-300 focus:ring-rose-200"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium text-slate-600">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="rounded-xl border-slate-200 bg-white/80 focus:border-rose-300 focus:ring-rose-200 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword
                  ? <EyeOff className="h-4 w-4" />
                  : <Eye className="h-4 w-4" />
                }
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl h-10 font-medium shadow-md shadow-rose-200 border-0 mt-2"
            disabled={loading}
          >
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : 'Sign In'
            }
          </Button>
        </form>
      </div>

      <p className="text-center text-xs text-slate-400">
        VetCare OS · Built for GCC Veterinary Clinics
      </p>
    </div>
  )
}