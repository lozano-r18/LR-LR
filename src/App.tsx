import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin, Search, Users, Phone, Mail, Instagram, Facebook, Linkedin,
  ChevronRight, ChevronDown, Menu, X, Home, Award, ShieldCheck,
  ArrowRight, Globe, Heart, Layout, Share, Shield, Settings2, RotateCcw
} from 'lucide-react';
import { XMLParser } from 'fast-xml-parser';

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
  area: string; type: string; beds: string; baths: string;
  priceMin: string; priceMax: string; ref: string; sortBy: string;
}

// --- Global Data Cache ---
let cachedPropertiesPromise: Promise<Property[]> | null = null;

const parseJsonProperties = (data: any): Property[] => {
  try {
    const propertiesSource = data?.root?.property || data?.properties?.property;
    if (!propertiesSource) return [];
    const nodes = Array.isArray(propertiesSource) ? propertiesSource : [propertiesSource];

    return nodes.reduce((acc: Property[], node: any) => {
      try {
        const type = String(node.type || 'Property');
        const town = String(node.town || 'Costa del Sol');
        const development = node.location_detail || '';
        
        const priceVal = node.price;
        const formattedPrice = priceVal && !isNaN(Number(priceVal)) ? `€${Number(priceVal).toLocaleString()}` : 'Price on Request';

        let images: string[] = [];
        if (node.images?.image) {
          images = (Array.isArray(node.images.image) ? node.images.image : [node.images.image])
            .map((img: any) => typeof img === 'string' ? img : img?.url)
            .filter(Boolean)
            .map(String);
        }

        const propertyId = String(node.id || node.ref || Math.random());
        
        const preferredImages = images.filter(url => {
          const u = url.toLowerCase();
          return !u.includes('logo') && (u.includes('outdoor') || u.includes('indoor') || u.includes('exterior'));
        });
        const validImages = images.filter(url => !url.toLowerCase().includes('logo'));
        const mainImage = preferredImages[0] || validImages[0] || 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1000';
        
        const builtArea = node.surface_area?.built || '0';

        const devCandidate = String(node.name || node.development_name || node.residence || node.location_detail || '').trim();
        const isTownName = [town, 'marbella', 'mijas', 'fuengirola', 'estepona', 'benahavis', 'sotogrande', 'manilva', 'casares']
                           .map(String)
                           .some(t => devCandidate.toLowerCase() === t.toLowerCase());
        const developmentName = !isTownName && devCandidate ? devCandidate : '';

        acc.push({
          id: propertyId,
          ref: String(node.ref || ''),
          title: developmentName ? `${type.charAt(0).toUpperCase() + type.slice(1)} in ${developmentName}` : `${type.charAt(0).toUpperCase() + type.slice(1)} in ${town}`,
          location: `${town}, ${node.province || ''}`,
          town: town,
          province: typeof node.province === 'string' ? node.province : '',
          price: formattedPrice,
          priceNumeric: Number(priceVal) || 0,
          beds: parseInt(node.beds) || 0,
          baths: parseInt(node.baths) || 0,
          sqft: builtArea !== '0' ? `${builtArea} m²` : 'Contact for area',
          sqftNumeric: Number(builtArea) || 0,
          image: mainImage,
          images: images,
          tag: node.new_build == 1 ? "New Build" : "Exclusive",
          type: type,
          description: String(node.desc?.en || node.desc?.es || '').split('. ').slice(0, 2).join('. '),
          url: typeof node.url === 'string' ? node.url : String(node.url?.en || node.url?.es || ''),
          features: Array.isArray(node.features?.feature) ? node.features.feature : [],
          pool: node.pool == 1
        } as Property);
      } catch (innerErr) {
        console.warn('Skipped parsing property:', innerErr);
      }
      return acc;
    }, []);
  } catch (err) {
    console.error("Parse Error:", err);
    return [];
  }
};

const getSharedProperties = (): Promise<Property[]> => {
  if (cachedPropertiesPromise) return cachedPropertiesPromise;
  
  cachedPropertiesPromise = new Promise(async (resolve, reject) => {
    try {
      // BUMP CACHE TO V6 TO CLEAR OLD XML CAPTURES
      const CACHE_KEY = 'lr_properties_cache_v6';
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            resolve(parsed);
            fetch('/api/feed')
              .then(async res => {
                const contentType = res.headers.get("content-type");
                let dataToParse;
                if (contentType && contentType.indexOf("application/json") !== -1) {
                  dataToParse = await res.json();
                } else {
                  const xml = await res.text();
                  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
                  dataToParse = parser.parse(xml);
                }
                const props = parseJsonProperties(dataToParse);
                if (props.length > 0) localStorage.setItem(CACHE_KEY, JSON.stringify(props));
              }).catch(() => {});
            return;
          }
        } catch (e) {}
      }

      const res = await fetch('/api/feed');
      if (!res.ok) throw new Error('Network response not ok');
      
      const contentType = res.headers.get("content-type");
      let dataToParse;
      if (contentType && contentType.indexOf("application/json") !== -1) {
        dataToParse = await res.json();
      } else {
        const xmlText = await res.text();
        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
        dataToParse = parser.parse(xmlText);
      }
      
      const parsedProperties = parseJsonProperties(dataToParse);

      if (parsedProperties.length > 0) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(parsedProperties));
      }
      resolve(parsedProperties);
    } catch (e) {
      console.error("Fetch error:", e);
      reject(e);
      cachedPropertiesPromise = null;
    }
  });
  
  return cachedPropertiesPromise;
};

// --- Components ---

