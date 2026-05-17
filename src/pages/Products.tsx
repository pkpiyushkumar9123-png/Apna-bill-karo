import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Tag, 
  DollarSign, 
  Layers, 
  Trash2,
  Edit3,
  MoreVertical,
  Star,
  ChevronDown,
  AlertCircle,
  Warehouse,
  History,
  Box,
  X
} from 'lucide-react';
import { useStore } from '../store/useStore.ts';
import { Product } from '../types.ts';
import { motion, AnimatePresence } from 'motion/react';

export const Products: React.FC = () => {
  const { products, deleteProduct, addProduct, updateProduct, invoices } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Calculate Detailed Inventory Lifecycle
  const productStocks = useMemo(() => {
    return products.map(p => {
      let pendingQty = 0;
      let paidQty = 0;

      invoices.forEach(inv => {
        const item = inv.items.find(i => i.productId === p.id);
        if (item) {
          if (inv.status === 'paid') {
            paidQty += item.quantity;
          } else if (inv.status !== 'draft') {
            pendingQty += item.quantity;
          }
        }
      });
      
      const available = Math.max(0, p.stockLevel - pendingQty);
      const lifetimeTotal = p.stockLevel + paidQty;
      
      return {
        ...p,
        pendingQty,
        paidQty,
        available,
        lifetimeTotal: lifetimeTotal || 1 // Avoid division by zero
      };
    });
  }, [products, invoices]);

  const filteredProducts = useMemo(() => {
    return productStocks.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [productStocks, searchTerm]);

  const stats = useMemo(() => {
    const totalInventoryValue = products.reduce((acc, p) => acc + (p.stockLevel * p.price), 0);
    const lowStockCount = products.filter(p => p.stockLevel <= p.minStockLevel).length;
    const totalItems = products.reduce((acc, p) => acc + p.stockLevel, 0);
    
    return {
      value: totalInventoryValue,
      lowStock: lowStockCount,
      totalItems,
      SKUs: products.length
    };
  }, [products]);

  const handleCreateOrUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const productData: any = {
      name: formData.get('name') as string,
      sku: formData.get('sku') as string,
      price: parseFloat(formData.get('price') as string),
      costPrice: parseFloat(formData.get('costPrice') as string),
      taxRate: parseFloat(formData.get('taxRate') as string),
      unit: formData.get('unit') as string,
      category: formData.get('category') as string,
      stockLevel: parseInt(formData.get('stockLevel') as string),
      minStockLevel: parseInt(formData.get('minStockLevel') as string),
      description: formData.get('description') as string,
    };

    if (selectedProduct) {
      await updateProduct({ ...selectedProduct, ...productData });
    } else {
      await addProduct({
        id: `PROD-${Date.now()}`,
        ...productData,
        createdAt: Date.now()
      });
    }

    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2 italic">Inventory & Stock</h1>
          <p className="text-muted text-sm font-bold uppercase tracking-widest">Real-time product lifecycle management</p>
        </div>
        <div className="flex gap-4">
           <button className="btn-glass p-4 rounded-3xl flex items-center gap-2 text-xs font-bold uppercase border border-white/5">
            <History size={18} />
            Stock History
          </button>
          <button 
            onClick={() => { setSelectedProduct(null); setIsModalOpen(true); }}
            className="btn-primary flex items-center gap-2 p-4 px-6 rounded-3xl text-sm font-bold shadow-lg shadow-primary/20"
          >
            <Plus size={18} />
            New Product
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <InventoryStat label="Total Asset Value" value={`$${stats.value.toLocaleString()}`} icon={<DollarSign size={20} />} />
        <InventoryStat label="Low Stock Items" value={stats.lowStock} icon={<AlertCircle size={20} />} isAlert={stats.lowStock > 0} />
        <InventoryStat label="Total Units" value={stats.totalItems} icon={<Box size={20} />} />
        <InventoryStat label="Active SKUs" value={stats.SKUs} icon={<Tag size={20} />} />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full text-white">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
           <input 
            type="text" 
            placeholder="Search by SKU, Name or Category..." 
            className="w-full py-5 pl-12 pr-4 bg-white/5 border border-white/10 rounded-[2rem] text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-8 py-5 glass rounded-[2rem] text-xs font-black uppercase tracking-widest text-muted hover:text-white border border-white/5">
           <ChevronDown size={18} />
           Refine View
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.length > 0 ? filteredProducts.map((product) => (
          <div key={product.id} className="glass-card hover:border-primary/30 group !p-0 overflow-hidden relative border-white/5">
             <div className="absolute top-4 right-4 z-10 flex gap-1">
                <button 
                  onClick={() => { setSelectedProduct(product); setIsModalOpen(true); }}
                  className="p-2 bg-background/80 backdrop-blur-md rounded-xl text-muted hover:text-white border border-white/10 shadow-lg"
                >
                  <Edit3 size={14} />
                </button>
                <button 
                  onClick={() => deleteProduct(product.id)}
                  className="p-2 bg-red-400/10 backdrop-blur-md rounded-xl text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 shadow-lg"
                >
                  <Trash2 size={14} />
                </button>
             </div>
             
             <div className="p-8 pb-4 flex flex-col items-center">
                <div className="w-16 h-16 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center text-primary mb-6 shadow-2xl group-hover:scale-110 transition-transform">
                    <Package size={32} />
                </div>
                <div className="text-center space-y-1">
                    <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em]">{product.category}</p>
                    <h3 className="font-bold text-lg tracking-tight line-clamp-1">{product.name}</h3>
                    <p className="text-[10px] font-mono text-muted uppercase font-bold tracking-widest">{product.sku}</p>
                </div>
             </div>

             <div className="px-8 py-6 border-t border-white/5 flex flex-col items-center gap-4 bg-white/[0.01]">
                <div className="text-center">
                    <div className="text-3xl font-black font-mono tracking-tighter">${product.price.toFixed(2)}</div>
                    <div className="text-[10px] text-muted uppercase font-bold mt-1 tracking-widest">per {product.unit}</div>
                </div>
                
                <div className="w-full space-y-3">
                   <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest px-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-muted">Left:</span>
                        <span className="text-red-500">{product.available} {product.unit}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                        <span className="text-muted">Pending:</span>
                        <span className="text-yellow-500">{product.pendingQty}</span>
                      </div>
                   </div>
                   <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden flex">
                      <div 
                         className="h-full bg-red-500 transition-all duration-500"
                         style={{ width: `${(product.available / product.lifetimeTotal) * 100}%` }}
                      />
                      <div 
                         className="h-full bg-yellow-500 transition-all duration-500"
                         style={{ width: `${(product.pendingQty / product.lifetimeTotal) * 100}%` }}
                      />
                      <div 
                         className="h-full bg-white/10 transition-all duration-500"
                         style={{ width: `${(product.paidQty / product.lifetimeTotal) * 100}%` }}
                      />
                   </div>
                   <div className="flex justify-between items-center text-[7px] font-black uppercase tracking-[0.1em] text-muted">
                     <span>Physical: {product.stockLevel}</span>
                     <span>Sold: {product.paidQty}</span>
                   </div>
                </div>
             </div>
          </div>
        )) : (
           <div className="col-span-full py-24 text-center glass rounded-[3rem] border-dashed border-2 border-white/5">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-muted border border-white/5">
              <Warehouse size={40} />
            </div>
            <h3 className="text-2xl font-black mb-2 italic">Warehouse feels empty</h3>
            <p className="text-muted text-sm font-medium">Add products to your catalog to start generating sales.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="glass border border-white/10 w-full max-w-2xl rounded-[3rem] overflow-hidden p-10 relative shadow-[0_0_100px_rgba(255,68,68,0.15)]"
            >
              <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 p-2 hover:bg-white/5 rounded-full text-muted"><X size={24} /></button>
              <h2 className="text-3xl font-black mb-1 tracking-tight italic">{selectedProduct ? 'Update SKU' : 'New Product SKU'}</h2>
              <p className="text-muted text-xs font-bold uppercase tracking-widest mb-10">Configure product specifications</p>

              <form onSubmit={handleCreateOrUpdate} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted px-2">Item Name</label>
                    <input name="name" required defaultValue={selectedProduct?.name} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/50 text-sm font-bold" placeholder="Product Title" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted px-2">SKU Code</label>
                    <input name="sku" required defaultValue={selectedProduct?.sku} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/50 text-sm font-mono" placeholder="PROD-XXX" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted px-2">Selling Price</label>
                    <input name="price" type="number" step="0.01" required defaultValue={selectedProduct?.price} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/50 text-sm font-black font-mono text-primary" placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted px-2">Cost Price</label>
                    <input name="costPrice" type="number" step="0.01" defaultValue={selectedProduct?.costPrice} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/50 text-sm font-black font-mono" placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted px-2">Tax (%)</label>
                    <input name="taxRate" type="number" required defaultValue={selectedProduct?.taxRate} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/50 text-sm font-bold font-mono" placeholder="18" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted px-2">Current Stock</label>
                    <input name="stockLevel" type="number" required defaultValue={selectedProduct?.stockLevel} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/50 text-sm font-bold" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted px-2">Low Stock Alert Level</label>
                    <input name="minStockLevel" type="number" required defaultValue={selectedProduct?.minStockLevel} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/50 text-sm font-bold" placeholder="5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted px-2">Unit</label>
                    <select name="unit" defaultValue={selectedProduct?.unit || 'pcs'} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/50 text-sm font-bold appearance-none">
                      <option value="pcs">Pieces</option>
                      <option value="kg">Kilograms</option>
                      <option value="ltr">Liters</option>
                      <option value="box">Box</option>
                      <option value="hr">Hours</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted px-2">Category</label>
                    <input name="category" defaultValue={selectedProduct?.category} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/50 text-sm font-bold" placeholder="e.g. Hardware" />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-white/5 hover:bg-white/10 rounded-[2rem] font-bold text-xs uppercase tracking-widest">Discard</button>
                  <button type="submit" className="flex-2 py-5 btn-primary rounded-[2rem] font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/20">
                    {selectedProduct ? 'Confirm Updates' : 'Sync to Warehouse'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const InventoryStat = ({ label, value, icon, isAlert }: any) => (
  <div className={`glass-card group hover:translate-y-[-4px] !p-6 border-white/5 relative overflow-hidden`}>
    {isAlert && <div className="absolute top-0 right-0 w-12 h-12 bg-red-500/20 blur-2xl" />}
    <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 group-hover:border-primary/30 transition-all text-muted group-hover:text-primary">
            {icon}
        </div>
        {isAlert && <span className="bg-red-500/10 text-red-500 text-[8px] font-black uppercase px-2 py-1 rounded-full tracking-widest animate-pulse">Critical</span>}
    </div>
    <div className="text-2xl font-black font-mono tracking-tighter">{value}</div>
    <div className="text-[10px] text-muted uppercase font-bold tracking-[0.2em]">{label}</div>
  </div>
);
