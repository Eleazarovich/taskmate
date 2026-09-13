'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Copy, CheckCheck, LogIn, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { chessService } from '@/lib/services';
import { useAppContext } from '@/lib/store';
import AppLogo from '@/components/ui/AppLogo';

type AuthMode = 'login' | 'signup';

interface LoginForm {
  email: string;
  password: string;
}

interface SignupForm {
  name: string;
  email: string;
  password: string;
}

const DEMO_CREDENTIALS = {
  email: 'kasparov@chesskanban.app',
  password: 'KingMe2026!',
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded text-muted-foreground hover:text-primary transition-colors"
      aria-label="Copy to clipboard"
      type="button"
    >
      {copied ? <CheckCheck size={13} className="text-success" /> : <Copy size={13} />}
    </button>
  );
}

export default function AuthScreen() {
  const router = useRouter();
  const { setUser } = useAppContext();
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginForm = useForm<LoginForm>({ mode: 'onBlur' });
  const signupForm = useForm<SignupForm>({ mode: 'onBlur' });

  const fillDemo = () => {
    loginForm.setValue('email', DEMO_CREDENTIALS.email);
    loginForm.setValue('password', DEMO_CREDENTIALS.password);
    loginForm.clearErrors();
  };

  const handleLogin = async (data: LoginForm) => {
    setIsSubmitting(true);
    try {
      // Backend integration point: replace with real API call
      const result = await chessService.login(data.email, data.password);
      if (result.success && result.user) {
        setUser(result.user);
        toast.success(`Welcome back, ${result.user.name}!`);
        router.push('/main-kanban-board');
      } else {
        loginForm.setError('root', { message: result.error || 'Login failed.' });
      }
    } catch {
      loginForm.setError('root', { message: 'Connection error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (data: SignupForm) => {
    setIsSubmitting(true);
    try {
      // Backend integration point: replace with real API call
      const result = await chessService.signUp(data.name, data.email, data.password);
      if (result.success && result.user) {
        setUser(result.user);
        toast.success(`Account created! Welcome, ${result.user.name}!`);
        router.push('/main-kanban-board');
      } else {
        signupForm.setError('root', { message: result.error || 'Sign up failed.' });
      }
    } catch {
      signupForm.setError('root', { message: 'Connection error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex chess-grid-bg">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-10 border-r border-border relative overflow-hidden">
        {/* Background chess piece decorations */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <span className="absolute top-[-20px] right-[-40px] text-[280px] opacity-[0.04] text-primary leading-none">♚</span>
          <span className="absolute bottom-[-30px] left-[-30px] text-[220px] opacity-[0.03] text-foreground leading-none">♟</span>
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[320px] opacity-[0.02] text-primary leading-none">♛</span>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <AppLogo size={36} />
            <span className="text-xl font-semibold tracking-tight text-foreground">Taskmate</span>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight">
              Move tasks like<br />
              <span className="text-primary">chess pieces.</span>
            </h1>
            <p className="text-secondary-foreground text-lg leading-relaxed">
              A personal Kanban board where every task progresses from Pawn to King — earning rating points along the way.
            </p>
          </div>
        </div>

        {/* Stage progression display */}
        <div className="relative z-10">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4 font-medium">Six stages of progress</p>
          <div className="flex items-center gap-2">
            {[
              { glyph: '♟', label: 'Pawn', color: 'text-pawn' },
              { glyph: '→', label: '', color: 'text-muted-foreground' },
              { glyph: '♞', label: 'Knight', color: 'text-knight' },
              { glyph: '→', label: '', color: 'text-muted-foreground' },
              { glyph: '♝', label: 'Bishop', color: 'text-bishop' },
              { glyph: '→', label: '', color: 'text-muted-foreground' },
              { glyph: '♜', label: 'Rook', color: 'text-rook' },
              { glyph: '→', label: '', color: 'text-muted-foreground' },
              { glyph: '♛', label: 'Queen', color: 'text-queen' },
              { glyph: '→', label: '', color: 'text-muted-foreground' },
              { glyph: '♚', label: 'King', color: 'text-king' },
            ].map((item, i) => (
              <span key={`stage-flow-${i}`} className={`text-xl ${item.color}`} title={item.label}>
                {item.glyph}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">Each forward move earns +1 rating point</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <AppLogo size={28} />
            <span className="text-lg font-semibold text-foreground">Taskmate</span>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-muted rounded-xl p-1 mb-8 gap-1">
            <button
              onClick={() => { setMode('login'); loginForm.clearErrors(); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === 'login' ?'bg-card text-foreground shadow-sm' :'text-muted-foreground hover:text-secondary-foreground'
              }`}
              type="button"
            >
              <LogIn size={15} />
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); signupForm.clearErrors(); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === 'signup' ?'bg-card text-foreground shadow-sm' :'text-muted-foreground hover:text-secondary-foreground'
              }`}
              type="button"
            >
              <UserPlus size={15} />
              Create Account
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5" noValidate>
              <div>
                <h2 className="text-2xl font-bold mb-1">Welcome back</h2>
                <p className="text-sm text-muted-foreground">Sign in to continue your game</p>
              </div>

              {loginForm.formState.errors.root && (
                <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm animate-slide-up">
                  {loginForm.formState.errors.root.message}
                </div>
              )}

              <div>
                <label htmlFor="login-email" className="block text-sm font-medium mb-1.5">
                  Email address
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={`w-full bg-input border rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
                    loginForm.formState.errors.email ? 'border-danger' : 'border-border focus:border-primary'
                  }`}
                  {...loginForm.register('email', {
                    required: 'Email is required',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email address' },
                  })}
                />
                {loginForm.formState.errors.email && (
                  <p className="mt-1 text-xs text-danger">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-medium mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Your password"
                    className={`w-full bg-input border rounded-lg px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
                      loginForm.formState.errors.password ? 'border-danger' : 'border-border focus:border-primary'
                    }`}
                    {...loginForm.register('password', { required: 'Password is required' })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="mt-1 text-xs text-danger">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="w-4 h-4 rounded border-border bg-input accent-primary"
                />
                <label htmlFor="remember-me" className="text-sm text-secondary-foreground">
                  Remember me
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    <span>Sign In</span>
                  </>
                )}
              </button>

              {/* Demo credentials */}
              <div className="card-elevated p-4 rounded-xl space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Demo Account</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-secondary-foreground">Email</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-mono text-foreground">{DEMO_CREDENTIALS.email}</span>
                      <CopyButton value={DEMO_CREDENTIALS.email} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-secondary-foreground">Password</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-mono text-foreground">{DEMO_CREDENTIALS.password}</span>
                      <CopyButton value={DEMO_CREDENTIALS.password} />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={fillDemo}
                  className="w-full text-xs py-1.5 px-3 border border-primary/30 text-primary rounded-md hover:bg-primary/10 transition-all duration-150 font-medium"
                >
                  Autofill demo credentials
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-5" noValidate>
              <div>
                <h2 className="text-2xl font-bold mb-1">Create your account</h2>
                <p className="text-sm text-muted-foreground">Begin your Pawn-to-King journey</p>
              </div>

              {signupForm.formState.errors.root && (
                <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm animate-slide-up">
                  {signupForm.formState.errors.root.message}
                </div>
              )}

              <div>
                <label htmlFor="signup-name" className="block text-sm font-medium mb-1.5">
                  Your name
                </label>
                <p className="text-xs text-muted-foreground mb-1.5">Displayed on your player profile</p>
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Magnus Carlsen"
                  className={`w-full bg-input border rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
                    signupForm.formState.errors.name ? 'border-danger' : 'border-border focus:border-primary'
                  }`}
                  {...signupForm.register('name', {
                    required: 'Name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  })}
                />
                {signupForm.formState.errors.name && (
                  <p className="mt-1 text-xs text-danger">{signupForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium mb-1.5">
                  Email address
                </label>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={`w-full bg-input border rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
                    signupForm.formState.errors.email ? 'border-danger' : 'border-border focus:border-primary'
                  }`}
                  {...signupForm.register('email', {
                    required: 'Email is required',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email address' },
                  })}
                />
                {signupForm.formState.errors.email && (
                  <p className="mt-1 text-xs text-danger">{signupForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium mb-1.5">
                  Password
                </label>
                <p className="text-xs text-muted-foreground mb-1.5">Minimum 8 characters — never stored as plaintext</p>
                <div className="relative">
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    className={`w-full bg-input border rounded-lg px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
                      signupForm.formState.errors.password ? 'border-danger' : 'border-border focus:border-primary'
                    }`}
                    {...signupForm.register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Password must be at least 8 characters' },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {signupForm.formState.errors.password && (
                  <p className="mt-1 text-xs text-danger">{signupForm.formState.errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>Create Account</span>
                  </>
                )}
              </button>

              <p className="text-xs text-muted-foreground text-center">
                By creating an account you agree to our{' '}
                <span className="text-primary cursor-pointer hover:underline">Terms of Service</span>
                {' '}and{' '}
                <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}