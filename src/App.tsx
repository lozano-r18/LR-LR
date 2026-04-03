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
  title: string;
  location: string;
  price: string;
  beds: number;
  baths: number;
  sqft: string;
  image: string;
  tag: string;
  type: string;
  description?: string;
  features?: string[];
  pool?: boolean;
}

// --- Mock Data ---
const PROPERTIES: Property[] = [
  {
    id: 1,
    title: "Villa Seraphina",
    location: "Marbella Golden Mile",
    price: "€12,500,000",
    beds: 6,
    baths: 7,
    sqft: "1,200 m²",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1000",
    tag: "Exclusive",
    type: "Villa"
  },
  {
    id: 2,
    title: "The Azure Penthouse",
    location: "Puerto Banús",
    price: "€4,800,000",
    beds: 3,
    baths: 4,
    sqft: "450 m²",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1000",
    tag: "New Build",
    type: "Penthouse"
  },
  {
    id: 3,
    title: "Finca Los Olivos",
    location: "Benahavís",
    price: "€8,950,000",
    beds: 5,
    baths: 5,
    sqft: "850 m²",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000",
    tag: "Investment",
    type: "Villa"
  }
];

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
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-ocean-900 flex items-center justify-center rounded-sm">
            <span className="text-sand-200 font-serif text-2xl font-bold italic">L</span>
          </div>
          <span className={`text-2xl font-serif font-bold tracking-widest ${isScrolled ? 'text-ocean-900' : 'text-white'}`}>
            LOZANO <span className="font-light italic">REALTY</span>
          </span>
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
    <section id="hero" className="relative h-screen flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=2000" 
          alt="Luxury Villa Costa del Sol" 
          className="w-full h-full object-cover scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ocean-900/60 via-ocean-900/40 to-sand-50/100" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl"
        >
          <span className="inline-block text-sand-300 font-medium tracking-[0.3em] uppercase mb-6 text-sm">
            Costa del Sol • Spain
          </span>
          <h1 className="text-6xl md:text-8xl font-serif text-white leading-tight mb-8">
            Your Private <br />
            <span className="italic font-light">Luxury Shoppers</span>
          </h1>
          <p className="text-white/80 text-lg md:text-xl mb-12 font-light leading-relaxed max-w-xl">
            We don't just find houses; we curate lifestyles. Lozano Realty provides exclusive access to off-market properties and bespoke investment opportunities in the Mediterranean's most prestigious coast.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6">
            <button className="px-10 py-5 bg-sand-500 text-white font-medium tracking-widest uppercase hover:bg-sand-600 transition-all flex items-center gap-3 shadow-xl">
              View Portfolio <ChevronRight size={18} />
            </button>
            <button className="px-10 py-5 glass-dark text-white font-medium tracking-widest uppercase hover:bg-white/20 transition-all">
              Our Services
            </button>
          </div>
        </motion.div>
      </div>

      {/* Floating Stats */}
      <div className="absolute bottom-10 right-10 hidden lg:block">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="glass p-8 flex gap-12"
        >
          <div>
            <div className="text-3xl font-serif text-ocean-900">15+</div>
            <div className="text-xs text-ocean-500 uppercase tracking-widest mt-1">Years Experience</div>
          </div>
          <div className="w-px h-12 bg-ocean-100" />
          <div>
            <div className="text-3xl font-serif text-ocean-900">€500M+</div>
            <div className="text-xs text-ocean-500 uppercase tracking-widest mt-1">Assets Managed</div>
          </div>
          <div className="w-px h-12 bg-ocean-100" />
          <div>
            <div className="text-3xl font-serif text-ocean-900">100%</div>
            <div className="text-xs text-ocean-500 uppercase tracking-widest mt-1">Discretion</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const Properties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
          const parsedProperties: Property[] = propertyNodes.map(node => {
            const getText = (selector: string) => node.querySelector(selector)?.textContent || '';
            const type = getText('type') || 'Property';
            const town = getText('town') || 'Costa del Sol';
            const priceVal = getText('price');
            const formattedPrice = priceVal && !isNaN(Number(priceVal)) ? `€${Number(priceVal).toLocaleString()}` : 'Price on Request';
            
            let image = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1000';
            const imageUrlNode = node.querySelector('images image url');
            if (imageUrlNode && imageUrlNode.textContent) {
              image = imageUrlNode.textContent;
            }

            const builtArea = node.querySelector('surface_area built')?.textContent || '0';
            const sqft = builtArea !== '0' ? `${builtArea} m²` : 'Contact for area';

            const featuresNodes = Array.from(node.querySelectorAll('features feature'));
            const features = featuresNodes.map(f => f.textContent || '').filter(Boolean);

            return {
              id: getText('id') || getText('ref') || Math.random().toString(),
              title: `${type.charAt(0).toUpperCase() + type.slice(1)} in ${town}`,
              location: `${town}, ${getText('province')}`,
              price: formattedPrice,
              beds: parseInt(getText('beds')) || 0,
              baths: parseInt(getText('baths')) || 0,
              sqft: sqft,
              image: image,
              tag: getText('new_build') === '1' ? "New Build" : "Exclusive",
              type: type,
              features: features,
              pool: getText('pool') === '1',
              description: node.querySelector('desc es')?.textContent || node.querySelector('desc en')?.textContent || ''
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

  const filteredProperties = properties.filter(prop => 
    prop.location.toLowerCase().includes(searchTerm.toLowerCase()) || 
    prop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prop.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedProperties = showAll ? filteredProperties : filteredProperties.slice(0, 9);

  return (
    <section id="properties" className="py-32 bg-sand-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-serif text-ocean-900 mb-6">
              Exclusive <span className="italic font-light">Listings</span>
            </h2>
            <p className="text-ocean-600 font-light leading-relaxed">
              Browse our complete HabiHub collection of premium properties across the Costa del Sol.
            </p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ocean-300" size={18} />
            <input 
              type="text" 
              placeholder="Search location or type..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-ocean-100 focus:border-sand-500 outline-none transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
              <div className="relative aspect-[4/5] overflow-hidden mb-6">
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
                className="relative w-full max-w-6xl max-h-full bg-white overflow-hidden flex flex-col md:flex-row shadow-2xl"
              >
                <button 
                  onClick={() => setSelectedProperty(null)}
                  className="absolute top-6 right-6 z-10 w-12 h-12 glass flex items-center justify-center text-ocean-900 hover:bg-white transition-colors"
                >
                  <X size={24} />
                </button>

                {/* Left Side: Image */}
                <div className="w-full md:w-1/2 h-64 md:h-auto relative">
                  <img 
                    src={selectedProperty.image} 
                    alt={selectedProperty.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-6 left-6 flex gap-2">
                    <span className="glass px-4 py-2 text-xs uppercase tracking-widest font-bold text-ocean-900">
                      {selectedProperty.tag}
                    </span>
                    {selectedProperty.pool && (
                      <span className="glass px-4 py-2 text-xs uppercase tracking-widest font-bold text-ocean-900">
                        Pool
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Side: Content */}
                <div className="w-full md:w-1/2 p-8 md:p-16 overflow-y-auto bg-sand-50">
                  <div className="mb-10">
                    <div className="flex items-center gap-2 text-sand-500 text-sm uppercase tracking-widest mb-4">
                      <MapPin size={16} />
                      <span>{selectedProperty.location}</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-serif text-ocean-900 mb-4">{selectedProperty.title}</h2>
                    <div className="text-3xl font-light text-ocean-700">{selectedProperty.price}</div>
                  </div>

                  <div className="grid grid-cols-3 gap-8 py-8 border-y border-ocean-100 mb-10">
                    <div>
                      <div className="text-sm text-ocean-400 uppercase tracking-widest mb-1">Beds</div>
                      <div className="text-xl text-ocean-900 font-medium">{selectedProperty.beds}</div>
                    </div>
                    <div>
                      <div className="text-sm text-ocean-400 uppercase tracking-widest mb-1">Baths</div>
                      <div className="text-xl text-ocean-900 font-medium">{selectedProperty.baths}</div>
                    </div>
                    <div>
                      <div className="text-sm text-ocean-400 uppercase tracking-widest mb-1">Area</div>
                      <div className="text-xl text-ocean-900 font-medium">{selectedProperty.sqft}</div>
                    </div>
                  </div>

                  {selectedProperty.description && (
                    <div className="mb-10">
                      <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-ocean-900 mb-4">Description</h4>
                      <p className="text-ocean-600 font-light leading-relaxed">
                        {selectedProperty.description}
                      </p>
                    </div>
                  )}

                  {selectedProperty.features && selectedProperty.features.length > 0 && (
                    <div className="mb-12">
                      <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-ocean-900 mb-4">Key Features</h4>
                      <div className="grid grid-cols-2 gap-y-3">
                        {selectedProperty.features.map(f => (
                          <div key={f} className="flex items-center gap-2 text-sm text-ocean-500">
                            <div className="w-1.5 h-1.5 bg-sand-400 rotate-45" />
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button className="w-full py-5 bg-ocean-900 text-white font-medium tracking-widest uppercase hover:bg-ocean-800 transition-all flex items-center justify-center gap-4">
                    Inquire for Details <Mail size={18} />
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};


const Contact = () => {
  return (
    <section id="contact" className="py-32 bg-ocean-900 text-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div>
            <h2 className="text-4xl md:text-5xl font-serif mb-8">
              Begin Your <br />
              <span className="italic font-light">Acquisition Journey</span>
            </h2>
            <p className="text-white/60 font-light leading-relaxed mb-12 max-w-md">
              Whether you are looking for a primary residence, a holiday home, or a strategic investment, our team is ready to assist you with absolute discretion.
            </p>

            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 glass-dark flex items-center justify-center">
                  <Phone size={20} />
                </div>
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-widest mb-1">Call Us</div>
                  <div className="text-lg">+34 951 234 567</div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 glass-dark flex items-center justify-center">
                  <Mail size={20} />
                </div>
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-widest mb-1">Email</div>
                  <div className="text-lg">concierge@lozanorealty.com</div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 glass-dark flex items-center justify-center">
                  <MapPin size={20} />
                </div>
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-widest mb-1">Office</div>
                  <div className="text-lg">Av. Ricardo Soriano, 12, Marbella</div>
                </div>
              </div>
            </div>

            <div className="flex gap-6 mt-16">
              <a href="#" className="w-10 h-10 glass-dark flex items-center justify-center hover:bg-sand-500 transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 glass-dark flex items-center justify-center hover:bg-sand-500 transition-colors">
                <Linkedin size={18} />
              </a>
              <a href="#" className="w-10 h-10 glass-dark flex items-center justify-center hover:bg-sand-500 transition-colors">
                <Facebook size={18} />
              </a>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass p-10 md:p-16"
          >
            <form className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40">Full Name</label>
                  <input type="text" className="w-full bg-transparent border-b border-white/20 py-2 focus:border-sand-500 outline-none transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40">Email Address</label>
                  <input type="email" className="w-full bg-transparent border-b border-white/20 py-2 focus:border-sand-500 outline-none transition-colors" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Interested In</label>
                <select className="w-full bg-transparent border-b border-white/20 py-2 focus:border-sand-500 outline-none transition-colors appearance-none">
                  <option className="bg-ocean-900">Marbella Golden Mile</option>
                  <option className="bg-ocean-900">La Zagaleta</option>
                  <option className="bg-ocean-900">Sotogrande</option>
                  <option className="bg-ocean-900">Benahavís</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Message</label>
                <textarea rows={4} className="w-full bg-transparent border-b border-white/20 py-2 focus:border-sand-500 outline-none transition-colors resize-none"></textarea>
              </div>
              <button className="w-full py-5 bg-sand-500 text-white font-medium tracking-widest uppercase hover:bg-sand-600 transition-all">
                Send Inquiry
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="py-12 bg-ocean-900 border-t border-white/10 text-white/40 text-xs tracking-widest uppercase">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
        <div>© 2026 Lozano Realty. All Rights Reserved.</div>
        <div className="flex gap-10">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Legal Notice</a>
          <a href="#" className="hover:text-white transition-colors">Cookies</a>
        </div>
        <div className="font-serif italic normal-case tracking-normal">Crafted for Costa del Sol</div>
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
      <Contact />
      <Footer />
    </div>
  );
}
