/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Search, 
  Users, 
  Phone, 
  Mail, 
  Instagram, 
  Facebook, 
  Linkedin, 
  ChevronRight, 
  ChevronDown,
  Menu, 
  X,
  Home,
  Award,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

// --- Types ---
interface Property {
  id: number | string;
  ref: string;
  title: string;
  location: string;
  town: string;
  province: string;
  price: string;
  priceNumeric: number;
  beds: number;
  baths: number;
  sqft: string;
  sqftNumeric: number;
  image: string;
  images: string[];
  tag: string;
  type: string;
  description: string;
  features: string[];
  pool: boolean;
  plans: string[];
  url: string;
}

interface SearchFilters {
  area: string;
  type: string;
  beds: string;
  baths: string;
  priceMin: string;
  priceMax: string;
  ref: string;
  sortBy: string;
}

// --- Mock Data ---
const PROPERTIES: Property[] = [];

const COLLABORATIONS = [
  { name: "Sotheby's International", logo: "https://logo.clearbit.com/sothebysrealty.com" },
  { name: "Engel & Völkers", logo: "https://logo.clearbit.com/engelvoelkers.com" },
  { name: "Knight Frank", logo: "https://logo.clearbit.com/knightfrank.com" },
  { name: "Savills", logo: "https://logo.clearbit.com/savills.com" }
];