const Navbar = ({ onContactClick, currentRoute }: { onContactClick: () => void, currentRoute: string }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const forceDark = currentRoute === 'team';
  const navTextClass = forceDark || isScrolled ? 'text-ocean-900' : 'text-white';
  const logoSrc = forceDark || isScrolled ? "/assets/logo-blue.png" : "/assets/logo-white.png";
  const navBgClass = forceDark && !isScrolled ? 'py-4 md:py-8 bg-transparent' : (isScrolled ? 'py-2 md:py-4 glass' : 'py-4 md:py-8 bg-transparent');
  const btnHover = forceDark || isScrolled ? 'hover:bg-ocean-900 hover:text-white' : 'hover:bg-white hover:text-ocean-900';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navBgClass}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center relative z-[60]">
        <div className="flex items-center">
          <img
            src={logoSrc}
            alt="Lozano Realty Logo"
            className="h-14 md:h-20 w-auto transition-all duration-300"
          />
        </div>

        {/* Desktop Menu */}
        <div className={`hidden md:flex items-center gap-10 font-medium text-sm uppercase tracking-widest ${navTextClass}`}>
          <a href="#home" className="hover:opacity-70 transition-opacity">Home</a>
          <a href="#home" className="hover:opacity-70 transition-opacity">Properties</a>
          <a href="#team" className="hover:opacity-70 transition-opacity whitespace-nowrap">Team</a>
          <button
            onClick={onContactClick}
            className={`px-6 py-2 border border-current transition-all ${btnHover}`}
          >
            Contact
          </button>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-current" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="text-ocean-900" /> : <Menu className={navTextClass} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 bg-white/95 backdrop-blur-xl shadow-2xl pt-32 pb-12 flex flex-col items-center gap-8 text-ocean-900 font-medium uppercase tracking-widest md:hidden z-50"
          >
            <a href="#home" onClick={() => setIsMobileMenuOpen(false)}>Home</a>
            <a href="#home" onClick={() => setIsMobileMenuOpen(false)}>Properties</a>
            <a href="#team" onClick={() => setIsMobileMenuOpen(false)}>Team & Collaborations</a>
            <button
              className="text-center mt-4 px-10 py-3 bg-ocean-900 text-white border border-ocean-900 text-sm font-bold transition-all active:scale-95"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onContactClick();
              }}
            >
              Contact
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = ({ onContactClick }: { onContactClick: () => void }) => {
  return (
    <section id="home" className="relative h-[85vh] flex items-center justify-center overflow-hidden">
      {/* High-End Villa Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="/assets/HERO IMAGE .jpg"
          alt="Luxury Beachside Villa Costa del Sol"
          className="w-full h-full object-cover object-center"
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
          <h1 className="text-[13vw] md:text-[9vw] font-serif text-white/95 tracking-[0.02em] leading-[1.1] md:leading-none mb-14 uppercase select-none font-medium md:whitespace-nowrap">
            LOZANO REALTY
          </h1>

          <div className="flex flex-col md:flex-row items-start md:items-end gap-10 mt-4 px-4">
            <div className="max-w-xs">
              <p className="text-white/70 text-sm md:text-base font-medium leading-relaxed tracking-wide">
                Premium properties handpicked for living, investing, and pure coastal bliss.
              </p>
            </div>
            <button
              onClick={onContactClick}
              className="group flex items-center gap-4 bg-white/20 backdrop-blur-xl border border-white/30 text-white px-10 py-5 rounded-xl hover:bg-white hover:text-ocean-900 transition-all duration-500 shadow-2xl"
            >
              <span className="text-sm font-bold tracking-widest uppercase text-nowrap">GET IN TOUCH</span>
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const Properties = ({ onContactClick }: { onContactClick: () => void }) => {
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
  const [visibleCount, setVisibleCount] = useState(12);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    const fetchHabiHubProperties = async () => {
      try {
        const parsedProperties = await getSharedProperties();
        setProperties(parsedProperties);
      } catch (error) {
        console.error("Error fetching HabiHub feed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHabiHubProperties();
  }, []);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen || !selectedProperty) return;

      const images = selectedProperty.images.length > 0 ? selectedProperty.images : [selectedProperty.image];

      if (e.key === 'ArrowRight') {
        setActiveImageIndex(prev => Math.min(images.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setActiveImageIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, selectedProperty]);

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

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(12);
  }, [filters]);

  const displayedProperties = filteredProperties.slice(0, visibleCount);

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
                  onChange={(e) => setFilters({ ...filters, area: e.target.value })}
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
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
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
                  onChange={(e) => setFilters({ ...filters, beds: e.target.value })}
                >
                  <option value="">Beds</option>
                  {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}+</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-ocean-300 pointer-events-none" />
              </div>

              <div className="relative group">
                <select
                  className="w-full py-4 px-6 bg-white rounded-full border-none outline-none text-[11px] uppercase tracking-widest font-bold text-ocean-900 appearance-none cursor-pointer shadow-sm group-hover:shadow-md transition-all"
                  value={filters.baths}
                  onChange={(e) => setFilters({ ...filters, baths: e.target.value })}
                >
                  <option value="">Baths</option>
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}+</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-ocean-300 pointer-events-none" />
              </div>

              <div className="relative group">
                <select
                  className="w-full py-4 px-6 bg-white rounded-full border-none outline-none text-[11px] uppercase tracking-widest font-bold text-ocean-900 appearance-none cursor-pointer shadow-sm group-hover:shadow-md transition-all"
                  value={filters.priceMin}
                  onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
                >
                  <option value="">Min €</option>
                  {[100000, 250000, 500000, 1000000, 2000000, 5000000].map(p => (
                    <option key={p} value={p}>€{(p / 1000).toFixed(0)}k</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-ocean-300 pointer-events-none" />
              </div>

              <div className="relative group">
                <select
                  className="w-full py-4 px-6 bg-white rounded-full border-none outline-none text-[11px] uppercase tracking-widest font-bold text-ocean-900 appearance-none cursor-pointer shadow-sm group-hover:shadow-md transition-all"
                  value={filters.priceMax}
                  onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
                >
                  <option value="">Max €</option>
                  {[500000, 1000000, 2000000, 5000000, 10000000, 20000000].map(p => (
                    <option key={p} value={p}>€{(p / 1000000).toFixed(1)}M</option>
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
                  onChange={(e) => setFilters({ ...filters, ref: e.target.value })}
                />
              </div>

              <div className="relative group lg:col-span-1 flex gap-2">
                <button
                  className="w-full h-full py-4 bg-ocean-900 text-white rounded-full flex items-center justify-center hover:bg-ocean-800 transition-all shadow-lg"
                  onClick={() => {
                    const el = document.getElementById('properties');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  title="Search Properties"
                >
                  <Search size={18} />
                </button>
                <button
                  className="w-14 h-full py-4 bg-ocean-50 text-ocean-900 rounded-full flex items-center justify-center hover:bg-ocean-100 transition-all shadow-sm"
                  onClick={() => setFilters({ area: '', type: '', beds: '', baths: '', priceMin: '', priceMax: '', ref: '', sortBy: 'newest' })}
                  title="Clear Filters"
                >
                  <RotateCcw size={14} />
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
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
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
              viewport={{ once: true, margin: "100px" }}
              transition={{ delay: (idx % 3) * 0.1 }}
              className="group cursor-pointer relative aspect-[4/5] overflow-hidden rounded-[2.5rem] shadow-md hover:shadow-2xl transition-all bg-ocean-50"
              onClick={() => setSelectedProperty(prop)}
            >
              <img
                src={prop.image}
                alt={prop.title}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent pointer-events-none" />

              <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-md border border-white/50 rounded-full px-4 py-1.5 text-[10px] uppercase tracking-widest font-bold text-white z-10 transition-colors group-hover:bg-white/30 shadow-sm">
                {prop.tag}
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col justify-end z-10">
                <h3 className="text-2xl md:text-3xl font-semibold font-sans text-white mb-1 line-clamp-1 drop-shadow-sm">{prop.title}</h3>
                <p className="text-white/90 text-sm md:text-base font-medium mb-5 drop-shadow-sm truncate">
                  {prop.location}
                </p>
                
                <div className="flex flex-col gap-2">
                  <div className="w-fit px-4 py-1.5 rounded-full border border-white/50 bg-white/20 backdrop-blur-md text-sm text-white font-medium shadow-sm">
                    {prop.price}
                  </div>
                  <div className="w-fit flex items-center px-4 py-1.5 rounded-full border border-white/50 bg-white/20 backdrop-blur-md text-sm text-white font-medium shadow-sm">
                    <span>{prop.sqft}</span>
                    <span className="mx-2 text-white/60 font-light">|</span>
                    <span>{prop.beds} Bed.</span>
                    <span className="mx-2 text-white/60 font-light">|</span>
                    <span>{prop.baths} Bath.</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredProperties.length > visibleCount && (
          <div className="mt-20 text-center">
            <button
              onClick={() => setVisibleCount(prev => prev + 12)}
              className="px-10 py-4 bg-white/60 backdrop-blur-xl border border-ocean-200 text-ocean-900 text-sm font-bold tracking-widest uppercase hover:bg-ocean-900 hover:text-white transition-all duration-500 flex items-center gap-4 mx-auto rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] group/btn"
            >
              {loading ? 'Updating Feed...' : `Load More (${filteredProperties.length - visibleCount} remaining)`} 
              <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* Property Detail Modal */}
        <AnimatePresence>
          {selectedProperty && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedProperty(null)}
                className="absolute inset-0 bg-ocean-900/40 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full h-[100vh] bg-white overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header Actions */}
                <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-ocean-50 px-6 py-4 flex justify-between items-center">
                  <div className="flex items-center gap-4 md:gap-6 text-sm font-medium text-ocean-900">
                    <button className="flex items-center gap-2 hover:opacity-60 transition-opacity">
                      <Heart size={18} /> <span className="hidden sm:inline">Save</span>
                    </button>
                    <button className="flex items-center gap-2 hover:opacity-60 transition-opacity">
                      <Share size={18} /> <span className="hidden sm:inline">Share</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] md:text-xs text-ocean-400 max-w-[40%] md:max-w-none truncate">
                    <MapPin size={14} className="text-ocean-900 shrink-0" />
                    <span className="uppercase tracking-widest truncate">{selectedProperty.location}</span>
                  </div>

                  <button
                    onClick={() => setSelectedProperty(null)}
                    className="w-10 h-10 rounded-full bg-ocean-50 flex items-center justify-center text-ocean-900 hover:bg-ocean-900 hover:text-white transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-8 font-sans">
                  {/* Image Gallery - Carousel on Mobile, Grid on Desktop */}
                  <div className="relative mb-8 md:mb-12 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden group/gallery">
                    {/* Desktop Grid Layout */}
                    <div className="hidden md:grid grid-cols-12 gap-2 h-[55vh]">
                      <div className="col-span-12 md:col-span-6 h-full relative overflow-hidden">
                        <img src={selectedProperty.images[0] || selectedProperty.image} className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex flex-col col-span-3 gap-2 h-full">
                        <div className="h-1/2 overflow-hidden">
                          <img src={selectedProperty.images[1] || selectedProperty.image} className="w-full h-full object-cover hover:scale-110 transition-transform duration-1000" referrerPolicy="no-referrer" />
                        </div>
                        <div className="h-1/2 overflow-hidden">
                          <img src={selectedProperty.images[2] || selectedProperty.image} className="w-full h-full object-cover hover:scale-110 transition-transform duration-1000" referrerPolicy="no-referrer" />
                        </div>
                      </div>
                      <div className="col-span-3 h-full relative overflow-hidden">
                        <img src={selectedProperty.images[3] || selectedProperty.image} className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000" referrerPolicy="no-referrer" />

                        <button
                          onClick={() => setIsLightboxOpen(true)}
                          className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-xl border border-white px-6 py-4 rounded-xl text-xs font-bold tracking-widest uppercase text-ocean-900 shadow-2xl hover:bg-ocean-900 hover:text-white transition-all flex items-center gap-3"
                        >
                          Images <span className="opacity-40">{selectedProperty.images.length || 1}</span>
                        </button>
                      </div>
                    </div>

                    {/* Mobile Carousel Layout */}
                    <div className="md:hidden relative h-[45vh] w-full overflow-hidden">
                      <motion.div
                        className="flex h-full"
                        animate={{ x: `-${(activeImageIndex || 0) * 100}%` }}
                        transition={{ type: "spring", damping: 30, stiffness: 200 }}
                      >
                        {(selectedProperty.images.length > 0 ? selectedProperty.images : [selectedProperty.image]).map((img, i) => (
                          <div key={i} className="min-w-full h-full">
                            <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        ))}
                      </motion.div>

                      {/* Carousel Controls */}
                      <div className="absolute bottom-4 left-0 right-0 flex justify-between px-4 items-center pointer-events-none">
                        <div className="bg-ocean-900/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white font-bold tracking-widest pointer-events-auto">
                          {(activeImageIndex || 0) + 1} / {selectedProperty.images.length || 1}
                        </div>
                        <div className="flex gap-2 pointer-events-auto">
                          <button
                            onClick={(e) => { e.stopPropagation(); setActiveImageIndex(prev => Math.max(0, (prev || 0) - 1)); }}
                            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-ocean-900 shadow-lg"
                          >
                            <ChevronDown size={20} className="rotate-90" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setActiveImageIndex(prev => Math.min((selectedProperty.images.length || 1) - 1, (prev || 0) + 1)); }}
                            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-ocean-900 shadow-lg"
                          >
                            <ChevronDown size={20} className="-rotate-90" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 item-start">
                    {/* Main Content */}
                    <div className="lg:col-span-8">
                      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                        <div>
                          <h2 className="text-5xl md:text-8xl font-serif text-ocean-900 mb-2 leading-none">
                            {selectedProperty.price}
                          </h2>
                        </div>

                        <div className="flex gap-8 md:gap-12 flex-wrap">
                          <div>
                            <div className="text-2xl md:text-5xl font-light text-ocean-900">{selectedProperty.sqftNumeric} <span className="text-xs md:text-base text-ocean-300">m²</span></div>
                            <div className="text-[9px] md:text-[10px] text-ocean-400 uppercase tracking-widest font-bold mt-1 md:mt-2">Surface</div>
                          </div>
                          <div>
                            <div className="text-2xl md:text-5xl font-light text-ocean-900">{selectedProperty.beds}</div>
                            <div className="text-[9px] md:text-[10px] text-ocean-400 uppercase tracking-widest font-bold mt-1 md:mt-2">Bedrooms</div>
                          </div>
                          <div>
                            <div className="text-2xl md:text-5xl font-light text-ocean-900">{selectedProperty.baths}</div>
                            <div className="text-[9px] md:text-[10px] text-ocean-400 uppercase tracking-widest font-bold mt-1 md:mt-2">Bathrooms</div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-ocean-50 pt-12 space-y-12">
                        <section>
                          <h4 className="text-sm font-bold text-ocean-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-4">
                            All Technical Specifications <div className="h-px flex-1 bg-ocean-50" />
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-sm">
                            <div className="flex items-center gap-3 text-ocean-600">
                              <Layout size={18} className="text-ocean-300" />
                              <span>Pool available</span>
                            </div>
                            <div className="flex items-center gap-3 text-ocean-600">
                              <Shield size={18} className="text-ocean-300" />
                              <span>24h Security</span>
                            </div>
                            <div className="flex items-center gap-3 text-ocean-600">
                              <Globe size={18} className="text-ocean-300" />
                              <span>Ocean Views</span>
                            </div>
                          </div>
                        </section>

                        <section className="prose prose-ocean max-w-none">
                          <p className="text-lg text-ocean-700 font-light leading-relaxed">
                            {selectedProperty.description}
                          </p>
                        </section>

                        {/* Floor Plans Link */}
                        {selectedProperty.plans && selectedProperty.plans.length > 0 && (
                          <div className="bg-ocean-900 text-white p-12 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-8">
                            <div>
                              <h3 className="text-2xl font-serif italic mb-2 text-white">Floor Plans</h3>
                              <p className="text-white/60 text-sm font-light">Download the full technical documentation and architectural layouts.</p>
                            </div>
                            <a
                              href={selectedProperty.plans[0]}
                              target="_blank"
                              className="px-10 py-5 bg-white text-ocean-900 rounded-xl text-xs font-bold tracking-[0.2em] uppercase hover:bg-ocean-50/50 transition-all shadow-xl"
                            >
                              Get Floor Plans
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact Sidebar */}
                    <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit">
                      <div className="bg-ocean-50/50 rounded-[2.5rem] p-10 border border-ocean-50">
                        <div className="flex items-center gap-6 mb-10">
                          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                            <img src="/assets/logo-blue.png" className="w-10 h-auto" />
                          </div>
                          <div>
                            <div className="text-[10px] text-ocean-400 uppercase tracking-widest font-bold mb-1">Estate Agency</div>
                            <div className="text-lg font-serif">Lozano Realty</div>
                          </div>
                        </div>

                        <button
                          onClick={onContactClick}
                          className="w-full py-6 bg-ocean-900 text-white rounded-2xl font-bold tracking-[0.3em] uppercase hover:bg-ocean-800 transition-all shadow-xl mb-4"
                        >
                          Contact Agent
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Full-Screen Lightbox Gallery (Desktop Focus) */}
        <AnimatePresence>
          {isLightboxOpen && selectedProperty && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-ocean-900/60 backdrop-blur-2xl flex flex-col items-center justify-center p-4 md:p-0"
              onClick={() => setIsLightboxOpen(false)}
            >
              <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-ocean-900/40 to-transparent">
                <div className="text-white/60 text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase">
                  {selectedProperty.title} <span className="mx-4 text-white/20">|</span> {activeImageIndex + 1} / {selectedProperty.images.length || 1}
                </div>
                <button
                  onClick={() => setIsLightboxOpen(false)}
                  className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-ocean-900 transition-all border border-white/10"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="relative w-full h-full flex items-center justify-center p-4 md:py-12 md:px-6">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImageIndex}
                    initial={{ opacity: 0, scale: 0.98, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.98, x: -20 }}
                    src={(selectedProperty.images.length > 0 ? selectedProperty.images : [selectedProperty.image])[activeImageIndex]}
                    className="max-w-full max-h-full object-contain shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] bg-ocean-900/20"
                    referrerPolicy="no-referrer"
                    onClick={(e) => e.stopPropagation()}
                  />
                </AnimatePresence>

                <button
                  onClick={(e) => { e.stopPropagation(); setActiveImageIndex(prev => Math.max(0, prev - 1)); }}
                  className="absolute left-6 md:left-12 w-16 h-16 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-ocean-900 transition-all group"
                >
                  <ChevronDown size={32} className="rotate-90 group-hover:-translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveImageIndex(prev => Math.min((selectedProperty.images.length || 1) - 1, prev + 1)); }}
                  className="absolute right-6 md:right-12 w-16 h-16 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-ocean-900 transition-all group"
                >
                  <ChevronDown size={32} className="-rotate-90 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Lightbox Thumbnails */}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4 max-w-[90vw] overflow-x-auto px-6 py-4 no-scrollbar bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                {(selectedProperty.images.length > 0 ? selectedProperty.images : [selectedProperty.image]).map((img, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setActiveImageIndex(i); }}
                    className={`w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-300 ${activeImageIndex === i ? 'border-white scale-110 shadow-xl' : 'border-transparent opacity-40 hover:opacity-100'}`}
                  >
                    <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};


