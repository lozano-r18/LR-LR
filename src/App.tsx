import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin, Search, Users, Phone, Mail, Instagram, Facebook, Linkedin,
  ChevronRight, ChevronDown, Menu, X, Home, Award, ShieldCheck,
  ArrowRight, ArrowLeft, Globe, Heart, Layout, Share, Shield, Settings2, RotateCcw,
  Cpu, Landmark, LineChart, FileSignature, Eye, Euro
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
  developmentName?: string;
}

interface PropertyGroup {
  id: string;
  isDevelopment: boolean;
  title: string;
  location: string;
  image: string;
  tag: string;
  price: string;
  priceNumeric: number;
  bedsStr: string;
  bathsStr: string;
  sqft: string;
  properties: Property[];
  type: string;
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
        const validImages = images.filter(url => {
          const u = url.toLowerCase();
          return !u.includes('logo') && !u.includes('plan') && !u.includes('layout') && !u.includes('blueprint') && !u.includes('floor');
        });
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
          sqft: builtArea !== '0' && builtArea ? `${builtArea} m²` : '',
          sqftNumeric: Number(builtArea) || 0,
          image: mainImage,
          images: validImages.slice(0, 15),
          tag: node.new_build == 1 ? "New Build" : "Exclusive",
          type: type,
          description: String(node.desc?.en || node.desc?.es || '').split('. ').slice(0, 2).join('. '),
          url: typeof node.url === 'string' ? node.url : String(node.url?.en || node.url?.es || ''),
          features: Array.isArray(node.features?.feature) ? node.features.feature : [],
          pool: node.pool == 1,
          developmentName: developmentName
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
              }).catch(() => { });
            return;
          }
        } catch (e) { }
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

// --- Huspy Static Listings ---
const huspySpecialListings: Property[] = [
  {
    id: "huspy-1",
    ref: "HUSPY-E54",
    title: "Villa in Monte Mayor",
    location: "Monte Mayor, Benahavís, Málaga",
    town: "Benahavís",
    province: "Málaga",
    price: "€4,400,000",
    priceNumeric: 4400000,
    beds: 5,
    baths: 5,
    sqft: "",
    sqftNumeric: 0,
    image: "/assets/HUSPYVILLA1.webp",
    images: ["/assets/HUSPYVILLA1.webp", "/assets/HUSPYVILLA12.webp", "/assets/HUSPYVILLA13.webp", "/assets/HUSPYVILLA14.webp", "/assets/HUSPYVILLA15.webp", "/assets/HUSPYVILLA16.webp", "/assets/HUSPYVILLA17.webp"],
    tag: "Special Listing - Huspy",
    type: "villa",
    description: "Exclusive villa in Monte Mayor, Benahavís. Outstanding natural setting and premium features. Represented by Huspy.",
    features: ["Private Pool", "Nature Views", "Exclusive Access"],
    pool: true,
    plans: [],
    url: "https://www.huspy.es/comprar/--VILLA-villa-en-venta---benahav-s--m-laga-e54-e437c6da-17c4-411f-abb8-3e028b6e9e54",
    developmentName: ""
  },
  {
    id: "huspy-2",
    ref: "HUSPY-E67",
    title: "Chalet in Alto Urbanización Montemayor",
    location: "Alto Urbanización Montemayor, Benahavís, Málaga",
    town: "Benahavís",
    province: "Málaga",
    price: "€3,950,000",
    priceNumeric: 3950000,
    beds: 5,
    baths: 5,
    sqft: "932 m²",
    sqftNumeric: 932,
    image: "/assets/HUSPYVILLA2.webp",
    images: ["/assets/HUSPYVILLA2.webp", "/assets/HUSPYVILLA21.webp", "/assets/HUSPYVILLA22.webp", "/assets/HUSPYVILLA23.webp", "/assets/HUSPYVILLA24.webp", "/assets/HUSPYVILLA25.webp", "/assets/HUSPYVILLA26.webp"],
    tag: "Special Listing - Huspy",
    type: "villa",
    description: "Independent chalet in Alto Urbanización Montemayor. Expansive 2000m² plot with 932m² built area. Represented by Huspy.",
    features: ["Large Plot", "Private Pool", "Exclusive Area"],
    pool: true,
    plans: [],
    url: "https://www.huspy.es/comprar/--VILLA-villa-en-venta---benahav-s--m-laga-e67-de1a6040-e58c-4d45-80c9-d69672528e67",
    developmentName: ""
  },
  {
    id: "huspy-3",
    ref: "HUSPY-C58",
    title: "Luxury Villa in Eastern Marbella",
    location: "East Marbella, Málaga",
    town: "Marbella",
    province: "Málaga",
    price: "€1,895,000",
    priceNumeric: 1895000,
    beds: 4,
    baths: 4,
    sqft: "453 m²",
    sqftNumeric: 453,
    image: "https://docs-cdn.huspy.net/01KGJ7Y6SE3TSVQGGMRY28YCRV",
    images: [
      "https://docs-cdn.huspy.net/01KGJ7Y6SE3TSVQGGMRY28YCRV",
      "https://docs-cdn.huspy.net/01KGJ7Y6S7E270ZBB571JJ9VEA",
      "https://docs-cdn.huspy.net/01KGJ7Y6SN0K6PF7AGDBX8C872",
      "https://docs-cdn.huspy.net/01KGJ7Y6SW6DC6PY7TS5SAJFVD",
      "https://docs-cdn.huspy.net/01KGJ7Y6T3HRQP69N8ZZ45JKW9",
      "https://docs-cdn.huspy.net/01KGJ7Y6TB0X3AXQZK2GZ10N3R",
      "https://docs-cdn.huspy.net/01KGJ7Y6TMN5F45QJ4QAB58JGT",
      "https://docs-cdn.huspy.net/01KGJ7Y6TWNNF8AJGZXNCZAAAV",
      "https://docs-cdn.huspy.net/01KGJ7Y6V55VZ25FNS3S8CS5NY",
      "https://docs-cdn.huspy.net/01KGJ7Y6VCM1AQ20HRCN8VYZ5T"
    ],
    tag: "Special Listing - Huspy",
    type: "villa",
    description: "A contemporary masterpiece in Eastern Marbella. This luxury villa delivers cutting-edge architecture, refined interiors, and sweeping Mediterranean views. Represented by Huspy.",
    features: ["Private Pool", "Mediterranean Views", "Contemporary Architecture", "Landscaped Garden"],
    pool: true,
    plans: [],
    url: "https://www.huspy.es/comprar/--VILLA-luxury-villa-in-eastern-marbella---a-contemporary-masterpiece-c58-a5e52f9a-d441-4c9f-b326-d6d063fbcc58",
    developmentName: ""
  },
  {
    id: "huspy-4",
    ref: "HUSPY-C29",
    title: "Villa Quinn",
    location: "Marbella, Málaga",
    town: "Marbella",
    province: "Málaga",
    price: "€2,495,000",
    priceNumeric: 2495000,
    beds: 5,
    baths: 5,
    sqft: "593 m²",
    sqftNumeric: 593,
    image: "https://docs-cdn.huspy.net/01KGJ9N15QWRPWT7KP6DS1W4RC",
    images: [
      "https://docs-cdn.huspy.net/01KGJ9N15QWRPWT7KP6DS1W4RC",
      "https://docs-cdn.huspy.net/01KGJ9N15YB8R1NEFR26725FP1",
      "https://docs-cdn.huspy.net/01KGJ9N165VAM841ESSA05MFGS",
      "https://docs-cdn.huspy.net/01KGJ9N16BJT80F8HEAXKYSCNC",
      "https://docs-cdn.huspy.net/01KGJ9N16JEX2VGCH514EZ2MEZ",
      "https://docs-cdn.huspy.net/01KGJ9N1DNFFY6E601MGT6WPAY",
      "https://docs-cdn.huspy.net/01KGJ9N1EE9SDR026GW5WGVA7E",
      "https://docs-cdn.huspy.net/01KGJ9N17CW5FXDMS5F8Q1141M",
      "https://docs-cdn.huspy.net/01KGJ9N17J9N3NKP9GTNQPV98N",
      "https://docs-cdn.huspy.net/01KGJ9N18ZMY14SQ7TFGXA9B24"
    ],
    tag: "Special Listing - Huspy",
    type: "villa",
    description: "Villa Quinn is an exceptional residence in Marbella, offering generous living spaces, premium finishes, and private outdoor areas. Represented by Huspy.",
    features: ["Private Pool", "Garden", "Panoramic Views", "Garage"],
    pool: true,
    plans: [],
    url: "https://www.huspy.es/comprar/--VILLA-villa-quinn---m-laga--marbella-c29-80e9e39a-5df1-4c09-8e6c-287912a0ec29",
    developmentName: ""
  },
  {
    id: "huspy-5",
    ref: "HUSPY-8FB",
    title: "Villa de Lujo, Flamingos Golf",
    location: "Flamingos Golf, Benahavís, Málaga",
    town: "Benahavís",
    province: "Málaga",
    price: "Price on Request",
    priceNumeric: 0,
    beds: 5,
    baths: 5,
    sqft: "634 m²",
    sqftNumeric: 634,
    image: "https://docs-cdn.huspy.net/01KAK55XWY4E441H4BX42RHD16",
    images: [
      "https://docs-cdn.huspy.net/01KAK55XWY4E441H4BX42RHD16",
      "https://docs-cdn.huspy.net/01KAK55Y6PRJ9G5XQR5VYZ8ZQW",
      "https://docs-cdn.huspy.net/01KAK568BNYXEC1M8SG1K4FK8A",
      "https://docs-cdn.huspy.net/01KAK568S6R1NA0D1N4PQQQR06",
      "https://docs-cdn.huspy.net/01KAK5690H74RJDV9X7EGZMJTE",
      "https://docs-cdn.huspy.net/01KAK5697R8GFY1EK5MJE48D1F",
      "https://docs-cdn.huspy.net/01KAK569NN1B7EBNXJ84RDV6YG",
      "https://docs-cdn.huspy.net/01KAK569EDVAJ139SMP72CWZ6A",
      "https://docs-cdn.huspy.net/01KAK569TK8THR7ERZEPMT3KT1",
      "https://docs-cdn.huspy.net/01KAK56A0AYGEPCBHHZTGJF18C"
    ],
    tag: "Special Listing - Huspy",
    type: "villa",
    description: "Luxury villa for rent in the prestigious Flamingos Golf community, Benahavís. Set on a private plot with panoramic golf and sea views. Represented by Huspy.",
    features: ["Flamingos Golf", "Sea Views", "Private Pool", "Gated Community"],
    pool: true,
    plans: [],
    url: "https://www.huspy.es/comprar/--VILLA-villa-de-lujo-en-alquiler---campo-de-golf-flamingos--benahav-s-8fb-60ebe19e-538f-4412-847f-0ef2106c58fb",
    developmentName: ""
  }
];