// --- Components ---

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'py-4 glass' : 'py-8 bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center">
          <img 
            src={isScrolled ? "/assets/logo-blue.png" : "/assets/logo-white.png"} 
            alt="Lozano Realty Logo" 
            className="h-20 w-auto"
          />
        </div>

        {/* Desktop Menu */}
        <div className={`hidden md:flex items-center gap-10 font-medium text-sm uppercase tracking-widest ${isScrolled ? 'text-ocean-900' : 'text-white'}`}>
          <a href="#hero" className="hover:text-sand-500 transition-colors">Home</a>
          <a href="#properties" className="hover:text-sand-500 transition-colors">Properties</a>
          <a href="#contact" className="px-6 py-2 border border-current hover:bg-white hover:text-ocean-900 transition-all">Contact</a>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-current" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className={isScrolled ? 'text-ocean-900' : 'text-white'} /> : <Menu className={isScrolled ? 'text-ocean-900' : 'text-white'} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 glass border-t border-ocean-100 flex flex-col p-8 gap-6 text-ocean-900 font-medium uppercase tracking-widest md:hidden"
          >
            <a href="#hero" onClick={() => setIsMobileMenuOpen(false)}>Home</a>
            <a href="#properties" onClick={() => setIsMobileMenuOpen(false)}>Properties</a>
            <a href="#contact" onClick={() => setIsMobileMenuOpen(false)}>Contact</a>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = () => {
  return (
    <section id="hero" className="relative h-[85vh] flex items-center justify-center overflow-hidden">
      {/* High-End Villa Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=2000" 
          alt="Luxury Villa Costa del Sol" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-ocean-900/40 backdrop-blur-[1px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full h-full flex flex-col justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="w-full flex flex-col pt-20"
        >
          <h1 className="text-[8vw] md:text-[10vw] font-serif text-white/95 tracking-[0.05em] leading-none mb-12 uppercase select-none font-light">
            LOZANO REALTY
          </h1>
          
          <div className="flex flex-col md:flex-row items-start md:items-end gap-10 mt-4 px-4">
            <div className="max-w-xs">
              <p className="text-white/70 text-sm md:text-base font-medium leading-relaxed tracking-wide">
                Premium properties handpicked for living, investing, and pure coastal bliss.
              </p>
            </div>
            <button className="group flex items-center gap-4 bg-white/20 backdrop-blur-xl border border-white/30 text-white px-10 py-5 rounded-xl hover:bg-white hover:text-ocean-900 transition-all duration-500 shadow-2xl">
              <span className="text-sm font-bold tracking-widest uppercase">Get My Curated Selection</span>
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const Properties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>({
    area: '',
    type: '',
    beds: '',
    baths: '',
    priceMin: '',
    priceMax: '',
    ref: '',
    sortBy: 'newest'
  });
  const [showAll, setShowAll] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  useEffect(() => {
    const fetchHabiHubProperties = async () => {
      try {
        const res = await fetch('/api/feed');
        if (!res.ok) throw new Error('Network response not ok');
        const xmlText = await res.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "application/xml");
        
        const propertyNodes = Array.from(xmlDoc.querySelectorAll('property'));
        if (propertyNodes.length > 0) {
          const parsedProperties: Property[] = propertyNodes.map((node, index) => {
            const getText = (selector: string) => node.querySelector(selector)?.textContent || '';
            const type = getText('type') || 'Property';
            const town = getText('town') || 'Costa del Sol';
            const development = getText('development') || getText('urbanization') || '';
            const priceVal = getText('price');
            const formattedPrice = priceVal && !isNaN(Number(priceVal)) ? `€${Number(priceVal).toLocaleString()}` : 'Price on Request';
            
            const imagesNodes = Array.from(node.querySelectorAll('images image url'));
            const images = imagesNodes.map(img => img.textContent || '').filter(Boolean);
            
            // Variate imagery if available in same development
            let image = images[0] || 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1000';
            if (development && index % 2 === 1 && images[1]) {
              image = images[1];
            }

            const plansNodes = Array.from(node.querySelectorAll('plans plan url'));
            const plans = plansNodes.map(p => p.textContent || '').filter(Boolean);

            const builtArea = node.querySelector('surface_area built')?.textContent || '0';
            const sqft = builtArea !== '0' ? `${builtArea} m²` : 'Contact for area';

            const featuresNodes = Array.from(node.querySelectorAll('features feature'));
            const features = featuresNodes.map(f => f.textContent || '').filter(Boolean);

            const descEn = node.querySelector('desc en')?.textContent || '';
            const descEs = node.querySelector('desc es')?.textContent || '';
            const description = descEn || descEs || '';

            const title = development 
              ? `${type.charAt(0).toUpperCase() + type.slice(1)} in ${development}`
              : `${type.charAt(0).toUpperCase() + type.slice(1)} in ${town}`;

            return {
              id: getText('id') || getText('ref') || Math.random().toString(),
              ref: getText('ref'),
              title: title,
              location: `${town}, ${getText('province')}`,
              town: town,
              province: getText('province'),
              price: formattedPrice,
              priceNumeric: Number(priceVal) || 0,
              beds: parseInt(getText('beds')) || 0,
              baths: parseInt(getText('baths')) || 0,
              sqft: sqft,
              sqftNumeric: Number(builtArea) || 0,
              image: image,
              images: images,
              tag: getText('new_build') === '1' ? "New Build" : "Exclusive",
              type: type,
              features: features,
              pool: getText('pool') === '1',
              plans: plans,
              description: description,
              url: getText('url es') || getText('url en') || ''
            };
          });
          
          setProperties(parsedProperties);
        }
      } catch (error) {
        console.error("Error fetching HabiHub feed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHabiHubProperties();
  }, []);

  const filteredProperties = properties.filter(prop => {
    const matchArea = !filters.area || prop.town === filters.area;
    const matchType = !filters.type || prop.type === filters.type;
    const matchBeds = !filters.beds || prop.beds >= parseInt(filters.beds);
    const matchBaths = !filters.baths || prop.baths >= parseInt(filters.baths);
    const matchPriceMin = !filters.priceMin || prop.priceNumeric >= parseInt(filters.priceMin);
    const matchPriceMax = !filters.priceMax || prop.priceNumeric <= parseInt(filters.priceMax);
    const matchRef = !filters.ref || prop.ref.toLowerCase().includes(filters.ref.toLowerCase()) || prop.id.toString().includes(filters.ref);
    
    return matchArea && matchType && matchBeds && matchBaths && matchPriceMin && matchPriceMax && matchRef;
  }).sort((a, b) => {
    if (filters.sortBy === 'price-asc') return a.priceNumeric - b.priceNumeric;
    if (filters.sortBy === 'price-desc') return b.priceNumeric - a.priceNumeric;
    return 0; // Default newest (assuming feed order)
  });

  const areas = Array.from(new Set(properties.map(p => p.town))).sort();
  const types = Array.from(new Set(properties.map(p => p.type))).sort();

  const displayedProperties = showAll ? filteredProperties : filteredProperties.slice(0, 9);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Reset image index when modal opens
  useEffect(() => {
    if (selectedProperty) setActiveImageIndex(0);
  }, [selectedProperty]);

  return (
    <section id="properties" className="pb-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-20">
          
          <div className="bg-white/40 backdrop-blur-xl p-4 md:p-6 rounded-[2rem] shadow-2xl border border-white/50 -mt-16 relative z-20 mx-auto max-w-6xl">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              <div className="relative group">
                <select 
                  className="w-full py-4 px-6 bg-white rounded-full border-none outline-none text-[11px] uppercase tracking-widest font-bold text-ocean-900 appearance-none cursor-pointer shadow-sm group-hover:shadow-md transition-all"
                  value={filters.area}
                  onChange={(e) => setFilters({...filters, area: e.target.value})}
                >
                  <option value="">Area</option>
                  {areas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-ocean-300 pointer-events-none" />
              </div>

              <div className="relative group">
                <select 
                  className="w-full py-4 px-6 bg-white rounded-full border-none outline-none text-[11px] uppercase tracking-widest font-bold text-ocean-900 appearance-none cursor-pointer shadow-sm group-hover:shadow-md transition-all"
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                >
                  <option value="">Type</option>
                  {types.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-ocean-300 pointer-events-none" />
              </div>

              <div className="relative group">
                <select 
                  className="w-full py-4 px-6 bg-white rounded-full border-none outline-none text-[11px] uppercase tracking-widest font-bold text-ocean-900 appearance-none cursor-pointer shadow-sm group-hover:shadow-md transition-all"
                  value={filters.beds}
                  onChange={(e) => setFilters({...filters, beds: e.target.value})}
                >
                  <option value="">Beds</option>
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}+</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-ocean-300 pointer-events-none" />
              </div>

              <div className="relative group">
                <select 
                  className="w-full py-4 px-6 bg-white rounded-full border-none outline-none text-[11px] uppercase tracking-widest font-bold text-ocean-900 appearance-none cursor-pointer shadow-sm group-hover:shadow-md transition-all"
                  value={filters.baths}
                  onChange={(e) => setFilters({...filters, baths: e.target.value})}
                >
                  <option value="">Baths</option>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}+</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-ocean-300 pointer-events-none" />
              </div>

              <div className="relative group">
                <select 
                  className="w-full py-4 px-6 bg-white rounded-full border-none outline-none text-[11px] uppercase tracking-widest font-bold text-ocean-900 appearance-none cursor-pointer shadow-sm group-hover:shadow-md transition-all"
                  value={filters.priceMin}
                  onChange={(e) => setFilters({...filters, priceMin: e.target.value})}
                >
                  <option value="">Min €</option>
                  {[100000, 250000, 500000, 1000000, 2000000, 5000000].map(p => (
                    <option key={p} value={p}>€{(p/1000).toFixed(0)}k</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-ocean-300 pointer-events-none" />
              </div>

              <div className="relative group">
                <select 
                  className="w-full py-4 px-6 bg-white rounded-full border-none outline-none text-[11px] uppercase tracking-widest font-bold text-ocean-900 appearance-none cursor-pointer shadow-sm group-hover:shadow-md transition-all"
                  value={filters.priceMax}
                  onChange={(e) => setFilters({...filters, priceMax: e.target.value})}
                >
                  <option value="">Max €</option>
                  {[500000, 1000000, 2000000, 5000000, 10000000, 20000000].map(p => (
                    <option key={p} value={p}>€{(p/1000000).toFixed(1)}M</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-ocean-300 pointer-events-none" />
              </div>

              <div className="relative group lg:col-span-1">
                <input 
                  type="text" 
                  placeholder="REF"
                  className="w-full py-4 px-6 bg-white rounded-full border-none outline-none text-[11px] uppercase tracking-widest font-bold text-ocean-900 shadow-sm focus:shadow-md transition-all placeholder:text-ocean-200"
                  value={filters.ref}
                  onChange={(e) => setFilters({...filters, ref: e.target.value})}
                />
              </div>

              <div className="relative group lg:col-span-1">
                 <button 
                  className="w-full h-full py-4 bg-ocean-900 text-white rounded-full flex items-center justify-center hover:bg-sand-500 transition-all shadow-lg"
                  onClick={() => setFilters({area:'', type:'', beds:'', baths:'', priceMin:'', priceMax:'', ref:'', sortBy:'newest'})}
                  title="Reset Filters"
                >
                  <Search size={18} />
                </button>
              </div>
            </div>
            
            <div className="mt-4 flex justify-between items-center px-6">
              <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-ocean-400">
                {filteredProperties.length} Properties Matching
              </div>
              <div className="flex gap-4 items-center">
                <span className="text-[10px] uppercase tracking-widest text-ocean-300">Sort:</span>
                <select 
                  className="bg-transparent border-none outline-none text-[10px] uppercase tracking-widest font-bold text-ocean-900 cursor-pointer"
                  value={filters.sortBy}
                  onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                >
                  <option value="newest">Recent</option>
                  <option value="price-asc">Price ↑</option>
                  <option value="price-desc">Price ↓</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {displayedProperties.map((prop, idx) => (
            <motion.div 
              key={prop.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (idx % 3) * 0.1 }}
              className="group cursor-pointer"
              onClick={() => setSelectedProperty(prop)}
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <img 
                  src={prop.image} 
                  alt={prop.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4 glass px-4 py-1 text-[10px] uppercase tracking-widest font-bold text-ocean-900">
                  {prop.tag}
                </div>
                <div className="absolute inset-0 bg-ocean-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="glass px-6 py-3 text-xs uppercase tracking-[0.2em] font-medium">View Details</span>
                </div>
              </div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-serif text-ocean-900 line-clamp-1">{prop.title}</h3>
                <span className="text-sand-500 font-medium whitespace-nowrap ml-4">{prop.price}</span>
              </div>
              <div className="flex items-center gap-2 text-ocean-500 text-sm mb-4">
                <MapPin size={14} />
                <span className="truncate">{prop.location}</span>
              </div>
              <div className="flex gap-6 text-xs text-ocean-400 uppercase tracking-widest font-medium border-t border-ocean-100 pt-4">
                <span>{prop.beds} Beds</span>
                <span>{prop.baths} Baths</span>
                <span>{prop.sqft}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {!showAll && filteredProperties.length > 9 && (
          <div className="mt-20 text-center">
            <button 
              onClick={() => setShowAll(true)}
              className="px-12 py-5 border border-ocean-900 text-ocean-900 font-medium tracking-widest uppercase hover:bg-ocean-900 hover:text-white transition-all flex items-center gap-3 mx-auto"
            >
              {loading ? 'Updating Feed...' : `Load More (${filteredProperties.length - 9} remaining)`} <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Property Detail Modal */}
        <AnimatePresence>
          {selectedProperty && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedProperty(null)}
                className="absolute inset-0 bg-ocean-900/90 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-7xl max-h-full bg-white overflow-hidden flex flex-col md:flex-row shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => setSelectedProperty(null)}
                  className="absolute top-6 right-6 z-20 w-12 h-12 glass flex items-center justify-center text-ocean-900 hover:bg-white transition-colors"
                >
                  <X size={24} />
                </button>

                {/* Left Side: Image Carousel */}
                <div className="w-full md:w-3/5 h-80 md:h-auto relative bg-ocean-900">
                  <AnimatePresence mode="wait">
                    <motion.img 
                      key={activeImageIndex}
                      src={selectedProperty.images[activeImageIndex] || selectedProperty.image} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </AnimatePresence>
                  
                  {selectedProperty.images.length > 1 && (
                    <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
                      <button 
                        onClick={() => setActiveImageIndex(prev => (prev > 0 ? prev - 1 : selectedProperty.images.length - 1))}
                        className="w-12 h-12 glass flex items-center justify-center text-ocean-900 hover:bg-white transition-all pointer-events-auto shadow-lg"
                      >
                        <ChevronRight size={24} className="rotate-180" />
                      </button>
                      <button 
                        onClick={() => setActiveImageIndex(prev => (prev < selectedProperty.images.length - 1 ? prev + 1 : 0))}
                        className="w-12 h-12 glass flex items-center justify-center text-ocean-900 hover:bg-white transition-all pointer-events-auto shadow-lg"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </div>
                  )}

                  <div className="absolute bottom-6 left-6 right-6 flex justify-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {selectedProperty.images.map((img, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-16 h-12 flex-shrink-0 border-2 transition-all ${activeImageIndex === idx ? 'border-sand-500 scale-105' : 'border-transparent opacity-60'}`}
                      >
                        <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>

                  <div className="absolute top-6 left-6 flex gap-2">
                    <span className="glass px-4 py-2 text-xs uppercase tracking-widest font-bold text-ocean-900">
                      {selectedProperty.tag}
                    </span>
                    {selectedProperty.ref && (
                      <span className="glass px-4 py-2 text-xs uppercase tracking-widest font-bold text-ocean-900">
                        REF: {selectedProperty.ref}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Side: Content */}
                <div className="w-full md:w-2/5 p-8 md:p-12 overflow-y-auto bg-sand-50">
                  <div className="mb-8">
                    <div className="flex items-center gap-2 text-sand-500 text-xs uppercase tracking-widest mb-3">
                      <MapPin size={14} />
                      <span>{selectedProperty.location}</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-serif text-ocean-900 mb-3">{selectedProperty.title}</h2>
                    <div className="text-2xl font-light text-ocean-700">{selectedProperty.price}</div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 py-6 border-y border-ocean-100 mb-8">
                    <div className="text-center">
                      <div className="text-[10px] text-ocean-400 uppercase tracking-widest mb-1">Beds</div>
                      <div className="text-lg text-ocean-900 font-medium">{selectedProperty.beds}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-ocean-400 uppercase tracking-widest mb-1">Baths</div>
                      <div className="text-lg text-ocean-900 font-medium">{selectedProperty.baths}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-ocean-400 uppercase tracking-widest mb-1">Area</div>
                      <div className="text-lg text-ocean-900 font-medium">{selectedProperty.sqft}</div>
                    </div>
                  </div>

                  {selectedProperty.description && (
                    <div className="mb-8">
                      <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-ocean-900 mb-3">About this property</h4>
                      <p className="text-ocean-600 font-light leading-relaxed text-sm h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {selectedProperty.description}
                      </p>
                    </div>
                  )}

                  {selectedProperty.features && selectedProperty.features.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-ocean-900 mb-3">Key Features</h4>
                      <div className="grid grid-cols-2 gap-y-2">
                        {selectedProperty.features.slice(0, 10).map(f => (
                          <div key={f} className="flex items-center gap-2 text-xs text-ocean-500">
                            <div className="w-1 h-1 bg-sand-400 rotate-45" />
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Floor Plans & Brochures */}
                  {selectedProperty.plans && selectedProperty.plans.length > 0 && (
                    <div className="mb-10">
                      <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-ocean-900 mb-4">Documents</h4>
                      <div className="space-y-2">
                        {selectedProperty.plans.map((plan, idx) => (
                          <a 
                            key={idx}
                            href={plan} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-4 bg-white border border-ocean-50 hover:border-sand-500 transition-colors group"
                          >
                            <span className="text-xs uppercase tracking-widest font-medium text-ocean-600 group-hover:text-ocean-900">
                              {plan.toLowerCase().includes('pdf') ? 'Digital Brochure / Floor Plan' : `Document ${idx + 1}`}
                            </span>
                            <ChevronRight size={16} className="text-sand-500" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button className="flex-1 py-5 bg-ocean-900 text-white text-xs font-medium tracking-widest uppercase hover:bg-ocean-800 transition-all flex items-center justify-center gap-3">
                      Inquire Now <Mail size={16} />
                    </button>
                    {selectedProperty.url && (
                      <a 
                        href={selectedProperty.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-5 border border-ocean-200 text-ocean-900 hover:bg-sand-500 hover:text-white transition-all"
                      >
                        <ChevronRight size={18} />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};


const About = () => {
  return (
    <section id="about" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-ocean-50/30 rounded-[2.5rem] overflow-hidden border border-ocean-50/50">
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 h-[400px]">
              <img 
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000" 
                alt="Luxury Estate" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="w-full md:w-1/2 p-10 md:p-16">
              <span className="text-[10px] uppercase tracking-[0.4em] text-ocean-300 font-bold mb-4 block">Our Philosophy</span>
              <h2 className="text-3xl font-serif text-ocean-900 mb-6 italic">Personal, not procedural.</h2>
              <p className="text-ocean-600 font-light leading-relaxed mb-6 text-sm">
                As Costa del Sol exclusive property advisors, we take a bespoke approach to every client, combining deep local expertise with a genuine commitment to your lifestyle and aspirations.
              </p>
              <p className="text-ocean-900 font-medium text-sm leading-relaxed italic">
                "We're here to find more than a property — we're here to find your home and your best investment."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


const Contact = () => {
  return (
    <section id="contact" className="py-24 bg-white border-t border-ocean-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-ocean-50/30 rounded-[2.5rem] p-8 md:p-16 border border-ocean-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-serif text-ocean-900 mb-8 leading-tight">
                Acquisition <br />
                <span className="italic font-light opacity-70">Inquiry</span>
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4 text-ocean-900/60">
                  <Phone size={18} />
                  <span className="text-sm tracking-widest font-medium uppercase">+34 672 119 634</span>
                </div>
                <div className="flex items-center gap-4 text-ocean-900/60">
                  <Mail size={18} />
                  <span className="text-sm tracking-widest font-medium uppercase text-lowercase">contact@lozanorealty.uk</span>
                </div>
                <div className="flex items-center gap-4 text-ocean-900/60">
                  <MapPin size={18} />
                  <span className="text-sm tracking-widest font-medium uppercase">Marbella, Malaga</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <form className="space-y-10 group">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="NAME"
                      className="w-full bg-transparent border-b border-ocean-200 py-3 text-xs tracking-[0.2em] font-bold text-ocean-900 outline-none focus:border-ocean-900 transition-all placeholder:text-ocean-200" 
                    />
                  </div>
                  <div className="relative">
                    <input 
                      type="email" 
                      placeholder="EMAIL"
                      className="w-full bg-transparent border-b border-ocean-200 py-3 text-xs tracking-[0.2em] font-bold text-ocean-900 outline-none focus:border-ocean-900 transition-all placeholder:text-ocean-200" 
                    />
                  </div>
                </div>

                <div className="relative">
                  <select className="w-full bg-transparent border-b border-ocean-200 py-3 text-xs tracking-[0.2em] font-bold text-ocean-900 outline-none focus:border-ocean-900 transition-all appearance-none cursor-pointer">
                    <option>GOLDEN MILE</option>
                    <option>LA ZAGALETA</option>
                    <option>SOTOGRANDE</option>
                    <option>OTHER</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-ocean-300 pointer-events-none" />
                </div>

                <div className="relative">
                  <textarea 
                    rows={2} 
                    placeholder="MESSAGE"
                    className="w-full bg-transparent border-b border-ocean-200 py-3 text-xs tracking-[0.2em] font-bold text-ocean-900 outline-none focus:border-ocean-900 transition-all resize-none placeholder:text-ocean-200"
                  />
                </div>

                <button className="w-full py-5 bg-ocean-900 text-white rounded-full text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-ocean-800 transition-all shadow-xl">
                  Send Inquiry
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="py-20 bg-sand-50 border-t border-ocean-100 text-ocean-900 text-xs tracking-widest uppercase">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-12 mb-16">
          <img src="/assets/logo-blue.png" alt="Lozano Realty Logo" className="h-24 w-auto" />
          <div className="flex gap-10">
            <a href="#" className="hover:text-sand-500 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-sand-500 transition-colors">Legal Notice</a>
            <a href="#" className="hover:text-sand-500 transition-colors">Cookies</a>
          </div>
          <div className="font-serif italic normal-case tracking-normal text-lg">Crafted for Costa del Sol</div>
        </div>
        <div className="text-center pt-8 border-t border-ocean-50 text-ocean-400 normal-case tracking-normal">
          © 2026 Lozano Realty®. Lozano Realty® is a registered trademark of Lozano Ltd.
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  return (
    <div className="min-h-screen font-sans">
      <Navbar />
      <Hero />
      <Properties />
      <About />
      <Contact />
      <Footer />
    </div>
  );
}
