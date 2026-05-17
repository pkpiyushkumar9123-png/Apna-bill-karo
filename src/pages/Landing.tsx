import React from 'react';
import { motion } from 'motion/react';
import { NavLink } from 'react-router-dom';
import { Zap, ArrowRight, Shield, Globe, Cpu, Smartphone } from 'lucide-react';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-20 glass z-50 flex items-center justify-between px-8 md:px-24">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Zap className="text-white fill-white" size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tighter">NovaBill</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#templates" className="hover:text-white transition-colors">Templates</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-4">
          <NavLink to="/dashboard" className="btn-secondary py-2 text-sm">Dashboard</NavLink>
          <NavLink to="/invoices/new" className="btn-primary py-2 text-sm">Get Started</NavLink>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-8 flex flex-col items-center text-center max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-8">
            <Zap size={14} className="fill-primary" />
            The Future of Invoicing is Here
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[1.1] mb-8">
            Manage your business <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/40">
              without limits.
            </span>
          </h1>
          <p className="text-xl text-muted max-w-2xl mx-auto mb-12 font-medium">
            Elite-grade business management, offline-first architecture, and 
            stunning professional invoicing. Designed for the ambitious.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <NavLink to="/invoices/new" className="btn-primary text-lg px-8 py-4 flex items-center gap-2 group">
              Create Free Invoice
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </NavLink>
            <NavLink to="/dashboard" className="btn-secondary text-lg px-8 py-4">
              Explore Demo
            </NavLink>
          </div>
        </motion.div>

        {/* Hero Visual */}
        <motion.div 
          className="mt-24 w-full max-w-5xl relative"
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1 }}
        >
          <div className="glass rounded-[2rem] p-4 shadow-[0_0_100px_rgba(255,68,68,0.15)]">
            <div className="bg-surface rounded-[1.5rem] aspect-video overflow-hidden border border-white/5 relative">
              <img 
                src="https://images.unsplash.com/photo-1551288049-bbbda536339a?auto=format&fit=crop&q=80&w=2000" 
                alt="Dashboard Preview" 
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="btn-secondary p-8 rounded-full border-2 border-primary/20 backdrop-blur-md cursor-pointer hover:scale-110 transition-all">
                  <Zap size={48} className="text-primary fill-primary" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Floating elements */}
          <div className="hidden lg:block absolute -top-10 -left-10 glass-card p-6 w-56 animate-bounce" style={{ animationDuration: '4s' }}>
            <div className="text-xs text-muted mb-2 uppercase tracking-widest font-bold">Total Revenue</div>
            <div className="text-2xl font-mono tracking-tighter">$142,500.00</div>
            <div className="w-full h-1 bg-white/10 rounded-full mt-4 overflow-hidden">
              <div className="w-2/3 h-full bg-primary" />
            </div>
          </div>
          <div className="hidden lg:block absolute -bottom-10 -right-10 glass-card p-6 w-56 animate-bounce" style={{ animationDuration: '6s' }}>
             <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Shield size={16} className="text-primary" />
              </div>
              <div className="text-xs font-bold">Offline Sync</div>
             </div>
             <p className="text-[10px] text-muted">All data encrypted and saved locally with bi-directional sync capability.</p>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-8 max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <h2 className="text-4xl font-bold mb-4 tracking-tighter">Engineered for Success</h2>
          <p className="text-muted text-lg">Every detail crafted for high-performance business.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Cpu className="text-primary" />} 
            title="Edge Intelligence" 
            desc="Blazing fast performance powered by distributed Edge architecture. Zero latency." 
          />
          <FeatureCard 
            icon={<Shield className="text-primary" />} 
            title="Privacy First" 
            desc="Your data stays on your machine. End-to-end encrypted IndexedDB storage." 
          />
          <FeatureCard 
            icon={<Globe className="text-primary" />} 
            title="Global Ready" 
            desc="Multi-currency, multi-language, and local tax compliance out of the box." 
          />
          <FeatureCard 
            icon={<Zap className="text-primary" />} 
            title="Smart Automations" 
            desc="Auto-generate invoices, follow-ups, and analytics reports. Set it and forget it." 
          />
          <FeatureCard 
            icon={<Smartphone className="text-primary" />} 
            title="PWA Experience" 
            desc="Install NovaBill on any device. Works seamlessly offline and feels like a native app." 
          />
          <FeatureCard 
            icon={<BarChart3 className="text-primary" />} 
            title="Advanced Analytics" 
            desc="Visual insight into your business growth with interactive, real-time data charts." 
          />
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="glass-card flex flex-col items-start gap-4 hover:border-primary/30 transition-all cursor-default">
    <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
      {icon}
    </div>
    <h3 className="text-xl font-bold tracking-tight">{title}</h3>
    <p className="text-muted text-sm leading-relaxed">{desc}</p>
  </div>
);

const BarChart3 = ({ className, size }: { className?: string; size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
  </svg>
);