const TeamPage = () => {
  const team = [
    {
      name: 'Ignacio Lozano',
      role: 'Business Development Associate',
      bio: 'Ignacio manages client relations, builds strategic partnerships with developers, and leads our creative brand development.',
      linkedin: null
    },
    {
      name: 'Pablo Lozano',
      role: 'Costa Blanca Associate',
      bio: 'An operations expert who leverages his background in managing complex systems to ensure flawless execution and exceptional client experiences.',
      linkedin: null
    }
  ];

  const collaborators = [
    {
      name: 'Huspy™',
      role: 'Collaborator',
      bio: 'An international real estate platform we partner with to source top-tier properties and guide clients seamlessly through the acquisition process.',
      linkedin: null
    },
    {
      name: 'Kay Bergman',
      role: 'Real Estate Law Consultant',
      bio: 'A specialist in Spanish property law, Kay ensures complete transactional security and provides expert legal clarity for international buyers.',
      linkedin: 'https://www.linkedin.com/in/kay-bergman-b2930913/'
    },
    {
      name: 'Amaya Luzuriaga',
      role: 'Real Estate Attorney',
      bio: 'An independent legal counsel focused on ensuring full compliance and uncompromising property security through rigorous due diligence.',
      linkedin: 'https://www.linkedin.com/in/amaya-luzuriaga-84299235/'
    },
  ];



  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-32 pb-40 bg-white min-h-screen">
      <div className="max-w-6xl mx-auto px-6 pt-16 md:pt-24">
        
        {/* Header */}
        <div className="mb-16 md:mb-24 text-center md:text-left">
          <h1 className="text-[10px] font-bold tracking-[0.4em] uppercase text-ocean-400 mb-6">
            The People Behind The Process
          </h1>
          <h2 className="text-5xl md:text-6xl lg:text-[5rem] font-light text-ocean-900 tracking-tight leading-none">
            Our <span className="font-serif italic text-ocean-600">Team</span>
          </h2>
        </div>

        {/* Core Team Cards */}
        <div className="flex flex-col gap-8 mb-32">
          {/* Luis Felipe Card (Full Width) */}
          <div className="bg-white rounded-[2rem] p-10 md:p-16 shadow-[0_30px_60px_rgb(0,0,0,0.06)] relative border border-ocean-100 flex flex-col md:flex-row gap-8 md:gap-12 lg:gap-16 items-start">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white shadow-[0_10px_40px_rgb(0,0,0,0.12)] border border-ocean-100 text-ocean-900 flex items-center justify-center font-serif text-3xl italic flex-shrink-0 relative z-10 hover:shadow-[0_15px_50px_rgb(0,0,0,0.18)] transition-shadow duration-500">
              L
            </div>
            <div>
              <div className="flex items-center gap-4 mb-4">
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-serif text-ocean-900 font-normal tracking-tight">Luis Felipe Lozano</h3>
                <a href="https://www.linkedin.com/in/luislozanolozada/" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full border border-ocean-100 flex items-center justify-center text-ocean-300 hover:text-ocean-500 hover:border-ocean-300 transition-colors">
                  <Globe size={14} />
                </a>
              </div>
              <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-ocean-400 mb-8">
                Director and Lead Real Estate Consultant
              </p>
              <div className="w-12 h-[1px] bg-ocean-200 mb-8" />
              <p className="text-base md:text-lg text-ocean-700/80 font-light leading-relaxed max-w-3xl">
                Founder of Lozano Realty and specialist in property acquisition across the Costa del Sol. With a background in real estate and project management, Luis personally leads every client's acquisition journey.
              </p>
            </div>
          </div>

          {/* Associates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {team.map((member, idx) => (
              <div key={idx} className="bg-white rounded-[2rem] p-8 md:p-12 shadow-[0_30px_60px_rgb(0,0,0,0.06)] relative border border-ocean-100 flex flex-col">
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-white shadow-[0_10px_30px_rgb(0,0,0,0.1)] border border-ocean-100 text-ocean-900 flex items-center justify-center font-serif text-xl italic flex-shrink-0 hover:shadow-[0_15px_40px_rgb(0,0,0,0.15)] transition-shadow duration-500">
                    {member.name.charAt(0)}
                  </div>
                  {member.linkedin && (
                    <a href={member.linkedin} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full border border-ocean-100 flex items-center justify-center text-ocean-300 hover:text-ocean-500 hover:border-ocean-300 transition-colors">
                      <Globe size={14} />
                    </a>
                  )}
                </div>
                
                <h4 className="text-2xl md:text-3xl font-serif text-ocean-900 mb-2 font-normal">{member.name}</h4>
                <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-ocean-400 mb-6">{member.role}</p>
                <div className="w-8 h-[1px] bg-ocean-200 mb-6" />
                <p className="text-sm md:text-base text-ocean-700/80 font-light leading-relaxed">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Collaborators Block (Dark Section) */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-ocean-900 rounded-[3rem] px-6 py-16 md:p-20 overflow-hidden relative shadow-2xl">
          {/* subtle background pattern/gradient */}
          <div className="absolute top-0 right-0 w-full md:w-1/2 h-full bg-gradient-to-bl from-white/10 to-transparent pointer-events-none" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16 relative z-10 mb-20 md:mb-24">
            {collaborators.map((member, idx) => (
              <div key={idx} className="flex flex-col group">
                <div className="flex items-center justify-between mb-8 opacity-80 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full border border-white/20 text-white/70 flex items-center justify-center font-serif text-xl italic flex-shrink-0 bg-white/5">
                    {member.name.charAt(0)}
                  </div>
                  {member.linkedin ? (
                    <a href={member.linkedin} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/50 transition-colors bg-white/5">
                      <Globe size={14} />
                    </a>
                  ) : (
                    <Globe size={14} className="text-white/10" />
                  )}
                </div>

                <h4 className="text-2xl md:text-3xl font-serif text-white mb-2 font-normal">{member.name}</h4>
                <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-ocean-300 mb-6">{member.role}</p>
                <div className="w-8 h-[1px] bg-white/20 mb-6" />
                <p className="text-sm md:text-base text-white/60 font-light leading-relaxed group-hover:text-white/80 transition-colors duration-500">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>

          <div className="relative z-10 max-w-4xl border-t border-white/10 pt-12">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-light text-white tracking-tight leading-tight mb-6">
              Our <span className="font-serif italic text-white/70">Collaborators</span>
            </h2>
            <p className="text-base md:text-lg text-white/50 font-light leading-relaxed max-w-2xl">
              Exceptional results are achieved through collaboration. We work with a select network of trusted professionals, chosen for their expertise and shared commitment to excellence.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};


const About = () => {
  return (
    <section id="about" className="py-20 lg:py-32 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Left: Staggered Editorial Images */}
          <div className="lg:w-1/2 relative w-full pt-10 pb-32 lg:pb-20">
            <span className="absolute top-0 left-0 text-[10px] font-bold tracking-widest uppercase text-ocean-300">
              01 — Our Philosophy
            </span>
            <div className="relative z-10 w-[85%] mt-12 bg-white p-2 lg:p-3 shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000" 
                className="w-full h-auto aspect-[3/4] object-cover" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute top-1/2 right-0 w-[60%] lg:w-[55%] -translate-y-12 z-20 bg-ocean-900 p-1.5 lg:p-2 shadow-2xl">
              <div className="relative border border-white/20">
                <img 
                  src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1000" 
                  className="w-full h-auto aspect-square object-cover" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-4 lg:-bottom-6 right-0 text-ocean-900 text-[8px] lg:text-[10px] tracking-[0.2em] uppercase font-bold bg-white px-3 lg:px-5 py-2 lg:py-3 shadow-[0_15px_40px_rgb(0,0,0,0.15)] border border-ocean-50">
                Est. 2026
              </div>
            </div>
          </div>

          {/* Right: Sleek Typography */}
          <div className="lg:w-1/2 flex flex-col justify-center mt-8 lg:mt-0">
            <h2 className="text-3xl lg:text-[2.5rem] xl:text-5xl font-light tracking-tight text-ocean-900 leading-[1.3] mb-8 lg:mb-12">
              At <strong className="font-serif font-normal italic text-ocean-600">Lozano Realty</strong>, we see a home as the ultimate expression of comfort and well-being.
            </h2>
            <div className="pl-6 md:pl-12 border-l border-ocean-200">
              <p className="text-[10px] text-ocean-400 font-bold mb-4 uppercase tracking-[0.3em]">
                Beyond Boundaries
              </p>
              <p className="text-sm lg:text-base text-ocean-800/80 leading-relaxed font-light">
                From thoughtfully designed spaces to carefully planned communities, we curate properties that not only offer a place to live, but foster lasting memories while shaping a better, more sustainable future on the Costa del Sol.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};


const StarProjects = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTopProperties = async () => {
      try {
        const parsedProperties = await getSharedProperties();
        setProperties([...parsedProperties].sort(() => 0.5 - Math.random()).slice(0, 12));
      } catch (error) {
        console.error("Error fetching Star Projects:", error);
      }
    };

    fetchTopProperties();
  }, []);

  if (properties.length === 0) return null;

  return (
    <section id="star-projects" className="pt-16 pb-32 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-16">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          <div>
            <span className="text-[11px] font-medium tracking-wide text-ocean-900/40 block mb-6">
              (02) Our projects
            </span>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-ocean-900 mb-4">
              Projects We are Proud of
            </h2>
            <p className="text-sm text-ocean-600/70 font-light max-w-lg">
              We curate properties that not only offer a place to live but elevate the standard of Costa del Sol living.
            </p>
          </div>
          
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="relative w-full lg:w-80">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ocean-900/40" />
              <input 
                type="text" 
                placeholder="What are you looking for" 
                className="w-full pl-12 pr-4 py-3 border border-ocean-100 placeholder:text-ocean-900/40 text-sm outline-none focus:border-ocean-900 transition-colors"
              />
            </div>
            <button className="bg-ocean-900 text-white px-6 py-3 flex items-center gap-3 text-xs font-semibold tracking-wider hover:bg-ocean-800 transition-colors">
              <Settings2 size={16} /> Filter
            </button>
          </div>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex overflow-x-auto gap-5 lg:gap-8 px-6 pb-12 no-scrollbar snap-x snap-mandatory"
        style={{ scrollPaddingLeft: '1.5rem', scrollPaddingRight: '1.5rem' }}
      >
        {properties.map((prop, idx) => (
          <div key={idx} className="min-w-[85vw] md:min-w-[380px] lg:min-w-[420px] snap-start group cursor-pointer relative aspect-[4/5] overflow-hidden rounded-[2.5rem] shadow-md hover:shadow-2xl transition-all">
            <img
              src={prop.image}
              alt={prop.title}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent pointer-events-none" />

            <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-md border border-white/50 rounded-full px-4 py-1.5 text-[10px] uppercase tracking-widest font-bold text-white z-10 transition-colors group-hover:bg-white/30 shadow-sm">
              {prop.tag}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col justify-end z-10">
              <h3 className="text-2xl md:text-3xl font-semibold font-sans text-white mb-1 line-clamp-1 drop-shadow-sm">{prop.title}</h3>
              <p className="text-white/90 text-sm md:text-base font-medium mb-5 drop-shadow-sm truncate">
                {prop.location}
              </p>
              
              <div className="flex flex-col gap-2">
                <div className="w-fit px-4 py-1.5 rounded-full border border-white/50 bg-white/20 backdrop-blur-md text-sm text-white font-medium shadow-sm">
                  {prop.price}
                </div>
                <div className="w-fit flex items-center px-4 py-1.5 rounded-full border border-white/50 bg-white/20 backdrop-blur-md text-sm text-white font-medium shadow-sm">
                  <span>{prop.sqft}</span>
                  <span className="mx-2 text-white/60 font-light">|</span>
                  <span>{prop.beds} Bed.</span>
                  <span className="mx-2 text-white/60 font-light">|</span>
                  <span>{prop.baths} Bath.</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const Footer = ({ onContactClick }: { onContactClick: () => void }) => {
  return (
    <footer className="bg-ocean-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 pt-16 lg:pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16 mb-12 lg:mb-16">

          {/* Brand Column */}
          <div className="flex flex-col gap-6 lg:gap-8">
            <img src="/assets/logo-white.png" alt="Lozano Realty Logo" className="h-16 lg:h-20 w-auto self-start" />
            <p className="text-white/40 text-sm font-light leading-relaxed max-w-xs">
              Exclusive property advisory across the Costa del Sol. Curated estates. Bespoke service.
            </p>
            <div className="flex gap-4">
              <a href="https://instagram.com/lozanorealty.uk" target="_blank" className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white hover:text-ocean-900 transition-all">
                <Instagram size={16} />
              </a>
              <a href="https://www.linkedin.com/in/luislozanolozada/" target="_blank" className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white hover:text-ocean-900 transition-all">
                <Linkedin size={16} />
              </a>
              <a href="mailto:contact@lozanorealty.uk" className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white hover:text-ocean-900 transition-all">
                <Mail size={16} />
              </a>
              <a href="tel:+34672119634" className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white hover:text-ocean-900 transition-all">
                <Phone size={16} />
              </a>
            </div>
          </div>

          {/* Navigation Column */}
          <div className="flex flex-col gap-6">
            <span className="text-[10px] uppercase tracking-[0.5em] text-white/30 font-bold">Navigate</span>
            <div className="flex flex-col gap-4 text-sm font-medium tracking-widest uppercase">
              <a href="#hero" className="text-white/60 hover:text-white transition-colors">Home</a>
              <a href="#properties" className="text-white/60 hover:text-white transition-colors">Properties</a>
              <a href="#about" className="text-white/60 hover:text-white transition-colors">About</a>
              <button onClick={onContactClick} className="text-left text-white/60 hover:text-white transition-colors tracking-widest uppercase text-sm font-medium">Contact</button>
            </div>
          </div>

          {/* Contact Column */}
          <div className="flex flex-col gap-6">
            <span className="text-[10px] uppercase tracking-[0.5em] text-white/30 font-bold">Get In Touch</span>
            <div className="flex flex-col gap-5">
              <a href="tel:+34672119634" className="flex items-center gap-4 text-white/60 hover:text-white transition-colors group">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
                  <Phone size={14} />
                </div>
                <span className="text-sm font-medium tracking-wider">+34 672 119 634</span>
              </a>
              <a href="mailto:contact@lozanorealty.uk" className="flex items-center gap-4 text-white/60 hover:text-white transition-colors group">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
                  <Mail size={14} />
                </div>
                <span className="text-sm font-medium tracking-wider">contact@lozanorealty.uk</span>
              </a>
              <a href="https://instagram.com/lozanorealty.uk" target="_blank" className="flex items-center gap-4 text-white/60 hover:text-white transition-colors group">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
                  <Instagram size={14} />
                </div>
                <span className="text-sm font-medium tracking-wider">@lozanorealty.uk</span>
              </a>
              <a href="https://www.linkedin.com/in/luislozanolozada/" target="_blank" className="flex items-center gap-4 text-white/60 hover:text-white transition-colors group">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
                  <Linkedin size={14} />
                </div>
                <span className="text-sm font-medium tracking-wider">LinkedIn</span>
              </a>
              <div className="flex items-start gap-4 text-white/40">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center mt-0.5">
                  <MapPin size={14} />
                </div>
                <span className="text-sm font-medium tracking-wider leading-relaxed">Marbella, Málaga<br />Costa del Sol, Spain</span>
              </div>
            </div>
          </div>

        </div>

        {/* Divider + Legal */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-white/20 uppercase tracking-widest">
          <span>© 2026 Lozano Realty®. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white/60 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white/60 transition-colors">Legal Notice</a>
            <a href="#" className="hover:text-white/60 transition-colors">Cookies</a>
          </div>
          <span className="font-serif italic normal-case tracking-normal text-white/20">Crafted for Costa del Sol</span>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  const [showContactPopup, setShowContactPopup] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('home');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'team') {
        setCurrentRoute('team');
      } else {
        setCurrentRoute('home');
      }
    };
    
    // Initial check
    handleHashChange();
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="min-h-screen font-sans">
      <Navbar onContactClick={() => setShowContactPopup(true)} currentRoute={currentRoute} />
      
      {currentRoute === 'home' ? (
        <>
          <Hero onContactClick={() => setShowContactPopup(true)} />
          <Properties onContactClick={() => setShowContactPopup(true)} />
          <About />
          <StarProjects />
        </>
      ) : (
        <TeamPage />
      )}
      
      <Footer onContactClick={() => setShowContactPopup(true)} />

      {/* Liquid Glass Contact Popup (Global) */}
      <AnimatePresence>
        {showContactPopup && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowContactPopup(false)}
              className="absolute inset-0 bg-ocean-900/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg md:max-w-4xl bg-white/30 backdrop-blur-[40px] border border-white/40 p-10 md:p-16 rounded-[2.5rem] md:rounded-[4rem] shadow-[0_32px_100px_-20px_rgba(4,47,85,0.4)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Liquid Highlight Effect Overlay */}
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/20 blur-[100px] rounded-full" />
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-ocean-200/20 blur-[100px] rounded-full" />

              <button
                onClick={() => setShowContactPopup(false)}
                className="absolute top-6 right-6 md:top-10 md:right-10 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-ocean-900 hover:bg-white transition-all shadow-sm z-20"
              >
                <X size={20} />
              </button>

              <div className="relative z-10 flex flex-col md:flex-row items-center md:items-stretch gap-12 md:gap-20">
                {/* Profile Section */}
                <div className="flex-1 text-center md:text-left flex flex-col justify-center">
                  <div className="w-20 h-20 md:w-28 md:h-28 bg-white/40 backdrop-blur-xl rounded-3xl mb-8 md:mb-10 flex items-center justify-center shadow-lg border border-white/50 mx-auto md:mx-0">
                    <img src="/assets/logo-blue.png" className="w-12 md:w-16 h-auto" />
                  </div>

                  <h2 className="text-3xl md:text-5xl font-serif text-ocean-900 mb-6 md:mb-8 tracking-tight leading-tight">
                    Luis Felipe <br />
                    <span className="text-ocean-900 font-semibold">Lozano</span>
                  </h2>

                  <div className="pt-6 md:pt-10 border-t border-ocean-900/5 hidden md:block">
                    <span className="text-[10px] uppercase tracking-[0.5em] text-ocean-300">Bespoke Advisory</span>
                  </div>
                </div>

                {/* Contacts Section */}
                <div className="flex-1 w-full space-y-4 text-xs md:text-sm tracking-[0.2em] font-bold text-ocean-900 flex flex-col justify-center">
                  <a href="tel:+34672119634" className="flex items-center justify-center md:justify-start gap-6 py-6 px-8 rounded-[1.5rem] bg-white/50 border border-white/60 hover:bg-white active:scale-[0.98] transition-all shadow-[0_15px_40px_-15px_rgba(4,47,85,0.1)] group">
                    <Phone size={18} className="text-ocean-400 group-hover:text-ocean-900 transition-colors" />
                    +34 672 119 634
                  </a>
                  <a href="mailto:contact@lozanorealty.uk" className="flex items-center justify-center md:justify-start gap-6 py-6 px-8 rounded-[1.5rem] bg-white/50 border border-white/60 hover:bg-white active:scale-[0.98] transition-all shadow-[0_15px_40px_-15px_rgba(4,47,85,0.1)] group text-[10px] md:text-xs">
                    <Mail size={18} className="text-ocean-400 group-hover:text-ocean-900 transition-colors flex-shrink-0" />
                    CONTACT@LOZANOREALTY.UK
                  </a>
                  <a href="https://instagram.com/lozanorealty.uk" target="_blank" className="flex items-center justify-center md:justify-start gap-6 py-6 px-8 rounded-[1.5rem] bg-white/50 border border-white/60 hover:bg-white active:scale-[0.98] transition-all shadow-[0_15px_40px_-15px_rgba(4,47,85,0.1)] group">
                    <Instagram size={18} className="text-ocean-400 group-hover:text-ocean-900 transition-colors" />
                    INSTAGRAM
                  </a>
                  <a href="https://www.linkedin.com/in/luislozanolozada/" target="_blank" className="flex items-center justify-center md:justify-start gap-6 py-6 px-8 rounded-[1.5rem] bg-white/50 border border-white/60 hover:bg-white active:scale-[0.98] transition-all shadow-[0_15px_40px_-15px_rgba(4,47,85,0.1)] group">
                    <Linkedin size={18} className="text-ocean-400 group-hover:text-ocean-900 transition-colors" />
                    LINKEDIN
                  </a>

                  <div className="mt-8 pt-6 border-t border-ocean-900/5 md:hidden text-center">
                    <span className="text-[9px] uppercase tracking-[0.5em] text-ocean-300">Bespoke Advisory</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