// --- Custom Components ---

const SmoothImage = ({ src, alt, className = "" }: any) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      <div className={`absolute inset-0 bg-ocean-100/30 animate-pulse transition-opacity duration-500 pointer-events-none ${loaded ? 'opacity-0' : 'opacity-100'}`} />
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        referrerPolicy="no-referrer"
        loading="lazy"
        decoding="async"
        className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  );
};

const HuspyBenefits = () => {
  const benefits = [
    { icon: <Cpu size={24} strokeWidth={1.5} />, title: "AI-powered search", desc: "Smart matching to connect buyers with the right properties faster" },
    { icon: <Landmark size={24} strokeWidth={1.5} />, title: "Instant mortgage access", desc: "Real-time pre-approvals via 25+ banks, at the moment you need them" },
    { icon: <LineChart size={24} strokeWidth={1.5} />, title: "Live market data", desc: "Data-backed valuations and market trends, no guesswork" },
    { icon: <FileSignature size={24} strokeWidth={1.5} />, title: "Digital closing", desc: "Streamlined, paperless transaction process from offer to signature" },
    { icon: <Eye size={24} strokeWidth={1.5} />, title: "Full transparency", desc: "Clients track every step of their transaction in real time" },
    { icon: <Euro size={24} strokeWidth={1.5} />, title: "Best financing rates", desc: "Access to competitive mortgage products tailored for the Spanish market" },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#F5F4EF] border-t border-ocean-900/10">
      <div className="max-w-[1400px] mx-auto px-6 overflow-hidden">
        <h2 className="text-3xl md:text-5xl font-serif text-ocean-900 mb-10 md:mb-16 font-normal tracking-tight">
          Powered by <span className="italic">Huspy</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 w-full">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="group bg-white p-4 md:p-8 border border-ocean-900/10 hover:border-ocean-900/30 transition-all duration-300 hover:shadow-xl flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0 h-full w-full">
              <div className="text-ocean-900 mb-0 md:mb-8 group-hover:scale-110 transition-transform origin-left flex-shrink-0">
                {benefit.icon}
              </div>
              <div className="flex flex-col flex-1">
                <h3 className="font-sans font-bold text-ocean-900 text-[13px] md:text-lg mb-1 md:mb-4 leading-tight uppercase tracking-wide">{benefit.title}</h3>
                <p className="text-ocean-900/70 text-[11px] md:text-sm leading-relaxed mt-auto font-medium">{benefit.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Page Components ---

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
  const navBgClass = forceDark && !isScrolled ? 'py-4 md:py-6 bg-transparent' : (isScrolled ? 'py-3 md:py-5 bg-white shadow-sm' : 'py-4 md:py-8 bg-transparent');
  const btnHover = forceDark || isScrolled ? 'hover:bg-ocean-900 hover:text-white' : 'hover:bg-white hover:text-ocean-900';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navBgClass}`}>
      <div className="max-w-[1400px] mx-auto px-6 flex justify-between items-center relative z-[60]">
        <div className="flex items-center">
          <img
            src={logoSrc}
            alt="Lozano Realty Logo"
            className="h-12 md:h-16 w-auto transition-all duration-300"
          />
        </div>

        {/* Desktop Menu */}
        <div className={`hidden md:flex items-center gap-10 font-sans font-bold text-xs uppercase tracking-[0.2em] ${navTextClass}`}>
          <a href="#home" className="hover:opacity-70 transition-opacity">Home</a>
          <a href="#featured" className="hover:opacity-70 transition-opacity whitespace-nowrap">Featured</a>
          <a href="#properties" className="hover:opacity-70 transition-opacity whitespace-nowrap" onClick={(e) => { e.preventDefault(); const el = document.getElementById('properties'); if (el) window.scrollTo({ top: el.offsetTop - 120, behavior: 'smooth' }); }}>Properties</a>
          <a href="#team" className="hover:opacity-70 transition-opacity whitespace-nowrap">Team</a>
          <button
            onClick={onContactClick}
            className={`px-8 py-3 border border-current rounded-full transition-all ${btnHover}`}
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
            className="absolute top-0 left-0 right-0 bg-[#FAF9F5] shadow-2xl pt-32 pb-12 flex flex-col items-center gap-8 text-ocean-900 font-sans font-bold uppercase tracking-[0.2em] md:hidden z-50 border-b border-ocean-900/10"
          >
            <a href="#home" onClick={() => setIsMobileMenuOpen(false)}>Home</a>
            <a href="#featured" onClick={() => setIsMobileMenuOpen(false)}>Featured</a>
            <a href="#properties" onClick={(e) => { e.preventDefault(); setIsMobileMenuOpen(false); const el = document.getElementById('properties'); if (el) window.scrollTo({ top: el.offsetTop - 120, behavior: 'smooth' }); }}>Properties</a>
            <a href="#team" onClick={() => setIsMobileMenuOpen(false)}>Team</a>
            <button
              className="text-center mt-4 px-12 py-4 bg-ocean-900 text-white border border-ocean-900 rounded-full text-xs transition-all active:scale-95 shadow-lg"
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
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/assets/hero-bg.jpg"
          alt="Luxury Beachside Villa Costa del Sol"
          className="w-full h-full object-cover object-bottom scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ocean-900/60 via-ocean-900/20 to-transparent" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 w-full h-full flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="w-full flex flex-col items-center text-center pt-20"
        >
          <div className="mb-14">
            <h1 className="text-[12vw] md:text-[8vw] font-serif text-white/95 tracking-[0.02em] leading-none uppercase select-none font-medium md:whitespace-nowrap drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] py-2">
              LOZANO REALTY
            </h1>
            <div className="flex items-center justify-center gap-6 mt-4">
              <span className="text-[10px] md:text-xs uppercase tracking-[0.6em] text-white/90 font-bold drop-shadow-md whitespace-nowrap">
                Costa del Sol Real Estate
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-10">
            <div className="max-w-md">
              <p className="text-white/80 text-[11px] md:text-xs font-semibold uppercase tracking-[0.2em] leading-loose drop-shadow-lg">
                Premiering <span className="text-white">New Developments</span> &amp; <br/> Exclusive Lifestyle properties.
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

// Featured Huspy Listings Section (between Hero and Properties)
const FeaturedListings = ({ onContactClick, onPropertyClick }: { onContactClick: () => void, onPropertyClick: (p: any) => void }) => {
  const featuredProperties = huspySpecialListings;

  if (featuredProperties.length === 0) return null;

  return (
    <section id="featured" className="bg-[#F5F4EF] py-16 md:py-20">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4 px-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-ocean-900/50 mb-3">Powered by Huspy</p>
            <h2 className="text-3xl md:text-5xl font-serif text-ocean-900 font-normal tracking-tight">
              Featured <span className="italic">Listings</span>
            </h2>
          </div>
          <button
            onClick={() => { const el = document.getElementById('properties'); if (el) window.scrollTo({ top: el.offsetTop - 120, behavior: 'smooth' }); }}
            className="text-xs uppercase tracking-[0.2em] text-ocean-900 border-b border-ocean-900 pb-1 hover:opacity-60 transition-opacity self-start md:self-end"
          >
            View All Properties →
          </button>
        </div>

        {/* Scrollable Cards Row */}
        <div className="flex gap-4 overflow-x-auto pb-10 px-6 snap-x snap-mandatory hide-scrollbar pt-4">
          {featuredProperties.map((prop, idx) => (
            <motion.div
              key={`${prop.id}-${idx}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className="group relative overflow-hidden flex-shrink-0 w-[80vw] md:w-[45vw] lg:w-[28vw] aspect-[3/4] cursor-pointer bg-[#EBEAE5] shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.3)] transition-all duration-500 rounded-none snap-center"
              onClick={() => onPropertyClick(prop)}
            >
              <img
                src={prop.image}
                alt={prop.title}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

              {/* Huspy Badge */}
              <div className="absolute top-5 left-5 flex items-center gap-2 bg-white px-2.5 py-1.5 z-10 shadow-sm border border-ocean-900/10">
                <img src="/assets/HUSPY-TECH.png.jpeg" alt="Huspy" className="h-3.5 w-auto" referrerPolicy="no-referrer" />
                <span className="text-[8px] uppercase tracking-[0.15em] text-ocean-900 font-bold">Exclusive</span>
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end z-10">
                <p className="text-white/70 text-[9px] uppercase tracking-[0.25em] mb-1.5 font-bold">{prop.location}</p>
                <h3 className="text-xl md:text-2xl font-serif text-white italic mb-5 leading-tight drop-shadow-md">{prop.title}</h3>
                <div className="flex items-end justify-between">
                  <button
                    onClick={(e) => { e.stopPropagation(); onContactClick(); }}
                    className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-5 py-2.5 text-[9px] uppercase tracking-[0.15em] font-bold hover:bg-white hover:text-ocean-900 transition-all shadow-sm"
                  >
                    Enquire
                  </button>
                  <div className="text-right">
                    {prop.priceNumeric > 0 && <div className="text-white/70 font-serif italic text-xs mb-0.5">from</div>}
                    <div className="text-white text-base tracking-tight font-light drop-shadow-md">{prop.price}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Properties = ({ onContactClick, selectedProperty, setSelectedProperty }: { onContactClick: () => void, selectedProperty: Property | null, setSelectedProperty: (p: Property | null) => void }) => {
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
  const [isExpanded, setIsExpanded] = useState(false);
  const itemsPerPage = isExpanded ? 30 : 9;
  const [currentPage, setCurrentPage] = useState(1);
  // Main state
  const [selectedGroup, setSelectedGroup] = useState<PropertyGroup | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  // Touch swipe handling for Lightbox
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe) {
      setActiveImageIndex(prev => Math.min((selectedProperty?.images.length || 1) - 1, prev + 1));
    }
    if (isRightSwipe) {
      setActiveImageIndex(prev => Math.max(0, prev - 1));
    }
  };

  // Property carousel ref & infinite loop handlers
  const propertyCarouselRef = useRef<HTMLDivElement>(null);

  const handleCarouselScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isExpanded) return;
    const container = e.currentTarget;
    const scrollLeft = container.scrollLeft;
    const width = container.clientWidth;
    const scrollWidth = container.scrollWidth;

    if (scrollLeft <= 5) {
      const items = container.children;
      if (items.length > 2) {
        const targetItem = items[items.length - 2] as HTMLElement;
        container.scrollLeft = targetItem.offsetLeft - (width - targetItem.clientWidth) / 2;
      }
    } else if (scrollLeft + width >= scrollWidth - 5) {
      const items = container.children;
      if (items.length > 2) {
        const targetItem = items[1] as HTMLElement;
        container.scrollLeft = targetItem.offsetLeft - (width - targetItem.clientWidth) / 2;
      }
    }
  };

  useEffect(() => {
    if (!isExpanded && propertyCarouselRef.current) {
      const timer = setTimeout(() => {
        const container = propertyCarouselRef.current;
        if (!container) return;
        const items = container.children;
        if (items.length > 1) {
          const firstActualItem = items[1] as HTMLElement;
          container.scrollLeft = firstActualItem.offsetLeft - (container.clientWidth - firstActualItem.clientWidth) / 2;
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isExpanded, filters, currentPage]);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('lr_favorites');
      return saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
    } catch { return new Set<string>(); }
  });

  const toggleFavorite = (propId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(propId)) { next.delete(propId); } else { next.add(propId); }
      try { localStorage.setItem('lr_favorites', JSON.stringify(Array.from(next))); } catch {}
      return next;
    });
  };

  useEffect(() => {
    const fetchHabiHubProperties = async () => {
      try {
        const parsedProperties = await getSharedProperties();
        const combined = [...huspySpecialListings, ...parsedProperties];
        const unique = combined.filter((v,i,a)=>a.findIndex(t=>t.ref === v.ref)===i);
        setProperties(unique);
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
    // Favorited properties appear just below special listings
    const aFav = favorites.has(String(a.id));
    const bFav = favorites.has(String(b.id));
    if (aFav && !bFav) return -1;
    if (bFav && !aFav) return 1;

    if (filters.sortBy === 'price-asc') return a.priceNumeric - b.priceNumeric;
    if (filters.sortBy === 'price-desc') return b.priceNumeric - a.priceNumeric;

    // Default layout prioritizes Villas heavily at the top of the feed to hook viewers,
    // and naturally interleaves the remaining property IDs to break up identical sequential dev blocks.
    if (a.type === 'Villa' && b.type !== 'Villa') return -1;
    if (b.type === 'Villa' && a.type !== 'Villa') return 1;

    return String(b.id).localeCompare(String(a.id));
  });

  const areas = Array.from(new Set(properties.map(p => p.town))).sort();
  const types = Array.from(new Set(properties.map(p => p.type))).sort();

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const groupedProperties = React.useMemo(() => {
    const groupsList: Property[][] = [];
    const groupKeyToIndex = new Map<string, number>();

    filteredProperties.forEach(prop => {
      // Since the feed doesn't provide explicit development names reliably, 
      // properties from the same development always share the exact same main image.
      // We don't group special listings to ensure they show up as distinct.
      const isSpecial = prop.tag.includes("Special Listing");
      const key = (prop.image && !prop.image.includes('unsplash') && !isSpecial) ? `img_${prop.image}_${prop.town}` : `id_${prop.id}`;
      if (groupKeyToIndex.has(key)) {
        groupsList[groupKeyToIndex.get(key)!].push(prop);
      } else {
        groupKeyToIndex.set(key, groupsList.length);
        groupsList.push([prop]);
      }
    });

    return groupsList.map(group => {
      if (group.length > 1) {
        const minPrice = Math.min(...group.map(p => p.priceNumeric).filter(p => p > 0));
        const formattedMinPrice = minPrice > 0 ? `From €${minPrice.toLocaleString()}` : 'Price on Request';
        const beds = Array.from(new Set(group.map(p => p.beds))).sort((a, b) => a - b);
        const bedsStr = beds.length > 1 ? `${beds[0]}-${beds[beds.length - 1]}` : beds[0].toString();
        const baths = Array.from(new Set(group.map(p => p.baths))).sort((a, b) => a - b);
        const bathsStr = baths.length > 1 ? `${baths[0]}-${baths[baths.length - 1]}` : baths[0].toString();
        
        // Find if they all have the same type, otherwise use "Residences"
        const types = Array.from(new Set(group.map(p => p.type)));
        const typeStr = types.length === 1 ? types[0].charAt(0).toUpperCase() + types[0].slice(1) + 's' : 'Residences';

        return {
          id: `dev_${group[0].id}`,
          isDevelopment: true,
          title: `${typeStr} in ${group[0].town}`,
          location: group[0].location,
          image: group[0].image,
          tag: `${group.length} Units`,
          price: formattedMinPrice,
          priceNumeric: minPrice,
          bedsStr: bedsStr,
          bathsStr: bathsStr,
          sqft: 'Various Sizes',
          properties: group,
          type: group[0].type
        };
      } else {
        const p = group[0];
        return {
          id: p.id.toString(),
          isDevelopment: false,
          title: p.title,
          location: p.location,
          image: p.image,
          tag: p.tag,
          price: p.price,
          priceNumeric: p.priceNumeric,
          bedsStr: p.beds.toString(),
          bathsStr: p.baths.toString(),
          sqft: p.sqft,
          properties: group,
          type: p.type
        };
      }
    });
  }, [filteredProperties]);

  const totalPages = Math.ceil(groupedProperties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedGroups = groupedProperties.slice(startIndex, startIndex + itemsPerPage);

  const carouselGroups = React.useMemo(() => {
    if (displayedGroups.length === 0) return [];
    const last = displayedGroups[displayedGroups.length - 1];
    const first = displayedGroups[0];
    return [last, ...displayedGroups, first];
  }, [displayedGroups]);

  // Reset image index when modal opens
  useEffect(() => {
    if (selectedProperty) setActiveImageIndex(0);
  }, [selectedProperty]);

  return (
    <section id="properties" className="pb-32 bg-white">
      <div className="max-w-[1400px] mx-auto px-6 pt-12">
        <div className="mb-12">

          <div className="bg-white pb-10 relative z-20 w-full pt-2">
            <div className="flex flex-wrap lg:flex-nowrap items-stretch bg-white border border-ocean-900/10 shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
              
              {/* Area */}
              <div className="relative group flex-1 min-w-[120px] border-b lg:border-b-0 lg:border-r border-ocean-900/10">
                <select
                  className="w-full h-full py-5 px-6 bg-transparent outline-none text-[10px] uppercase tracking-[0.15em] font-bold text-ocean-900 appearance-none cursor-pointer hover:bg-ocean-50/30 transition-colors"
                  value={filters.area}
                  onChange={(e) => setFilters({ ...filters, area: e.target.value })}
                >
                  <option value="">Area</option>
                  {areas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-ocean-900/30 pointer-events-none" />
              </div>

              {/* Type */}
              <div className="relative group flex-1 min-w-[120px] border-b lg:border-b-0 lg:border-r border-ocean-900/10">
                <select
                  className="w-full h-full py-5 px-6 bg-transparent outline-none text-[10px] uppercase tracking-[0.15em] font-bold text-ocean-900 appearance-none cursor-pointer hover:bg-ocean-50/30 transition-colors"
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                >
                  <option value="">Type</option>
                  {types.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-ocean-900/30 pointer-events-none" />
              </div>

              {/* Beds */}
              <div className="relative group flex-1 min-w-[100px] border-b lg:border-b-0 lg:border-r border-ocean-900/10">
                <select
                  className="w-full h-full py-5 px-6 bg-transparent outline-none text-[10px] uppercase tracking-[0.15em] font-bold text-ocean-900 appearance-none cursor-pointer hover:bg-ocean-50/30 transition-colors"
                  value={filters.beds}
                  onChange={(e) => setFilters({ ...filters, beds: e.target.value })}
                >
                  <option value="">Beds</option>
                  {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}+</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-ocean-900/30 pointer-events-none" />
              </div>

              {/* Baths */}
              <div className="relative group flex-1 min-w-[100px] border-b lg:border-b-0 lg:border-r border-ocean-900/10">
                <select
                  className="w-full h-full py-5 px-6 bg-transparent outline-none text-[10px] uppercase tracking-[0.15em] font-bold text-ocean-900 appearance-none cursor-pointer hover:bg-ocean-50/30 transition-colors"
                  value={filters.baths}
                  onChange={(e) => setFilters({ ...filters, baths: e.target.value })}
                >
                  <option value="">Baths</option>
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}+</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-ocean-900/30 pointer-events-none" />
              </div>

              {/* Min € */}
              <div className="relative group flex-1 min-w-[120px] border-b lg:border-b-0 lg:border-r border-ocean-900/10">
                <select
                  className="w-full h-full py-5 px-6 bg-transparent outline-none text-[10px] uppercase tracking-[0.15em] font-bold text-ocean-900 appearance-none cursor-pointer hover:bg-ocean-50/30 transition-colors"
                  value={filters.priceMin}
                  onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
                >
                  <option value="">Min €</option>
                  {[100000, 250000, 500000, 1000000, 2000000, 5000000].map(p => (
                    <option key={p} value={p}>€{(p / 1000).toFixed(0)}k</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-ocean-900/30 pointer-events-none" />
              </div>

              {/* Max € */}
              <div className="relative group flex-1 min-w-[120px] border-b lg:border-b-0 lg:border-r border-ocean-900/10">
                <select
                  className="w-full h-full py-5 px-6 bg-transparent outline-none text-[10px] uppercase tracking-[0.15em] font-bold text-ocean-900 appearance-none cursor-pointer hover:bg-ocean-50/30 transition-colors"
                  value={filters.priceMax}
                  onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
                >
                  <option value="">Max €</option>
                  {[500000, 1000000, 2000000, 5000000, 10000000, 20000000].map(p => (
                    <option key={p} value={p}>€{(p / 1000000).toFixed(1)}M</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-ocean-900/30 pointer-events-none" />
              </div>

              {/* REF */}
              <div className="relative group flex-1 min-w-[120px] border-b lg:border-b-0 lg:border-r border-ocean-900/10">
                <input
                  type="text"
                  placeholder="REF"
                  className="w-full h-full py-5 px-6 bg-transparent outline-none text-[10px] uppercase tracking-[0.15em] font-bold text-ocean-900 placeholder:text-ocean-900/30 hover:bg-ocean-50/30 focus:bg-ocean-50/30 transition-colors"
                  value={filters.ref}
                  onChange={(e) => setFilters({ ...filters, ref: e.target.value })}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex w-full lg:w-auto h-[60px] lg:h-auto">
                <button
                  className="flex-1 lg:w-32 h-full bg-ocean-900 text-white flex items-center justify-center hover:bg-ocean-800 transition-colors uppercase text-[10px] tracking-[0.2em] font-bold"
                  onClick={() => {
                    const el = document.getElementById('properties');
                    if (el) window.scrollTo({ top: el.offsetTop - 120, behavior: 'smooth' });
                  }}
                  title="Search Properties"
                >
                  <Search size={16} className="mr-2" /> Search
                </button>
                <button
                  className="w-16 h-full bg-ocean-50 text-ocean-900 flex items-center justify-center hover:bg-ocean-100 transition-colors border-l border-ocean-900/10"
                  onClick={() => setFilters({ area: '', type: '', beds: '', baths: '', priceMin: '', priceMax: '', ref: '', sortBy: 'newest' })}
                  title="Clear Filters"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center px-6">
              <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-ocean-400">
                Showing {groupedProperties.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + itemsPerPage, groupedProperties.length)} of {groupedProperties.length} Matches
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

        <motion.div 
          layout
          ref={propertyCarouselRef}
          onScroll={handleCarouselScroll}
          className={!isExpanded ? "flex overflow-x-auto snap-x snap-mandatory gap-6 md:grid md:grid-cols-3 md:gap-10 hide-scrollbar pb-8 -mx-6 px-6 md:mx-0 md:px-0 md:pb-0 md:overflow-visible md:snap-none" : "grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-10"}
        >
          {(!isExpanded ? carouselGroups : displayedGroups).map((group, idx) => (
            <motion.div
              layout
              key={`${group.id}-${idx}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "100px" }}
              transition={{ delay: (idx % 3) * 0.05 }}
              className={`group cursor-pointer relative overflow-hidden rounded-none shadow-md hover:shadow-2xl transition-all bg-white border border-ocean-900/10 ${!isExpanded ? "min-w-[80vw] aspect-[4/5] snap-center shrink-0 md:min-w-0 md:shrink md:snap-none" : "aspect-[3/4] md:aspect-[4/5]"}`}
              onClick={() => {
                if (group.isDevelopment) {
                  setSelectedGroup(group);
                } else {
                  setSelectedProperty(group.properties[0]);
                }
              }}
            >
              <SmoothImage
                src={group.image}
                alt={group.title}
                className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

              <div className={`absolute top-4 right-4 md:top-6 md:right-6 bg-black/40 backdrop-blur-md border border-white/20 rounded-none uppercase tracking-widest font-bold text-white z-10 transition-colors group-hover:bg-black/60 shadow-sm flex items-center justify-center ${!isExpanded ? 'px-4 py-1.5 text-[10px]' : 'px-3 py-1 text-[8px] md:px-4 md:py-1.5 md:text-[10px]'}`}>
                {group.tag}
              </div>

              <div className={`absolute bottom-0 left-0 right-0 flex flex-col justify-end z-10 ${!isExpanded ? 'p-6 md:p-8' : 'p-4 md:p-8'}`}>
                <h3 className={`font-semibold font-sans text-white mb-1 line-clamp-1 drop-shadow-sm ${!isExpanded ? 'text-2xl md:text-3xl' : 'text-lg md:text-3xl'}`}>{group.title}</h3>
                <p className={`text-white/90 font-medium drop-shadow-sm truncate ${!isExpanded ? 'mb-5 text-sm md:text-base' : 'mb-3 text-[10px] md:text-base md:mb-5'}`}>
                  {group.location}
                </p>

                <div className={`flex flex-col ${!isExpanded ? 'gap-2' : 'gap-1.5 md:gap-2'}`}>
                  <div className={`w-fit rounded-none border border-white/20 bg-black/40 backdrop-blur-md text-white font-medium shadow-sm flex items-center justify-center ${!isExpanded ? 'px-4 py-1.5 text-sm' : 'px-2.5 py-1 text-[10px] md:px-4 md:py-1.5 md:text-sm'}`}>
                    {group.price}
                  </div>
                  {!group.isDevelopment && (
                    <div className={`w-fit flex items-center rounded-none border border-white/20 bg-black/40 backdrop-blur-md text-white font-medium shadow-sm ${!isExpanded ? 'px-4 py-1.5 text-sm' : 'px-2.5 py-1 text-[9px] md:px-4 md:py-1.5 md:text-sm'}`}>
                      {!isExpanded && group.sqft && <><span>{group.sqft}</span><span className="mx-2 text-white/60 font-light">|</span></>}
                      <span>{group.bedsStr}<span className="ml-0.5 opacity-70">b</span></span>
                      <span className={`text-white/60 font-light ${!isExpanded ? 'mx-2' : 'mx-1.5 md:mx-2'}`}>|</span>
                      <span>{group.bathsStr}<span className="ml-0.5 opacity-70">ba</span></span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {!isExpanded && groupedProperties.length > 9 ? (
          <div className="mt-20 flex justify-center">
            <button
              onClick={() => setIsExpanded(true)}
              className="group flex items-center gap-5 border-b-2 border-ocean-900 pb-2 text-ocean-900 text-xs font-bold tracking-[0.35em] uppercase hover:gap-8 transition-all duration-300"
            >
              Explore Full Portfolio
              <span className="text-ocean-400 font-normal tracking-normal normal-case text-xs">({groupedProperties.length} listings)</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ) : totalPages > 1 ? (
          <div className="mt-20 flex justify-center items-center gap-2 md:gap-6">
            <button
              onClick={() => {
                setCurrentPage(p => Math.max(1, p - 1));
                setTimeout(() => { const el = document.getElementById('properties'); if (el) window.scrollTo({ top: el.offsetTop - 120, behavior: 'smooth' }); }, 50);
              }}
              disabled={currentPage === 1}
              className="w-12 h-12 md:w-auto md:px-8 md:py-4 bg-white/60 backdrop-blur-xl border border-ocean-200 text-ocean-900 md:text-sm font-bold tracking-widest uppercase hover:bg-ocean-900 hover:text-white transition-all duration-500 flex items-center justify-center gap-3 rounded-full flex-shrink-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] disabled:opacity-40 disabled:cursor-not-allowed group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="hidden md:block">Previous</span>
            </button>
            <span className="text-ocean-900 font-medium text-xs md:text-sm tracking-widest px-4 md:px-6">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => {
                setCurrentPage(p => Math.min(totalPages, p + 1));
                setTimeout(() => { const el = document.getElementById('properties'); if (el) window.scrollTo({ top: el.offsetTop - 120, behavior: 'smooth' }); }, 50);
              }}
              disabled={currentPage === totalPages}
              className="w-12 h-12 md:w-auto md:px-8 md:py-4 bg-white/60 backdrop-blur-xl border border-ocean-200 text-ocean-900 md:text-sm font-bold tracking-widest uppercase hover:bg-ocean-900 hover:text-white transition-all duration-500 flex items-center justify-center gap-3 rounded-full flex-shrink-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] disabled:opacity-40 disabled:cursor-not-allowed group"
            >
              <span className="hidden md:block">Next Page</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ) : null}

        {/* Development Modal */}
        <AnimatePresence>
          {selectedGroup && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedGroup(null)}
                className="absolute inset-0 bg-ocean-900/40 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full h-[100vh] bg-[#F5F4EF] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header Actions */}
                <div className="sticky top-0 z-40 bg-[#F5F4EF]/90 backdrop-blur-xl px-6 py-4 flex justify-between items-center border-b border-ocean-900/10">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ocean-900/50">
                    Development Overview
                  </div>
                  <button
                    onClick={() => setSelectedGroup(null)}
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-ocean-900 hover:bg-ocean-900 hover:text-white transition-all shrink-0 shadow-sm"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-16 md:py-24 font-sans">
                   <div className="mb-16 md:mb-24 flex flex-col items-center text-center">
                     <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-ocean-400 mb-4">
                       {selectedGroup.location} • {selectedGroup.properties.length} Available Units
                     </p>
                     <h2 className="text-4xl md:text-6xl lg:text-[5rem] font-serif text-ocean-900 mb-4 leading-tight">
                       {selectedGroup.title}
                     </h2>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     {selectedGroup.properties.map((prop, idx) => (
                       <motion.div
                         key={prop.id}
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: idx * 0.05 }}
                         className="group cursor-pointer bg-white rounded-none border border-ocean-900/10 shadow-sm hover:shadow-xl transition-all flex flex-col overflow-hidden"
                         onClick={() => setSelectedProperty(prop)}
                       >
                         <div className="relative aspect-[4/3] overflow-hidden">
                           <SmoothImage src={prop.image} alt={prop.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                         </div>
                         <div className="p-6 flex-1 flex flex-col justify-between">
                           <div>
                             <div className="text-xl font-sans text-ocean-900 mb-4 font-light tracking-tight">{prop.price}</div>
                             <div className="flex items-center gap-4 text-xs tracking-widest uppercase font-bold text-ocean-400 mb-6">
                               <span>{prop.beds} Beds</span>
                               <span className="w-1 h-1 rounded-full bg-ocean-200" />
                               <span>{prop.baths} Baths</span>
                               {prop.sqft && (
                                 <>
                                   <span className="w-1 h-1 rounded-full bg-ocean-200" />
                                   <span>{prop.sqft}</span>
                                 </>
                               )}
                             </div>
                           </div>
                           <button className="w-full py-4 bg-[#F5F4EF] text-ocean-900 rounded-none font-bold uppercase tracking-[0.2em] text-[10px] group-hover:bg-ocean-900 group-hover:text-white transition-colors border border-ocean-900/10">
                             View Details
                           </button>
                         </div>
                       </motion.div>
                     ))}
                   </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Property Detail Modal */}
        <AnimatePresence>
          {selectedProperty && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center">
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
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(String(selectedProperty.id)); }}
                      className={`flex items-center gap-2 transition-all active:scale-95 ${favorites.has(String(selectedProperty.id)) ? 'text-rose-500' : 'hover:opacity-60'}`}
                    >
                      <Heart size={18} fill={favorites.has(String(selectedProperty.id)) ? 'currentColor' : 'none'} />
                      <span className="hidden sm:inline">{favorites.has(String(selectedProperty.id)) ? 'Saved' : 'Save'}</span>
                    </button>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const url = `${window.location.origin}${window.location.pathname}#properties?ref=${selectedProperty.ref}`;
                          navigator.clipboard.writeText(url).then(() => {
                            setShareToast(true);
                            setTimeout(() => setShareToast(false), 2500);
                          }).catch(() => {});
                        }}
                        className="flex items-center gap-2 hover:opacity-60 transition-opacity"
                      >
                        <Share size={18} /> <span className="hidden sm:inline">Share</span>
                      </button>
                      {shareToast && (
                        <div className="absolute top-8 left-0 bg-ocean-900 text-white text-[10px] tracking-widest uppercase font-bold px-4 py-2 rounded-lg whitespace-nowrap shadow-xl z-50 animate-fadeIn">
                          Link copied!
                        </div>
                      )}
                    </div>
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
                  <div className="relative mb-8 md:mb-12 rounded-none overflow-hidden group/gallery shadow-xl">
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
                    <div className="md:hidden relative h-[45vh] w-full">
                      <div 
                        className="flex h-full overflow-x-auto snap-x snap-mandatory hide-scrollbar"
                        onScroll={(e) => {
                          const scrollLeft = e.currentTarget.scrollLeft;
                          const width = e.currentTarget.clientWidth;
                          const newIndex = Math.round(scrollLeft / width);
                          if (activeImageIndex !== newIndex) {
                            setActiveImageIndex(newIndex);
                          }
                        }}
                      >
                        {(selectedProperty.images.length > 0 ? selectedProperty.images : [selectedProperty.image]).map((img, i) => (
                          <div
                            key={i}
                            className="min-w-full h-full snap-center shrink-0 flex items-center justify-center bg-ocean-950"
                            onClick={() => { setActiveImageIndex(i); setIsLightboxOpen(true); }}
                          >
                            <img src={img} loading="lazy" decoding="async" className="max-w-full max-h-full object-contain cursor-zoom-in" referrerPolicy="no-referrer" />
                          </div>
                        ))}
                      </div>

                      {/* Carousel Controls */}
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center px-4 items-center pointer-events-none">
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-full pointer-events-auto shadow-lg flex items-center gap-3">
                          <span className="flex gap-1.5">{(selectedProperty.images.length > 0 ? selectedProperty.images : [selectedProperty.image]).map((_, i) => (
                            <span key={i} className={`block rounded-full transition-all duration-300 ${i === (activeImageIndex || 0) ? 'w-2 h-2 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`} />
                          ))}</span>
                          <span className="h-3 w-px bg-white/20" />
                          <span className="text-white/80 text-[9px] uppercase tracking-widest font-semibold">tap to expand</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 item-start">
                    {/* Main Content */}
                    <div className="lg:col-span-8">
                      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                        <div>
                          <h2 className="text-4xl md:text-6xl lg:text-[5rem] font-sans text-ocean-900 mb-2 leading-none tracking-tight font-light">
                            {selectedProperty.price}
                          </h2>
                        </div>

                        <div className="flex gap-8 md:gap-12 flex-wrap">
                          {selectedProperty.sqftNumeric > 0 && (
                            <div>
                              <div className="text-2xl md:text-5xl font-light text-ocean-900">{selectedProperty.sqftNumeric} <span className="text-xs md:text-base text-ocean-300">m²</span></div>
                              <div className="text-[9px] md:text-[10px] text-ocean-400 uppercase tracking-widest font-bold mt-1 md:mt-2">Surface</div>
                            </div>
                          )}
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
                              className="px-10 py-5 bg-white text-ocean-900 rounded-none text-xs font-bold tracking-[0.2em] uppercase hover:bg-ocean-50/50 transition-all shadow-xl"
                            >
                              Get Floor Plans
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact Sidebar */}
                    <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit">
                      <div className="bg-[#F5F4EF] rounded-none p-10 border border-ocean-900/10 shadow-lg">
                        <div className="flex items-center gap-6 mb-10 pb-10 border-b border-ocean-900/10">
                          <div className="w-16 h-16 rounded-none bg-white flex items-center justify-center shadow-sm border border-ocean-900/10">
                            <img src="/assets/logo-blue.png" className="w-10 h-auto" />
                          </div>
                          <div>
                            <div className="text-[10px] text-ocean-400 uppercase tracking-[0.3em] font-bold mb-1.5">Listed By</div>
                            <div className="text-xl font-serif text-ocean-900 italic">Lozano Realty</div>
                          </div>
                        </div>
                        
                        <div className="space-y-6 mb-10">
                           <div className="flex flex-col gap-1">
                             <div className="text-[9px] text-ocean-400 uppercase tracking-widest font-bold">Contact Number</div>
                             <a href="tel:+34600000000" className="text-lg font-sans text-ocean-900 font-light hover:opacity-60 transition-opacity tracking-tight">+34 666 845 282</a>
                           </div>
                           <div className="flex flex-col gap-1">
                             <div className="text-[9px] text-ocean-400 uppercase tracking-widest font-bold">Email Address</div>
                             <a href="mailto:contact@lozanorealty.uk" className="text-sm font-sans text-ocean-900 hover:opacity-60 transition-opacity">contact@lozanorealty.uk</a>
                           </div>
                        </div>

                        <button
                          onClick={onContactClick}
                          className="w-full py-5 bg-ocean-900 text-white rounded-none font-bold tracking-[0.2em] uppercase text-[10px] hover:bg-white hover:text-ocean-900 hover:border-ocean-900 transition-all shadow-xl border border-transparent"
                        >
                          Enquire Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Full-Screen Lightbox Gallery */}
        <AnimatePresence>
          {isLightboxOpen && selectedProperty && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-ocean-900/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 md:p-0"
              onClick={() => setIsLightboxOpen(false)}
            >
              <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-ocean-900/60 to-transparent">
                <div className="text-white/70 text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase">
                  {selectedProperty.title} <span className="mx-4 text-white/20">|</span> {activeImageIndex + 1} / {selectedProperty.images.length || 1}
                </div>
                <button
                  onClick={() => setIsLightboxOpen(false)}
                  className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-ocean-900 transition-all border border-white/10"
                >
                  <X size={24} />
                </button>
              </div>

              <div 
                className="relative w-full h-full flex items-center justify-center p-4 md:py-12 md:px-6" 
                onClick={() => setIsLightboxOpen(false)}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <div className="relative w-full h-full max-w-[1400px] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeImageIndex}
                      initial={{ opacity: 0, scale: 0.98, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.98, x: -20 }}
                      src={(selectedProperty.images.length > 0 ? selectedProperty.images : [selectedProperty.image])[activeImageIndex]}
                      className="max-w-full max-h-[75vh] md:max-h-full object-contain shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] rounded-2xl bg-ocean-900/20"
                      referrerPolicy="no-referrer"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </AnimatePresence>

                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveImageIndex(prev => Math.max(0, prev - 1)); }}
                    className="absolute left-2 md:left-6 w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-ocean-900 transition-all group"
                  >
                    <ChevronDown size={28} className="rotate-90 group-hover:-translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveImageIndex(prev => Math.min((selectedProperty.images.length || 1) - 1, prev + 1)); }}
                    className="absolute right-2 md:right-6 w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-ocean-900 transition-all group"
                  >
                    <ChevronDown size={28} className="-rotate-90 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
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
        </div>
      </div>

    </div>
  );
};
const ProcessSection = () => {
  const steps = [
    { num: '01', title: 'Consultation & Sourcing', desc: 'We analyze your needs and scan the entire Costa del Sol market, including off-market luxury listings.' },
    { num: '02', title: 'Curated Viewings', desc: 'Virtual or in-person tours of handpicked properties that match your exact specifications.' },
    { num: '03', title: 'Due Diligence', desc: 'Our legal partners conduct rigorous checks on ownership, debts, and developer reputation.' },
    { num: '04', title: 'Acquisition', desc: 'We negotiate the best terms and handle all paperwork, ensuring a secure and transparent transaction.' },
    { num: '05', title: 'Post-Sale Support', desc: 'From interior design to property management, our service continues long after you get the keys.' }
  ];

  return (
    <section className="hidden md:block py-24 bg-[#F5F4EF]">
      <div className="max-w-[1400px] mx-auto px-6">
        <h2 className="text-3xl md:text-5xl font-serif text-ocean-900 mb-16 font-normal tracking-tight">
          From Request to <span className="italic">Result</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {steps.map((step, idx) => (
            <div key={idx} className="group bg-white p-8 border border-ocean-900/10 hover:border-ocean-900/30 transition-all duration-300 hover:shadow-xl flex flex-col h-full">
              <span className="text-ocean-300 font-serif text-4xl italic mb-6 block group-hover:text-ocean-900 transition-colors">{step.num}</span>
              <h3 className="font-sans font-bold text-ocean-900 text-lg mb-4 leading-tight uppercase tracking-wide">{step.title}</h3>
              <p className="text-ocean-700/80 text-sm leading-relaxed mt-auto font-medium">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FAQSection = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const faqs = [
    { q: "How can I be sure the property is legally verified?", a: "We only work with properties that have passed a full legal check: we verify ownership rights, debts, restrictions, developer reputation, and deal history. Each transaction is supervised by a lawyer with experience in 100+ deals." },
    { q: "Can I buy property in Spain if I'm from the UK?", a: "Absolutely. UK buyers are some of the most active in the Costa del Sol. You will need an NIE (Foreigner Identity Number) and a Spanish bank account, both of which we assist you in obtaining effortlessly." },
    { q: "Do I need to be present in person for the paperwork?", a: "No. With a Power of Attorney (POA) granted to your legal representative, the entire purchase process can be completed on your behalf without you having to travel to Spain." },
    { q: "Can I rent out the property after I buy it?", a: "Yes, renting out your property is a great investment strategy. We can advise on areas with the best ROI and connect you with premium property management services." },
    { q: "I don't understand Spanish legal details, who will explain everything?", a: "Our dedicated network of English-speaking legal experts will guide you through every contract, tax obligation, and legal nuance before you sign anything." }
  ];

  return (
    <section className="py-24 bg-[#F5F4EF]">
      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
        {/* Left */}
        <div className="flex flex-col">
          <h2 className="text-4xl md:text-6xl font-sans text-ocean-900 uppercase tracking-tighter leading-[0.9] font-medium mb-2">
            GOT QUESTIONS?
          </h2>
          <h3 className="text-3xl md:text-5xl font-serif text-ocean-900 italic lowercase tracking-tight mb-12">
            we've got you
          </h3>
          <div className="overflow-hidden aspect-[4/3] w-full max-w-lg">
            <img src="/assets/faq-night.jpg" alt="Luxury Villa at Night" className="w-full h-full object-cover" />
          </div>
          <p className="font-serif italic text-ocean-900/70 text-lg md:text-xl mt-8 max-w-sm">
            « We believe real estate should feel simple. We make it that way »
          </p>
        </div>

        {/* Right */}
        <div className="flex flex-col justify-center">
          <p className="text-right text-xs uppercase tracking-widest text-ocean-900/60 font-bold mb-12 hidden lg:block">
            We've gathered answers to <br/> everything you might be <br/> wondering about
          </p>
          <div className="flex flex-col border-t border-ocean-900/20">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border-b border-ocean-900/20 py-6">
                <button 
                  className="w-full flex items-center justify-between text-left group"
                  onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                >
                  <span className="font-sans text-base md:text-lg font-medium text-ocean-900 group-hover:text-black transition-colors pr-8">
                    {faq.q}
                  </span>
                  <div className={`w-8 h-8 rounded-full border border-ocean-900/30 flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${openIdx === idx ? 'rotate-180' : ''}`}>
                    <ChevronDown size={14} className="text-ocean-900" />
                  </div>
                </button>
                <AnimatePresence>
                  {openIdx === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="text-ocean-900/70 text-sm leading-relaxed mt-4 max-w-2xl font-medium">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const CTAFormSection = ({ onContactClick }: { onContactClick: () => void }) => {
  return (
    <section className="relative min-h-[600px] flex items-center overflow-hidden bg-ocean-950">
      <div className="absolute inset-0 z-0">
        <img src="/assets/cta-day.jpg" alt="Luxury Villa" className="w-full h-full object-cover opacity-60 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-r from-ocean-950 via-ocean-950/80 to-transparent" />
      </div>
      
      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 py-24 flex flex-col lg:flex-row justify-between items-center gap-16">
        
        {/* Left */}
        <div className="flex-1 text-white">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white leading-tight tracking-tight mb-12 font-normal">
            Finding a new home isn't easy.<br/>
            <span className="italic text-white/90">We know that.</span>
          </h2>
          <div className="text-3xl md:text-5xl font-sans tracking-tight font-light mb-4">
            +34 666 845 282
          </div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/50 font-bold">
            Contact us directly or leave a request
          </p>
        </div>

        {/* Right (Form Panel) */}
        <div className="w-full max-w-md bg-white/95 backdrop-blur-xl p-8 md:p-12 shadow-2xl rounded-none">
          <div className="flex flex-col mb-8">
            <h4 className="font-serif italic text-3xl text-ocean-900 mb-2">Lozano Realty</h4>
            <div className="w-12 h-px bg-ocean-900/20" />
          </div>

          <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); onContactClick(); }}>
            <input type="text" placeholder="Full Name" required className="bg-transparent border-b border-ocean-900/20 w-full px-0 py-3 text-sm focus:outline-none focus:border-ocean-900 text-ocean-900 placeholder:text-ocean-900/40 transition-colors" />
            <input type="email" placeholder="Email Address" required className="bg-transparent border-b border-ocean-900/20 w-full px-0 py-3 text-sm focus:outline-none focus:border-ocean-900 text-ocean-900 placeholder:text-ocean-900/40 transition-colors" />
            <input type="tel" placeholder="Phone Number" required className="bg-transparent border-b border-ocean-900/20 w-full px-0 py-3 text-sm focus:outline-none focus:border-ocean-900 text-ocean-900 placeholder:text-ocean-900/40 transition-colors" />
            
            <button type="submit" className="mt-6 bg-ocean-900 text-white uppercase text-[10px] tracking-[0.2em] font-bold py-5 hover:bg-ocean-800 transition-colors shadow-lg">
              SEND REQUEST
            </button>
            <div className="mt-2 text-center">
              <a href="https://wa.me/34666845282" target="_blank" rel="noreferrer" className="text-[10px] text-ocean-900/50 hover:text-ocean-900 transition-colors uppercase tracking-[0.2em] font-bold underline">
                WhatsApp Us
              </a>
            </div>
          </form>
        </div>

      </div>
    </section>
  );
};

const Footer = ({ onContactClick }: { onContactClick: () => void }) => {
  return (
    <footer className="bg-ocean-900 text-white">

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-6 pt-20 pb-10">

        {/* Top Row: Brand + Nav */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-16 pb-16 border-b border-white/10">

          {/* Brand */}
          <div className="flex flex-col gap-6 max-w-xs">
            <img src="/assets/logo-white.png" alt="Lozano Realty" className="h-16 w-auto self-start" />
            <p className="text-white/40 text-xs font-light leading-relaxed tracking-wide">
              Exclusive property advisory across the Costa del Sol.
              Curated estates. Bespoke service.
            </p>
          </div>

          {/* Nav Columns */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12 text-xs">

            <div className="flex flex-col gap-5">
              <span className="text-white/30 uppercase tracking-[0.4em] text-[9px] font-bold border-b border-white/10 pb-3">Navigate</span>
              <a href="#home" className="text-white/60 hover:text-white transition-colors uppercase tracking-widest">Home</a>
              <a href="#properties" onClick={(e) => { e.preventDefault(); const el = document.getElementById('properties'); if (el) window.scrollTo({ top: el.offsetTop - 120, behavior: 'smooth' }); }} className="text-white/60 hover:text-white transition-colors uppercase tracking-widest">Properties</a>
              <a href="#team" className="text-white/60 hover:text-white transition-colors uppercase tracking-widest">Team</a>
              <button onClick={onContactClick} className="text-left text-white/60 hover:text-white transition-colors uppercase tracking-widest">Contact</button>
            </div>

            <div className="flex flex-col gap-5">
              <span className="text-white/30 uppercase tracking-[0.4em] text-[9px] font-bold border-b border-white/10 pb-3">Contact</span>
              <a href="tel:+34672119634" className="text-white/60 hover:text-white transition-colors tracking-wide">+34 672 119 634</a>
              <a href="mailto:contact@lozanorealty.uk" className="text-white/60 hover:text-white transition-colors tracking-wide break-all">contact@lozanorealty.uk</a>
              <span className="text-white/40 tracking-wide leading-relaxed">Marbella, Málaga<br />Costa del Sol</span>
            </div>

            <div className="flex flex-col gap-5">
              <span className="text-white/30 uppercase tracking-[0.4em] text-[9px] font-bold border-b border-white/10 pb-3">Social</span>
              <a href="https://www.instagram.com/luis_lozano_realty?igsh=aDkwNGsyMmw5cHcz" target="_blank" className="text-white/60 hover:text-white transition-colors uppercase tracking-widest">Instagram</a>
              <a href="https://www.linkedin.com/in/luislozanolozada/" target="_blank" className="text-white/60 hover:text-white transition-colors uppercase tracking-widest">LinkedIn</a>
              <a href="mailto:contact@lozanorealty.uk" className="text-white/60 hover:text-white transition-colors uppercase tracking-widest">Email</a>
            </div>

          </div>
        </div>

        {/* Bottom Row: Legal */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-[9px] text-white/25 uppercase tracking-[0.3em]">
          <span>© 2026 Lozano Realty®. All rights reserved.</span>
          <div className="flex gap-8">
            <a href="/privacy" className="hover:text-white/60 transition-colors">Privacy</a>
            <a href="/legal" className="hover:text-white/60 transition-colors">Legal</a>
            <a href="/cookies" className="hover:text-white/60 transition-colors">Cookies</a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default function App() {
  const [currentRoute, setCurrentRoute] = useState('home');
  const [showContactPopup, setShowContactPopup] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

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
    <div className="bg-white min-h-screen font-sans selection:bg-ocean-900 selection:text-white">
      <Navbar onContactClick={() => setShowContactPopup(true)} currentRoute={currentRoute} />

      {currentRoute === 'home' ? (
        <>
          <Hero onContactClick={() => setShowContactPopup(true)} />
          <FeaturedListings onContactClick={() => setShowContactPopup(true)} onPropertyClick={setSelectedProperty} />
          <Properties onContactClick={() => setShowContactPopup(true)} selectedProperty={selectedProperty} setSelectedProperty={setSelectedProperty} />
          <HuspyBenefits />
          <CTAFormSection onContactClick={() => setShowContactPopup(true)} />
        </>
      ) : (
        <TeamPage />
      )}

      <Footer onContactClick={() => setShowContactPopup(true)} />

      {/* Editorial Contact Popup */}
      <AnimatePresence>
        {showContactPopup && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowContactPopup(false)}
              className="absolute inset-0 bg-ocean-950/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="relative w-full max-w-lg md:max-w-3xl bg-[#FAF9F5] shadow-2xl overflow-hidden flex flex-col md:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left: Image Panel */}
              <div className="hidden md:block md:w-2/5 relative">
                <img src="/assets/logo-blue.png" alt="" className="absolute top-8 left-8 h-10 w-auto z-10" />
                <img src="/assets/faq-night.jpg" alt="Lozano Realty" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-ocean-900/40" />
                <div className="absolute bottom-8 left-8 right-8">
                  <p className="text-white/60 text-[9px] uppercase tracking-[0.4em] font-bold mb-2">Bespoke Advisory</p>
                  <h2 className="text-2xl font-serif text-white italic leading-tight">Luis Felipe<br/>Lozano</h2>
                </div>
              </div>

              {/* Right: Contact Panel */}
              <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
                <button
                  onClick={() => setShowContactPopup(false)}
                  className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center text-ocean-900/50 hover:text-ocean-900 transition-colors"
                >
                  <X size={20} />
                </button>

                <p className="text-[9px] uppercase tracking-[0.4em] text-ocean-900/50 font-bold mb-8">Get in Touch</p>

                <div className="space-y-4 text-xs md:text-sm font-bold text-ocean-900 tracking-[0.15em] uppercase">
                  <a href="tel:+34672119634" className="flex items-center gap-4 py-5 px-6 bg-white border border-ocean-900/10 hover:border-ocean-900/30 hover:shadow-md transition-all group">
                    <Phone size={16} className="text-ocean-900/40 group-hover:text-ocean-900 transition-colors flex-shrink-0" />
                    +34 672 119 634
                  </a>
                  <a href="mailto:contact@lozanorealty.uk" className="flex items-center gap-4 py-5 px-6 bg-white border border-ocean-900/10 hover:border-ocean-900/30 hover:shadow-md transition-all group text-[10px]">
                    <Mail size={16} className="text-ocean-900/40 group-hover:text-ocean-900 transition-colors flex-shrink-0" />
                    CONTACT@LOZANOREALTY.UK
                  </a>
                  <a href="https://wa.me/34672119634" target="_blank" rel="noreferrer" className="flex items-center gap-4 py-5 px-6 bg-ocean-900 text-white hover:bg-ocean-800 transition-all group">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WHATSAPP
                  </a>
                  <a href="https://www.instagram.com/luis_lozano_realty?igsh=aDkwNGsyMmw5cHcz" target="_blank" className="flex items-center gap-4 py-5 px-6 bg-white border border-ocean-900/10 hover:border-ocean-900/30 hover:shadow-md transition-all group">
                    <Instagram size={16} className="text-ocean-900/40 group-hover:text-ocean-900 transition-colors flex-shrink-0" />
                    INSTAGRAM
                  </a>
                  <a href="https://www.linkedin.com/in/luislozanolozada/" target="_blank" className="flex items-center gap-4 py-5 px-6 bg-white border border-ocean-900/10 hover:border-ocean-900/30 hover:shadow-md transition-all group">
                    <Linkedin size={16} className="text-ocean-900/40 group-hover:text-ocean-900 transition-colors flex-shrink-0" />
                    LINKEDIN
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
