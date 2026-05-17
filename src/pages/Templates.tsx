import React from 'react';
import { LayoutTemplate, Check, Star, Zap } from 'lucide-react';
import { motion } from 'motion/react';

const templates = [
  { id: 'modern', name: 'Elite Modern', desc: 'Minimalist layout with a bold focus on typography and high-end aesthetics.', image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=600' },
  { id: 'luxury', name: 'Onyx Luxury', desc: 'Deep matte backgrounds with elegant serif font pairings for high-ticket services.', image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600' },
  { id: 'corporate', name: 'Swiss Professional', desc: 'Grid-based precision designed for corporate compliance and global standards.', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=600' },
  { id: 'creative', name: 'Neon Creative', desc: 'High-contrast vibrant accents for agencies, designers, and innovative startups.', image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=600' },
  { id: 'minimal', name: 'Nano Minimal', desc: 'Ultra-clean, information-dense layout emphasizing clarity and fast scannability.', image: 'https://images.unsplash.com/photo-1544256718-3bcf237f3974?auto=format&fit=crop&q=80&w=600' },
  { id: 'medical', name: 'Clinical Standard', desc: 'Organized and sterile design optimized for healthcare and medical invoicing.', image: 'https://images.unsplash.com/photo-1576091160550-2173599211d0?auto=format&fit=crop&q=80&w=600' },
];

export const Templates: React.FC = () => {
  return (
    <div className="space-y-8 pb-12 font-medium">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Design Templates</h1>
          <p className="text-muted text-sm">Choose from our gallery of premium, world-class invoice designs.</p>
        </div>
        <div className="flex items-center gap-2 glass px-4 py-2 rounded-xl text-primary font-bold text-xs uppercase tracking-widest">
           <Zap size={14} className="fill-primary" />
           Premium Access Enabled
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {templates.map((template, idx) => (
          <motion.div 
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group cursor-pointer"
          >
            <div className="glass-card !p-0 overflow-hidden mb-4 group-hover:border-primary/50 transition-all shadow-xl group-hover:shadow-primary/5">
               <div className="aspect-[4/5] relative overflow-hidden bg-white/5">
                  <img 
                    src={template.image} 
                    alt={template.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <button className="btn-primary py-3 px-8 shadow-2xl">Use Template</button>
                  </div>
                  {idx === 0 && (
                    <div className="absolute top-4 left-4 bg-primary text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                      Popular
                    </div>
                  )}
               </div>
            </div>
            <div className="flex justify-between items-start">
               <div>
                  <h3 className="text-lg font-bold tracking-tight">{template.name}</h3>
                  <p className="text-xs text-muted leading-relaxed max-w-[240px]">{template.desc}</p>
               </div>
               <div className="flex items-center gap-1 text-yellow-500">
                  <Star size={14} className="fill-yellow-500" />
                  <span className="text-xs font-bold font-mono">4.9</span>
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="glass-card !bg-primary/5 border-primary/20 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
         <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20 shrink-0">
               <LayoutTemplate size={32} />
            </div>
            <div>
               <h3 className="text-xl font-bold">Custom Template Studio</h3>
               <p className="text-sm text-muted">Want something unique? Build your own template exactly how you want it.</p>
            </div>
         </div>
         <button className="btn-primary whitespace-nowrap w-full md:w-auto">Open Studio</button>
      </div>
    </div>
  );
};
