import React, { useState } from 'react';
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
  ChevronDown
} from 'lucide-react';
import { useStore } from '../store/useStore.ts';
import { Product } from '../types.ts';

export const Products: React.FC = () => {
  const { products, deleteProduct, addProduct } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    taxRate: 0,
    unit: 'Project',
    category: 'Consulting'
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name) return;

    const product: Product = {
      id: Math.random().toString(36).substr(2, 9),
      name: newProduct.name as string,
      price: Number(newProduct.price),
      taxRate: Number(newProduct.taxRate),
      unit: newProduct.unit as string,
      category: newProduct.category,
      createdAt: Date.now()
    };

    await addProduct(product);
    setNewProduct({ name: '', price: 0, taxRate: 0, unit: 'Project', category: 'Consulting' });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Service Catalog</h1>
          <p className="text-muted text-sm">Organize your products, services, and pricing models.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2 py-2.5 text-sm"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <InventoryStat label="Total Items" value={products.length} />
        <InventoryStat label="Avg. Price" value={`$${(products.reduce((acc, p) => acc + p.price, 0) / (products.length || 1)).toFixed(2)}`} />
        <InventoryStat label="Categories" value={new Set(products.map(p => p.category)).size} />
        <InventoryStat label="Tax Types" value={new Set(products.map(p => p.taxRate)).size} />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full text-white">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
           <input 
            type="text" 
            placeholder="Search catalog..." 
            className="w-full py-4 pl-12 pr-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-4 glass rounded-2xl text-sm font-bold uppercase tracking-widest text-muted hover:text-white">
           <ChevronDown size={18} />
           Category
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredProducts.length > 0 ? filteredProducts.map((product) => (
          <div key={product.id} className="glass-card hover:border-primary/30 group py-8 px-6 flex flex-col items-center text-center">
             <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button className="p-1.5 hover:bg-white/10 rounded-md text-muted hover:text-white">
                  <Edit3 size={14} />
                </button>
                <button 
                  onClick={() => deleteProduct(product.id)}
                  className="p-1.5 hover:bg-red-500/10 rounded-md text-muted hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
             </div>
             
             <div className="w-16 h-16 rounded-3xl bg-surface border border-white/5 flex items-center justify-center text-primary mb-6 shadow-xl group-hover:scale-110 transition-transform">
                <Package size={32} />
             </div>

             <div className="space-y-1 mb-6">
                <h3 className="font-bold text-lg tracking-tight">{product.name}</h3>
                <p className="text-[10px] text-primary font-black uppercase tracking-widest">{product.category || 'General'}</p>
             </div>

             <div className="w-full py-4 border-y border-white/5 mb-6">
                <div className="text-3xl font-black font-mono tracking-tighter">${product.price.toFixed(2)}</div>
                <div className="text-[10px] text-muted uppercase font-bold mt-1 tracking-widest">per {product.unit}</div>
             </div>

             <div className="flex items-center gap-4 text-xs font-bold text-muted uppercase tracking-tighter">
                <div className="flex items-center gap-1">
                   <Tag size={12} className="text-primary" />
                   {product.taxRate}% Tax
                </div>
                <div className="h-3 w-[1px] bg-white/10" />
                <div className="flex items-center gap-1">
                   <Star size={12} className="text-yellow-500 fill-yellow-500" />
                   Favorited
                </div>
             </div>
          </div>
        )) : (
           <div className="col-span-full py-24 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-muted border border-white/5">
              <Package size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">Inventory is empty</h3>
            <p className="text-muted text-sm italic">Add your first service to get started.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg shadow-[0_0_100px_rgba(255,68,68,0.2)]">
            <h2 className="text-2xl font-bold mb-6 tracking-tight">Create Service</h2>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted">Item Name</label>
                <input 
                  type="text" required 
                  className="input-field w-full"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted">Default Price</label>
                  <input 
                    type="number" step="0.01" required 
                    className="input-field w-full font-mono"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted">Tax Rate (%)</label>
                  <input 
                    type="number" required 
                    className="input-field w-full font-mono"
                    value={newProduct.taxRate}
                    onChange={(e) => setNewProduct({...newProduct, taxRate: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted">Unit Weight</label>
                  <select 
                    className="input-field w-full bg-background"
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                  >
                    <option value="Project">Project</option>
                    <option value="Hour">Hour</option>
                    <option value="Day">Day</option>
                    <option value="Item">Item</option>
                    <option value="Month">Month</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted">Category</label>
                  <input 
                    type="text" 
                    className="input-field w-full"
                    placeholder="e.g. Design"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const InventoryStat = ({ label, value }: any) => (
  <div className="glass-card flex flex-col gap-1 !py-4 px-6 border-l-4 border-l-primary/50">
    <div className="text-2xl font-black font-mono tracking-tighter">{value}</div>
    <div className="text-[10px] text-muted uppercase font-bold tracking-widest">{label}</div>
  </div>
);
