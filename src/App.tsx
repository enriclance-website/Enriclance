import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingCart, Menu, X,
  Leaf, TreePine, Star, Truck, Shield, RotateCcw, User,
  MapPin, Phone, Mail, CheckCircle, Package, ArrowLeft,
  ChevronRight, Lock, Award,
  Droplets, Clock, Waves, Calendar, Sparkles,
  TrendingUp, Zap, Sun
} from 'lucide-react';
import { useState } from 'react';

declare global {
  interface Window { Razorpay: any; }
}

const LOGO_URL = '/input_file_2.png';
const BOTTLE_HERO_URL = 'https://i.pinimg.com/736x/17/11/fb/1711fb6ae471b1d57f73b6ab75a2c325.jpg';
// Set VITE_RAZORPAY_KEY in your Vercel environment variables
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY ?? 'rzp_test_YOUR_KEY_HERE';

const INGREDIENTS = [
  {
    name: 'Amla (Indian Gooseberry)',
    url: 'https://i.pinimg.com/736x/74/e6/3a/74e63a37b22894bc3621d81c9ca7c623.jpg',
    benefit: 'Rich in Vitamin C, it strengthens hair follicles and prevents premature graying.'
  },
  {
    name: 'Hibiscus',
    url: 'https://i.pinimg.com/736x/ff/c3/d6/ffc3d6d715d26b4ca561d6db50616247.jpg',
    benefit: 'Acts as a natural conditioner, promoting hair growth and adding volume and shine.'
  },
  {
    name: 'Bhringraj',
    url: 'https://i.pinimg.com/736x/d8/30/62/d830622d98081e04c1f1ad9bf79cb35e.jpg',
    benefit: 'Known as the "King of Herbs" for hair, it rejuvenates the scalp and helps prevent hair loss.'
  },
  {
    name: 'Brahmi',
    url: 'https://i.pinimg.com/736x/cd/92/94/cd9294b32052ab6f7fb7672db8b40a45.jpg',
    benefit: 'Strengthens hair roots and provides deep nourishment to the scalp.'
  },
  {
    name: 'Neem',
    url: 'https://i.pinimg.com/736x/e6/2f/85/e62f85fc9256558a31c94e64c5682cab.jpg',
    benefit: 'Offers antibacterial and antifungal properties to fight dandruff and maintain scalp health.'
  },
  {
    name: 'Coconut Oil Base',
    url: 'https://i.pinimg.com/736x/bf/0a/44/bf0a4474d1bceb5680b01ab1bbaea7d7.jpg',
    benefit: 'Provides essential fatty acids that moisturize the hair and prevent breakage.'
  }
];

type Page = 'home' | 'aboutPage' | 'cart' | 'checkout' | 'thankyou';

interface CartItem {
  id: number;
  name: string;
  volume: string;
  price: string;
  image: string;
  quantity: number;
  [key: string]: any;
}

interface CheckoutFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
}

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [logoLoaded, setLogoLoaded] = useState(true);
  const [checkoutForm, setCheckoutForm] = useState<CheckoutFormData>({
    name: '', email: '', phone: '', address: '', city: '', pincode: ''
  });
  const [orderDetails, setOrderDetails] = useState<{
    items: CartItem[];
    total: number;
    cgst: number;
    sgst: number;
    grandTotal: number;
    paymentId: string;
    form: CheckoutFormData;
  } | null>(null);
  const [currency, setCurrency] = useState<'INR' | 'USD' | 'EUR' | 'GBP'>('INR');
  const [activeTimeline, setActiveTimeline] = useState(0);

  const navigate = (page: Page) => {
    setCurrentPage(page);
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToShop = () => {
    setCurrentPage('home');
    setIsMenuOpen(false);
    setTimeout(() => {
      document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  };

  const CURRENCIES = {
    INR: { symbol: '₹', label: 'INR', rate: 1 },
    USD: { symbol: '$', label: 'USD', rate: 0.012 },
    EUR: { symbol: '€', label: 'EUR', rate: 0.011 },
    GBP: { symbol: '£', label: 'GBP', rate: 0.0095 },
  } as const;

  const getPriceNum = (price: string) =>
    parseInt(String(price).replace(/[^0-9]/g, '')) || 0;

  const getTotal = () =>
    cartItems.reduce((sum, item) => sum + getPriceNum(item.price) * item.quantity, 0);

  const getCGST = () => Math.round(getTotal() * 0.09);
  const getSGST = () => Math.round(getTotal() * 0.09);
  const getGrandTotal = () => getTotal() + getCGST() + getSGST();

  const fmtCur = (inr: number) => {
    const c = CURRENCIES[currency];
    const val = inr * c.rate;
    return currency === 'INR'
      ? `₹${Math.round(val).toLocaleString('en-IN')}`
      : `${c.symbol}${val.toFixed(2)}`;
  };

  const updateCartQuantity = (productId: number, delta: number) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  };

  const removeCartItem = (productId: number) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const addToCart = (product: any) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = getTotal();

    if (!window.Razorpay) {
      alert('Payment gateway is loading. Please wait a moment and try again.');
      return;
    }

    const cgst = getCGST();
    const sgst = getSGST();
    const grandTotal = getGrandTotal();

    const options = {
      key: RAZORPAY_KEY,
      amount: grandTotal * 100,
      currency: 'INR',
      name: 'Enriclance',
      description: 'Adivasi Herbal Hair Oil',
      image: LOGO_URL,
      handler: (response: { razorpay_payment_id: string }) => {
        setOrderDetails({
          items: [...cartItems],
          total,
          cgst,
          sgst,
          grandTotal,
          paymentId: response.razorpay_payment_id,
          form: { ...checkoutForm },
        });
        setCartItems([]);
        navigate('thankyou');
      },
      prefill: {
        name: checkoutForm.name,
        email: checkoutForm.email,
        contact: checkoutForm.phone,
      },
      notes: {
        address: `${checkoutForm.address}, ${checkoutForm.city} - ${checkoutForm.pincode}`,
      },
      theme: { color: '#2D4C3A' },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response: any) => {
      alert(`Payment failed: ${response.error.description}. Please try again.`);
    });
    rzp.open();
  };

  const products = [
    {
      id: 1,
      name: 'Enriclance Adivasi Hair Oil',
      volume: '250 ml',
      price: '₹799',
      shippingNote: 'including shipping',
      originalPrice: '₹999',
      discount: '20%',
      image: 'https://lh3.googleusercontent.com/d/1u2Jf9BlTgUeY_UZ0rQU5Nk6CQwfvia0R=w500',
      description:
        'Authentic Adivasi tradition in a bottle. A concentrated blend that deeply nourishes the scalp, reduces hair fall, and promotes natural shine. Ideal for daily maintenance and effective on damaged or thinning hair.',
      rating: 4.8,
      reviews: 342,
      inStock: true,
      bestseller: true,
    },
    {
      id: 2,
      name: 'Enriclance Adivasi Hair Oil',
      volume: '500 ml',
      price: '₹1399',
      shippingNote: 'including shipping',
      originalPrice: '₹1799',
      discount: '22%',
      image: 'https://lh3.googleusercontent.com/d/1u2Jf9BlTgUeY_UZ0rQU5Nk6CQwfvia0R=w500',
      description:
        'Our premium value pack formulated for long-term hair health and intensive root rejuvenation. Rich in traditional herbs, it strengthens roots, reduces breakage and improves overall hair density with regular use.',
      rating: 4.9,
      reviews: 289,
      inStock: true,
      bestseller: true,
    },
  ];

  const testimonials = [
    {
      name: 'Priya Sharma',
      location: 'Bangalore',
      text: 'After 3 months of using Enriclance, my hair has transformed! The hair fall has reduced significantly and my scalp feels so much healthier.',
    },
    {
      name: 'Rajesh Kumar',
      location: 'Mumbai',
      text: 'Authentic quality. The results are visible within weeks. This is truly premium Ayurvedic oil crafted with care.',
    },
    {
      name: 'Ananya Mehta',
      location: 'Delhi',
      text: 'Best investment for my hair care routine. Natural, effective, and the herbal aroma is so soothing.',
    },
  ];

  const inputCls =
    'w-full bg-white/10 border border-white/25 rounded-2xl px-5 py-3.5 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all';

  return (
    <div className="min-h-screen bg-brand-paper selection:bg-brand-leaf selection:text-white relative overflow-x-hidden">
      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-brand-leaf/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] left-[-10%] w-[30%] h-[30%] bg-brand-sage/10 rounded-full blur-[80px]" />
        <div className="absolute top-[40%] right-[30%] w-[20%] h-[20%] bg-brand-gold/5 rounded-full blur-[120px]" />
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute top-20 -right-20 text-brand-leaf/5"
        >
          <Leaf size={400} strokeWidth={0.5} />
        </motion.div>
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-40 -left-20 text-brand-leaf/5"
        >
          <TreePine size={500} strokeWidth={0.5} />
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-2xl border-b border-brand-leaf/8 shadow-[0_1px_24px_rgba(45,76,58,0.07)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">

            {/* Logo */}
            <div className="flex items-center cursor-pointer flex-shrink-0" onClick={() => navigate('home')}>
              {logoLoaded ? (
                <img
                  src={LOGO_URL}
                  alt="Enriclance"
                  onError={() => setLogoLoaded(false)}
                  className="w-16 md:w-28 h-auto object-contain"
                />
              ) : (
                <span className="font-serif text-xl text-brand-leaf font-bold tracking-wide">Enriclance</span>
              )}
            </div>

            {/* Desktop — centre links */}
            <div className="hidden md:flex items-center gap-8 lg:gap-10 absolute left-1/2 -translate-x-1/2">
              {[
                { label: 'Home', action: () => navigate('home'), active: currentPage === 'home', href: '#home' },
                { label: 'About', action: () => navigate('aboutPage'), active: currentPage === 'aboutPage', href: '#about-page' },
                { label: 'Usage', action: () => navigate('home'), active: false, href: '#usage' },
                { label: 'Shop', action: () => navigate('home'), active: false, href: '#shop' },
              ].map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={link.action}
                  className={`relative text-[10px] uppercase tracking-[0.22em] font-semibold transition-colors duration-200 pb-0.5
                    ${link.active ? 'text-brand-leaf' : 'text-brand-bark/60 hover:text-brand-leaf'}
                    after:content-[''] after:absolute after:bottom-[-3px] after:left-0 after:h-[1.5px] after:bg-brand-gold after:transition-all after:duration-300
                    ${link.active ? 'after:w-full' : 'after:w-0 hover:after:w-full'}`}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Desktop — cart button */}
            <div className="hidden md:flex items-center">
              <motion.button
                onClick={() => navigate('cart')}
                whileHover={{ scale: 1.04, boxShadow: '0 4px 18px rgba(45,76,58,0.18)' }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                className="relative flex items-center gap-2 px-4 py-2 rounded-full border border-brand-leaf/20 bg-brand-leaf/5 hover:bg-brand-leaf hover:border-brand-leaf hover:text-white text-brand-bark/70 transition-colors duration-250 group"
                aria-label="Cart"
              >
                <ShoppingCart size={15} strokeWidth={1.8} className="group-hover:text-white transition-colors" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold group-hover:text-white transition-colors">
                  Cart
                </span>
                {cartItems.length > 0 && (
                  <motion.span
                    key={cartItems.length}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="ml-0.5 min-w-[18px] h-[18px] px-1 bg-brand-gold text-white text-[8px] rounded-full flex items-center justify-center font-bold"
                  >
                    {cartItems.length}
                  </motion.span>
                )}
              </motion.button>
            </div>

            {/* Mobile — right buttons */}
            <div className="md:hidden flex items-center gap-2">
              <motion.button
                onClick={() => navigate('cart')}
                whileHover={{ scale: 1.08, boxShadow: '0 3px 14px rgba(45,76,58,0.16)' }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 420, damping: 20 }}
                className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-brand-leaf/20 bg-brand-leaf/5 text-brand-bark/70 hover:bg-brand-leaf hover:text-white hover:border-brand-leaf transition-colors"
                aria-label="Cart"
              >
                <ShoppingCart size={16} strokeWidth={1.7} />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-gold text-white text-[8px] min-w-[15px] h-[15px] px-0.5 rounded-full flex items-center justify-center font-bold">
                    {cartItems.length}
                  </span>
                )}
              </motion.button>

              <motion.button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                whileHover={{ scale: 1.08, boxShadow: '0 3px 14px rgba(45,76,58,0.16)' }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 420, damping: 20 }}
                className="flex items-center justify-center w-9 h-9 rounded-xl border border-brand-leaf/20 bg-brand-leaf/5 text-brand-bark/70 hover:bg-brand-leaf hover:text-white hover:border-brand-leaf transition-colors"
                aria-label="Menu"
              >
                {isMenuOpen ? <X size={17} strokeWidth={2} /> : <Menu size={17} strokeWidth={2} />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile drawer */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="md:hidden border-t border-brand-leaf/8 bg-white overflow-hidden"
          >
            <div className="px-5 py-5 space-y-0.5">
              {[
                { label: 'Home', action: () => navigate('home'), href: '#home' },
                { label: 'About Us', action: () => navigate('aboutPage'), href: '#about-page' },
                { label: 'Usage', action: () => navigate('home'), href: '#usage' },
                { label: 'Shop', action: () => navigate('home'), href: '#shop' },
              ].map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={link.action}
                  className="flex items-center justify-between py-3.5 border-b border-brand-leaf/6 last:border-0 text-sm text-brand-bark/65 hover:text-brand-leaf transition-colors font-medium"
                >
                  {link.label}
                  <ChevronRight size={13} className="text-brand-bark/25" />
                </a>
              ))}
              <div className="pt-4">
                <button
                  onClick={() => navigate('cart')}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-brand-leaf text-white text-sm font-bold hover:bg-brand-gold transition-colors"
                >
                  <ShoppingCart size={15} />
                  Cart {cartItems.length > 0 && `(${cartItems.length})`}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ── HOME ── */}
      {currentPage === 'home' ? (
        <>
          {/* Hero */}
          <section id="home" className="pt-24 md:pt-44 pb-16 md:pb-32 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
                >
                  <motion.span
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="text-[10px] uppercase tracking-[0.5em] text-brand-leaf mb-4 block font-bold"
                  >
                    Traditional Medicine
                  </motion.span>
                  <h1 className="font-serif mb-5 md:mb-8">
                    {/* Line 1 */}
                    <motion.span
                      initial={{ opacity: 0, y: 28 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.95, ease: [0.19, 1, 0.22, 1] }}
                      className="block text-[2.4rem] sm:text-5xl md:text-6xl lg:text-7xl text-brand-bark font-light leading-[1.1] tracking-[-0.01em]"
                    >
                      Ancient Roots,
                    </motion.span>

                    {/* Decorative separator */}
                    <motion.span
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ delay: 0.58, duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
                      className="flex items-center gap-3 my-3 md:my-4 origin-left"
                    >
                      <span className="h-px w-10 md:w-14 bg-brand-gold/50 block" />
                      <Leaf size={11} className="text-brand-gold/60 flex-shrink-0" />
                    </motion.span>

                    {/* Line 2 */}
                    <motion.span
                      initial={{ opacity: 0, y: 28 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.68, duration: 0.95, ease: [0.19, 1, 0.22, 1] }}
                      className="block text-[2.7rem] sm:text-5xl md:text-[4rem] lg:text-[4.5rem] text-brand-leaf italic font-extralight leading-[1.05]"
                    >
                      Pure Care.
                    </motion.span>
                  </h1>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="space-y-4 mb-8 max-w-2xl"
                  >
                    <p className="text-base md:text-lg text-brand-bark/70 leading-relaxed font-light">
                      Enriclance Adivasi Herbal Hair Oil combines ancient tribal wisdom with a potent Ayurvedic blend
                      of 108 forest-sourced herbs, including Bhringraj, Brahmi, and Onion Oil. This premium,
                      chemical-free formula targets the root causes of hair thinning and scalp irritation.
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="flex flex-wrap gap-4 items-center"
                  >
                    <button
                      onClick={goToShop}
                      className="px-6 py-3 rounded-full bg-brand-leaf text-white text-sm font-bold hover:bg-brand-gold transition-colors shadow-lg"
                    >
                      Shop Now
                    </button>
                    <a
                      href="#roots"
                      className="text-[10px] uppercase tracking-[0.2em] text-brand-bark border-b border-brand-bark/10 hover:border-brand-leaf pb-1 transition-all font-bold group"
                    >
                      <span className="flex items-center gap-2">
                        Discover Our Roots
                        <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 2 }}>→</motion.span>
                      </span>
                    </a>
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
                  className="relative mt-6 lg:mt-0 px-2 sm:px-4 md:pr-8"
                >
                  <div className="absolute inset-0 bg-brand-linen/50 rounded-full blur-[120px] -z-10" />
                  <div className="relative group">
                    <div className="absolute -inset-4 border border-brand-gold/10 rounded-[3rem] -z-10 scale-95 group-hover:scale-100 transition-transform duration-1000" />
                    <motion.div
                      animate={{ y: [0, -12, 0], rotate: [0, 8, 0] }}
                      transition={{ duration: 6, repeat: Infinity }}
                      className="absolute -top-4 -right-1 sm:-top-8 sm:-right-6 text-brand-gold/25 hidden sm:block"
                    >
                      <Leaf size={32} strokeWidth={1} />
                    </motion.div>
                    <motion.img
                      src={BOTTLE_HERO_URL}
                      alt="Enriclance Adivasi Herbal Hair Oil"
                      className="w-full max-w-[200px] sm:max-w-xs md:max-w-sm lg:max-w-md mx-auto drop-shadow-[0_30px_30px_rgba(61,68,53,0.15)]"
                      referrerPolicy="no-referrer"
                      whileHover={{ scale: 1.04, rotate: 1 }}
                      transition={{ duration: 0.5 }}
                    />
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                      className="absolute top-2 right-0 sm:-top-2 sm:-right-2 md:-top-4 md:-right-4 bg-white/70 backdrop-blur-xl px-2.5 py-1.5 md:px-4 md:py-2.5 rounded-lg md:rounded-xl border border-white/50 shadow-sm text-[7px] md:text-[8px] uppercase tracking-widest text-brand-leaf font-bold"
                    >
                      Wild Harvested
                    </motion.div>
                    <motion.div
                      animate={{ y: [0, 5, 0] }}
                      transition={{ repeat: Infinity, duration: 5, delay: 1, ease: 'easeInOut' }}
                      className="absolute bottom-2 left-0 sm:bottom-6 sm:-left-4 md:bottom-8 md:-left-8 bg-white/70 backdrop-blur-xl px-2.5 py-1.5 md:px-4 md:py-2.5 rounded-lg md:rounded-xl border border-white/50 shadow-sm text-[7px] md:text-[8px] uppercase tracking-widest text-brand-gold font-bold"
                    >
                      Handcrafted Batch
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Roots */}
          <section id="roots" className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg,#2d4c3b 0%,#1e3528 60%,#264233 100%)' }}>
            {/* Decorative elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <motion.div
                animate={{ rotate: [0, 8, 0] }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                className="absolute -top-20 -right-20 text-white/4"
              >
                <TreePine size={420} strokeWidth={0.5} />
              </motion.div>
              <motion.div
                animate={{ rotate: [0, -6, 0] }}
                transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                className="absolute -bottom-16 -left-16 text-white/4"
              >
                <Leaf size={320} strokeWidth={0.5} />
              </motion.div>
              {/* Gold accent line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-gold/20 to-transparent" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 py-20 md:py-28">
              {/* Label */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="text-center"
              >
                <span className="text-[9px] uppercase tracking-[0.55em] text-brand-gold/75 mb-6 block font-bold">Heritage & Craft</span>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-white mb-6 leading-tight">
                  Roots of <span className="italic font-light text-brand-sage">Enriclance</span>
                </h2>

                {/* Divider */}
                <div className="flex items-center justify-center gap-4 mb-8">
                  <div className="h-px w-12 bg-brand-gold/40" />
                  <Leaf size={14} className="text-brand-gold/60" />
                  <div className="h-px w-12 bg-brand-gold/40" />
                </div>

                <p className="text-white/75 text-base md:text-lg max-w-3xl mx-auto font-light leading-relaxed">
                  Enriclance Adivasi Herbal Hair Oil is expertly crafted with a potent blend of 101 to 108 traditional Ayurvedic herbs,
                  featuring powerful natural ingredients like Bhringraj, Brahmi, Amla, Aloe Vera, Neem, Shikakai, and Onion Oil.
                  Formulated for both men and women, compatible with all hair types.
                </p>

                {/* Herb chips */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-10">
                  {['Bhringraj', 'Brahmi', 'Amla', 'Aloe Vera', 'Neem', 'Shikakai', 'Onion Oil'].map(herb => (
                    <span
                      key={herb}
                      className="px-3 py-1.5 rounded-full border border-white/15 bg-white/8 text-white/65 text-[10px] uppercase tracking-[0.25em] font-medium backdrop-blur-sm"
                    >
                      {herb}
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>

          {/* Ingredients */}
          <section id="ingredients" className="py-16 md:py-32 bg-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 text-brand-leaf/5"><Leaf size={240} className="rotate-45" /></div>
            <div className="absolute bottom-0 left-0 p-10 text-brand-leaf/5"><TreePine size={300} /></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center mb-12 md:mb-24">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <span className="text-[9px] uppercase tracking-[0.6em] mb-6 block text-brand-gold font-bold">Nature's Pharmacy</span>
                  <h2 className="text-3xl md:text-5xl lg:text-6xl mb-6 md:mb-8 font-serif text-brand-bark">🌿 Key Ingredients & Their Benefits</h2>
                  <p className="text-brand-bark/50 text-base md:text-lg max-w-2xl mx-auto font-light leading-relaxed">
                    The oil is crafted from a blend of potent herbs and natural oils, uniquely combined to restore your hair's natural vitality.
                  </p>
                  <div className="h-px w-24 bg-brand-gold/30 mx-auto mt-8 md:mt-12" />
                </motion.div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                {INGREDIENTS.map((herb, idx) => (
                  <motion.div
                    key={herb.name}
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ delay: idx * 0.12, duration: 0.7, ease: 'easeOut' }}
                    whileHover={{ y: -12, scale: 1.03 }}
                    className="group relative bg-gradient-to-br from-brand-gold/10 via-white to-brand-linen/30 rounded-[2rem] border border-brand-leaf/10 overflow-hidden flex flex-col p-6 md:p-10 shadow-[0_35px_85px_rgba(45,76,58,0.12)] hover:shadow-[0_40px_95px_rgba(45,76,58,0.2)] transition-all duration-600"
                  >
                    <div className="mb-6 h-40 md:h-48 rounded-xl overflow-hidden bg-brand-linen">
                      <img
                        src={herb.url}
                        alt={herb.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(herb.name); }}
                      />
                    </div>
                    <div className="mb-4">
                      <span className="text-[10px] uppercase tracking-[0.3em] text-brand-gold font-bold block mb-3 group-hover:text-brand-leaf transition-colors">Active Botanical</span>
                      <h3 className="font-serif text-2xl md:text-3xl mb-3 text-brand-bark group-hover:text-brand-leaf transition-colors">
                        {herb.name.split(' (')[0]}
                      </h3>
                      <div className="h-px w-10 bg-brand-gold/30 mb-4 group-hover:w-16 transition-all duration-500" />
                    </div>
                    <p className="text-sm md:text-base leading-loose text-brand-bark/70 font-light group-hover:text-brand-bark transition-colors">
                      {herb.benefit}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Usage */}
          <section id="usage" className="py-16 md:py-32 relative overflow-hidden border-t border-brand-leaf/5" style={{ background: 'linear-gradient(160deg,#f5f2ed 0%,#faf8f5 50%,#f0ece5 100%)' }}>
            <div className="absolute top-0 right-0 text-brand-leaf/4 pointer-events-none"><Leaf size={380} className="rotate-12" /></div>
            <div className="absolute bottom-10 left-0 text-brand-gold/5 pointer-events-none"><TreePine size={280} /></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              {/* Section header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-14 md:mb-20"
              >
                <span className="text-[10px] uppercase tracking-[0.55em] text-brand-leaf mb-4 block font-bold">The Ritual</span>
                <h2 className="text-4xl md:text-6xl font-serif text-brand-bark mb-4">Usage Instructions</h2>
                <div className="h-px w-24 bg-brand-gold/35 mx-auto mt-6 mb-6" />
                <p className="text-brand-bark/55 max-w-2xl mx-auto font-light text-base md:text-lg leading-relaxed">
                  Follow this ancient-meets-modern ritual consistently for 3 months to unlock the full transformative power of 108 Adivasi herbs.
                </p>
              </motion.div>

              {/* Two column layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16">

                {/* Left sticky panel */}
                <div className="lg:sticky lg:top-24 h-fit">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="rounded-[2rem] p-7 md:p-10 overflow-hidden relative"
                    style={{ background: 'linear-gradient(135deg,#2D4C3A 0%,#1e3528 100%)' }}
                  >
                    {/* subtle leaf watermark */}
                    <div className="absolute -bottom-6 -right-6 text-white/5 pointer-events-none">
                      <Leaf size={160} strokeWidth={0.8} />
                    </div>
                    <span className="text-[9px] uppercase tracking-[0.5em] text-brand-gold/70 mb-5 block font-bold">The Ritual</span>
                    <h3 className="font-serif text-3xl md:text-4xl text-white mb-4 leading-tight">
                      5 Steps to <br /><span className="italic font-light text-brand-sage">Stronger Hair</span>
                    </h3>
                    <p className="text-white/55 text-sm font-light leading-relaxed mb-8 max-w-xs">
                      Follow this ritual consistently for 3 months to unlock the full power of 108 Adivasi herbs.
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: '108', label: 'Herbs' },
                        { value: '2–3×', label: 'Per Week' },
                        { value: '3 Mo', label: 'Course' },
                      ].map(stat => (
                        <div key={stat.label} className="text-center bg-white/10 rounded-2xl p-4">
                          <div className="font-serif text-xl font-bold text-brand-gold">{stat.value}</div>
                          <div className="text-[9px] uppercase tracking-widest text-white/45 mt-1">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Right: numbered timeline steps */}
                <div className="relative">
                  {/* Connecting line */}
                  <div className="absolute left-6 top-8 bottom-8 w-px bg-gradient-to-b from-brand-gold/50 via-brand-leaf/20 to-transparent hidden md:block" />

                  <div className="space-y-5">
                    {[
                      {
                        title: 'Part & Apply',
                        desc: 'Section your hair and apply 10–20 drops directly onto the scalp and hair shafts. Adjust based on hair length and thickness.',
                        tip: 'Warm the oil briefly in your palms — it absorbs far better.',
                        Icon: Droplets,
                      },
                      {
                        title: 'Deep Scalp Massage',
                        desc: 'Massage in firm circular motions with your fingertips for 5–10 minutes to stimulate blood flow and drive the herbal blend deep into the follicles.',
                        tip: 'Focus on thinning areas or where you notice the most fall.',
                        Icon: Sparkles,
                      },
                      {
                        title: 'Leave-In Duration',
                        desc: 'Leave overnight (4–8 hours) for best results, or a minimum of 2 hours. Cover with a shower cap to prevent staining.',
                        tip: 'Overnight application gives the herbs maximum time to work.',
                        Icon: Clock,
                      },
                      {
                        title: 'Wash & Rinse',
                        desc: 'Wash with a mild, sulphate-free shampoo — two rounds may be needed. Rinse with lukewarm, never hot, water to preserve beneficial residue.',
                        tip: 'Harsh shampoos strip the herb residue that keeps nourishing after washing.',
                        Icon: Waves,
                      },
                      {
                        title: 'Maintain Frequency',
                        desc: 'Apply 2–3 times per week consistently. A full 3-month course with the 500ml bottle delivers visible, lasting transformation from root to tip.',
                        tip: 'Set a recurring phone reminder — consistency is everything.',
                        Icon: Calendar,
                      },
                    ].map((step, idx) => (
                      <motion.div
                        key={step.title}
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.13, duration: 0.6 }}
                        className="flex gap-5 md:gap-7 group"
                      >
                        {/* Number badge */}
                        <div className="flex-shrink-0 relative z-10">
                          <motion.div
                            whileHover={{ scale: 1.12 }}
                            className="w-12 h-12 rounded-full bg-white border-2 border-brand-gold/35 group-hover:bg-brand-leaf group-hover:border-brand-leaf transition-all duration-500 flex items-center justify-center shadow-[0_4px_20px_rgba(197,160,89,0.18)]"
                          >
                            <span className="font-serif font-bold text-brand-gold group-hover:text-white transition-colors text-base">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                          </motion.div>
                        </div>

                        {/* Card */}
                        <div className="flex-1 group-hover:translate-x-1 transition-transform duration-300">
                          <div className="bg-white rounded-3xl p-5 md:p-6 border border-brand-leaf/8 shadow-[0_4px_20px_rgba(45,76,58,0.06)] group-hover:border-brand-gold/25 group-hover:shadow-[0_8px_30px_rgba(45,76,58,0.12)] transition-all duration-500">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div>
                                <span className="text-[9px] uppercase tracking-[0.35em] text-brand-gold font-bold mb-1 block">Step {idx + 1}</span>
                                <h4 className="font-serif text-xl md:text-2xl text-brand-bark group-hover:text-brand-leaf transition-colors">{step.title}</h4>
                              </div>
                              <div className="w-10 h-10 rounded-2xl bg-brand-leaf/8 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-gold/15 transition-colors">
                                <step.Icon size={17} className="text-brand-leaf" />
                              </div>
                            </div>
                            <p className="text-sm text-brand-bark/60 leading-relaxed font-light">{step.desc}</p>
                            <div className="mt-3 pt-3 border-t border-brand-leaf/6 flex items-start gap-2">
                              <span className="text-[9px] text-brand-gold font-bold uppercase tracking-widest flex-shrink-0 mt-0.5">Pro tip:</span>
                              <span className="text-[11px] text-brand-bark/50 font-light leading-relaxed">{step.tip}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Results timeline — interactive */}
              {(() => {
                const phases = [
                  {
                    weeks: 'Week 2–4',
                    label: 'Reduced Hair Fall',
                    desc: 'Notice significantly less hair on your pillow and comb. Scalp feels calmer, less itchy and more settled.',
                    detail: 'The Bhringraj and Neem in the formula start calming inflammation and strengthening follicle roots, visibly reducing daily hair fall.',
                    Icon: TrendingUp,
                    color: '#5D7A5D',
                  },
                  {
                    weeks: 'Week 4–8',
                    label: 'Visible Shine & Growth',
                    desc: 'Hair becomes noticeably shinier with improved texture. New baby hairs begin appearing at the hairline.',
                    detail: "Amla and Brahmi restore the scalp's natural oil balance, adding lustre. Dormant follicles begin to reactivate along the hairline.",
                    Icon: Sun,
                    color: '#C5A059',
                  },
                  {
                    weeks: 'Week 8–12',
                    label: 'Full Transformation',
                    desc: 'Thicker, healthier, stronger hair from root to tip. Scalp is deeply conditioned and dandruff-free.',
                    detail: 'The cumulative effect of all 108 herbs delivers dense, resilient hair. Most users report a measurable increase in volume and a dandruff-free scalp.',
                    Icon: Zap,
                    color: '#2D4C3A',
                  },
                ];
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="mt-16 md:mt-24"
                  >
                    <div className="text-center mb-10">
                      <h3 className="font-serif text-2xl md:text-3xl text-brand-bark mb-2">Your Transformation Timeline</h3>
                      <p className="text-brand-bark/50 text-sm font-light">Tap a phase to explore what to expect</p>
                    </div>

                    {/* Progress track — desktop */}
                    <div className="hidden md:flex items-start justify-between relative mb-8 px-8">
                      {/* Background rail */}
                      <div className="absolute top-5 left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-[2px] bg-brand-leaf/10 rounded-full" />
                      {/* Animated fill */}
                      <motion.div
                        className="absolute top-5 left-[calc(16.67%+1.5rem)] h-[2px] rounded-full bg-gradient-to-r from-brand-sage via-brand-gold to-brand-leaf origin-left"
                        animate={{ scaleX: activeTimeline === 0 ? 0 : activeTimeline === 1 ? 0.5 : 1 }}
                        transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                        style={{ right: 'calc(16.67% + 1.5rem)', transformOrigin: 'left' }}
                      />
                      {phases.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveTimeline(idx)}
                          className="flex flex-col items-center gap-3 flex-1 group focus:outline-none"
                        >
                          <motion.div
                            animate={{
                              backgroundColor: idx <= activeTimeline ? p.color : '#fff',
                              borderColor: idx <= activeTimeline ? p.color : 'rgba(197,160,89,0.4)',
                              scale: idx === activeTimeline ? 1.15 : 1,
                            }}
                            transition={{ duration: 0.3 }}
                            className="w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-sm relative z-10"
                          >
                            <p.Icon
                              size={16}
                              style={{ color: idx <= activeTimeline ? '#fff' : p.color }}
                            />
                          </motion.div>
                          <div className="text-center">
                            <div className="text-[9px] uppercase tracking-widest font-bold text-brand-bark/50 group-hover:text-brand-leaf transition-colors">{p.weeks}</div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {phases.map((p, idx) => {
                        const isActive = idx === activeTimeline;
                        return (
                          <motion.button
                            key={idx}
                            onClick={() => setActiveTimeline(idx)}
                            animate={{ opacity: isActive ? 1 : 0.82 }}
                            whileHover={{ opacity: 1 }}
                            transition={{ duration: 0.25 }}
                            className={`relative text-left rounded-[1.75rem] border p-6 overflow-hidden transition-all duration-300 focus:outline-none w-full
                              ${isActive
                                ? 'bg-white border-brand-leaf/15 shadow-[0_6px_24px_rgba(45,76,58,0.08)]'
                                : 'bg-white/50 border-brand-leaf/6 shadow-sm hover:bg-white/80'}`}
                          >
                            {/* Phase number watermark */}
                            <span className="absolute top-3 right-4 font-serif text-6xl font-bold leading-none"
                              style={{ color: isActive ? `${p.color}10` : 'rgba(45,76,58,0.04)' }}>
                              {String(idx + 1).padStart(2, '0')}
                            </span>

                            {/* Icon */}
                            <div
                              className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-300"
                              style={{ backgroundColor: isActive ? `${p.color}18` : 'rgba(45,76,58,0.05)' }}
                            >
                              <p.Icon size={18} style={{ color: p.color }} />
                            </div>

                            <div className="text-[9px] uppercase tracking-[0.35em] font-bold mb-1" style={{ color: p.color }}>{p.weeks}</div>
                            <h4 className="font-serif text-lg text-brand-bark mb-2 leading-tight">{p.label}</h4>
                            <p className="text-sm text-brand-bark/55 font-light leading-relaxed">{p.desc}</p>

                            {/* Expanded detail */}
                            <AnimatePresence>
                              {isActive && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                  animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                  transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                                  className="overflow-hidden"
                                >
                                  <div className="pt-3 border-t border-brand-leaf/8">
                                    <p className="text-xs text-brand-bark/50 font-light leading-relaxed italic">{p.detail}</p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Active indicator dot */}
                            <div className="mt-4 flex items-center gap-1.5">
                              {phases.map((_, dotIdx) => (
                                <div
                                  key={dotIdx}
                                  className="rounded-full transition-all duration-300"
                                  style={{
                                    width: dotIdx === idx ? 16 : 5,
                                    height: 5,
                                    backgroundColor: dotIdx === activeTimeline && dotIdx === idx
                                      ? p.color
                                      : dotIdx < activeTimeline
                                        ? `${p.color}50`
                                        : 'rgba(45,76,58,0.12)',
                                  }}
                                />
                              ))}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>

                  </motion.div>
                );
              })()}
            </div>
          </section>

          {/* Shop */}
          <section id="shop" className="py-16 md:py-24 bg-brand-paper relative overflow-hidden">
            <div className="absolute inset-0 bg-brand-sage/5 pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 text-brand-leaf/10 opacity-50"><TreePine size={400} /></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="flex flex-col items-center text-center mb-12 md:mb-20">
                <span className="text-[10px] uppercase tracking-[0.5em] text-brand-gold mb-4 block font-bold">The Collection</span>
                <h2 className="text-3xl md:text-6xl text-brand-bark font-serif">Curated for Your Hair</h2>
                <div className="mt-4 h-px w-20 bg-brand-gold/30" />
                <p className="text-brand-bark/50 text-base md:text-lg max-w-2xl mx-auto mt-4 md:mt-6 font-light">
                  Premium herbal hair care products crafted from forest-sourced ingredients
                </p>
              </div>
              <div className="flex justify-center">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 w-full max-w-5xl">
                  {products.map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6 }}
                      className="group flex flex-col"
                    >
                      <motion.div
                        className="relative bg-white rounded-[1.5rem] md:rounded-[2rem] p-4 flex flex-col justify-between border border-brand-leaf/5 hover:border-brand-gold/30 subtle-shadow transition-all duration-700"
                        whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(45,76,58,0.15)' }}
                      >
                        <div className="absolute top-4 right-4 flex flex-col gap-2">
                          {product.bestseller && (
                            <span className="bg-brand-gold text-brand-bark px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider">Bestseller</span>
                          )}
                          {product.discount && (
                            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider">{product.discount} Off</span>
                          )}
                        </div>
                        <div className="w-full flex items-center justify-center mb-4">
                          <div className="w-48 h-48 md:w-64 md:h-64 bg-brand-linen/40 rounded-xl overflow-hidden flex items-center justify-center group-hover:bg-brand-linen/60 transition-colors">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-44 md:h-56 object-contain transition-transform duration-500 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1">
                              <span className="text-[8px] uppercase tracking-[0.3em] font-bold text-brand-gold">{product.volume}</span>
                              <h3 className="text-base md:text-lg text-brand-bark font-serif leading-tight">{product.name}</h3>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl md:text-4xl font-serif text-brand-leaf font-extrabold drop-shadow-sm">{product.price}</div>
                              <div className="text-xs text-brand-bark/40 line-through">{product.originalPrice}</div>
                              {product.shippingNote && <div className="text-[10px] text-brand-bark/60">({product.shippingNote})</div>}
                            </div>
                          </div>
                          <p className="text-sm text-brand-bark/70 mt-4 mb-3 leading-relaxed font-light">{product.description}</p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-green-600">{product.inStock ? '✓ In Stock' : 'Out of Stock'}</div>
                            <button
                              onClick={() => addToCart(product)}
                              className="px-5 py-2.5 md:px-6 md:py-3 rounded-full bg-brand-leaf text-white text-sm font-bold hover:bg-brand-gold transition-colors shadow-lg"
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="py-16 md:py-32 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center mb-12 md:mb-24">
                <span className="text-[9px] uppercase tracking-[0.6em] mb-6 block text-brand-gold font-bold">Customer Love</span>
                <h2 className="text-3xl md:text-5xl lg:text-6xl mb-6 md:mb-8 font-serif text-brand-bark">⭐ What Our Customers Say</h2>
                <p className="text-brand-bark/50 text-base md:text-lg max-w-2xl mx-auto font-light leading-relaxed">
                  Join thousands of satisfied customers who've experienced the transformation that Enriclance brings.
                </p>
                <div className="h-px w-24 bg-brand-gold/30 mx-auto mt-8 md:mt-12" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
                {testimonials.map((t, idx) => (
                  <motion.div
                    key={t.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-brand-linen/40 rounded-[2rem] border border-brand-leaf/5 p-6 md:p-10 hover:bg-white hover:border-brand-gold/20 transition-all duration-500"
                  >
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-10 h-10 rounded-full bg-brand-leaf/10 flex items-center justify-center">
                        <User size={20} className="text-brand-leaf" />
                      </div>
                      <div>
                        <h4 className="font-serif text-lg text-brand-bark">{t.name}</h4>
                        <p className="text-[9px] text-brand-bark/50 uppercase tracking-widest">{t.location}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-brand-gold text-brand-gold" />)}
                    </div>
                    <p className="text-sm leading-loose text-brand-bark/70 font-light italic">"{t.text}"</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Trust Badges */}
          <section className="py-16 md:py-24 bg-brand-paper relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                {[
                  { icon: Truck, title: 'Worldwide Shipping', desc: 'Delivering to 50+ countries' },
                  { icon: RotateCcw, title: 'Customer Support', desc: 'Reach out to us for assistance' },
                  { icon: Shield, title: '100% Authentic', desc: 'Forest harvested ingredients' },
                  { icon: Star, title: '4.8★ Rated', desc: 'Trusted by 10K+ users' },
                ].map((badge, idx) => {
                  const Icon = badge.icon;
                  return (
                    <motion.div
                      key={badge.title}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="text-center group"
                    >
                      <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-brand-leaf/10 mb-3 md:mb-4 group-hover:bg-brand-gold/20 transition-colors">
                        <Icon size={20} className="text-brand-leaf" />
                      </div>
                      <h3 className="font-serif text-sm md:text-lg text-brand-bark mb-1 md:mb-2">{badge.title}</h3>
                      <p className="text-xs text-brand-bark/60 font-light">{badge.desc}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Enquiry */}
          <section id="enquire" className="py-20 md:py-40 bg-gradient-to-br from-brand-leaf via-brand-leaf to-brand-sage text-white relative overflow-hidden">
            <div className="absolute -bottom-40 -left-20 text-white/5 pointer-events-none"><TreePine size={600} strokeWidth={0.5} /></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-md rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-16 border border-white/20">
                <div className="text-center mb-8 md:mb-12">
                  <span className="text-[10px] uppercase tracking-[0.5em] text-brand-gold mb-4 md:mb-6 block font-bold">Get In Touch</span>
                  <h2 className="text-3xl md:text-5xl lg:text-6xl mb-4 md:mb-6 font-serif text-white leading-tight">Enquire About Our Products</h2>
                  <p className="text-white/60 text-base md:text-lg font-light leading-relaxed italic">Have questions about our herbal hair care? We're here to help.</p>
                </div>
                <form className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest text-brand-gold font-bold block">Full Name *</label>
                      <input type="text" placeholder="Your name" required className="w-full bg-white/5 border border-white/20 rounded-2xl px-5 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-gold focus:bg-white/10 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest text-brand-gold font-bold block">Email Address *</label>
                      <input type="email" placeholder="your@email.com" required className="w-full bg-white/5 border border-white/20 rounded-2xl px-5 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-gold focus:bg-white/10 transition-all" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-widest text-brand-gold font-bold block">Phone Number *</label>
                    <input type="tel" placeholder="+91 9876543210" required className="w-full bg-white/5 border border-white/20 rounded-2xl px-5 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-gold focus:bg-white/10 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-widest text-brand-gold font-bold block">Your Message</label>
                    <textarea rows={4} placeholder="Tell us about your hair concerns or questions..." className="w-full bg-white/5 border border-white/20 rounded-2xl px-5 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-gold focus:bg-white/10 transition-all resize-none" />
                  </div>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full mt-6 px-8 bg-gradient-to-r from-brand-gold to-brand-gold/80 text-brand-bark py-4 md:py-5 rounded-full text-[10px] uppercase tracking-[0.3em] font-bold hover:shadow-2xl transition-all duration-500 shadow-xl shadow-brand-gold/30"
                  >
                    Send Enquiry
                  </motion.button>
                  <p className="text-center text-[8px] text-white/40 mt-3">We'll get back to you within 24 hours</p>
                </form>
              </div>
            </div>
          </section>
        </>

      ) : currentPage === 'aboutPage' ? (
        /* ── ABOUT PAGE ── */
        <section id="about-page" className="pt-24 md:pt-32 pb-20 bg-brand-paper relative overflow-hidden min-h-screen">
          <div className="absolute top-0 right-0 text-brand-leaf/5 pointer-events-none"><Leaf size={400} className="rotate-45" /></div>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="text-center mb-12 md:mb-16">
                <span className="text-[10px] uppercase tracking-[0.5em] text-brand-gold mb-4 block font-bold">Our Promise</span>
                <h1 className="text-4xl md:text-6xl font-serif text-brand-bark mb-4">Quality You Can Trust</h1>
                <div className="h-px w-24 bg-brand-gold/30 mx-auto mt-6" />
                <p className="text-brand-bark/60 mt-6 max-w-2xl mx-auto text-base font-light leading-relaxed">
                  We don't just claim quality; we prove it. Enriclance maintains rigorous standards and holds the following official recognitions.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                {[
                  { icon: Award, title: 'ISO Certified', desc: 'Guaranteed international standards for quality management and production processes.' },
                  { icon: Shield, title: 'GMP Certified', desc: 'Manufactured under Good Manufacturing Practices to ensure consistent safety and purity.' },
                  { icon: Leaf, title: 'Ayush Certified', desc: 'Officially recognized by the Ministry of AYUSH for authentic Ayurvedic formulation.' },
                  { icon: CheckCircle, title: '100% Natural & Cruelty-Free', desc: 'Lab-tested to be free from parabens, sulfates, and synthetic chemicals.' },
                ].map((cert, idx) => {
                  const Icon = cert.icon;
                  return (
                    <motion.div
                      key={cert.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1, duration: 0.6 }}
                      className="flex gap-5 bg-white rounded-3xl p-6 border border-brand-leaf/10 shadow-[0_10px_40px_rgba(45,76,58,0.08)] hover:border-brand-gold/30 transition-all"
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-leaf/10 flex items-center justify-center">
                        <Icon size={22} className="text-brand-leaf" />
                      </div>
                      <div>
                        <h3 className="font-serif text-lg text-brand-bark mb-1">{cert.title}</h3>
                        <p className="text-sm text-brand-bark/60 leading-relaxed font-light">{cert.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="bg-brand-leaf rounded-3xl p-8 md:p-12 text-white text-center">
                <h3 className="font-serif text-2xl md:text-3xl mb-4">Ready to transform your hair?</h3>
                <p className="text-white/70 mb-6 font-light">Experience the power of 108 Adivasi herbs.</p>
                <button
                  onClick={goToShop}
                  className="px-8 py-3 bg-brand-gold text-brand-bark rounded-full font-bold text-sm hover:bg-brand-gold/80 transition-colors"
                >
                  Shop Now
                </button>
              </div>
            </motion.div>
          </div>
        </section>

      ) : currentPage === 'cart' ? (
        /* ── CART PAGE ── */
        <section className="pt-20 md:pt-24 min-h-screen pb-20 relative overflow-hidden" style={{ background: 'linear-gradient(160deg,#2d4c3a 0%,#1e3528 60%,#243d2e 100%)' }}>
          {/* Decorative */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-20 -right-20 text-white/3"><TreePine size={500} strokeWidth={0.5} /></div>
            <div className="absolute bottom-0 -left-16 text-white/3"><Leaf size={350} strokeWidth={0.5} /></div>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-gold/30 to-transparent" />
          </div>

          {/* Page header */}
          <div className="relative z-10 border-b border-white/10 py-6 md:py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <button
                onClick={() => navigate('home')}
                className="flex items-center gap-2 text-white/50 hover:text-brand-gold transition-colors text-sm mb-3"
              >
                <ArrowLeft size={15} /> Continue Shopping
              </button>
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="font-serif text-3xl md:text-4xl text-white">Your Cart</h1>
                  <p className="text-white/45 text-sm mt-1">{cartItems.length === 0 ? 'No items yet' : `${cartItems.length} item${cartItems.length > 1 ? 's' : ''}`}</p>
                </div>
                <ShoppingCart size={26} className="text-brand-gold/40 mb-1" />
              </div>
            </div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            {cartItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20 md:py-32"
              >
                <div className="w-24 h-24 rounded-full bg-white/10 border border-white/15 flex items-center justify-center mx-auto mb-6">
                  <ShoppingCart size={38} className="text-brand-gold/60" />
                </div>
                <h3 className="text-2xl font-serif text-white mb-3">Your cart is empty</h3>
                <p className="text-white/50 mb-8 font-light">Add products from the shop to continue.</p>
                <button
                  onClick={goToShop}
                  className="inline-block bg-brand-gold text-brand-bark px-8 py-4 rounded-full text-sm uppercase tracking-wider font-bold hover:bg-brand-gold/80 transition-all"
                >
                  Browse Products
                </button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 md:gap-10">
                {/* Cart Items */}
                <div className="space-y-4">
                  {cartItems.map((item, idx) => {
                    const unit = getPriceNum(item.price);
                    const subtotal = unit * item.quantity;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="bg-white/10 backdrop-blur-sm rounded-3xl p-4 md:p-6 border border-white/15 flex gap-3 md:gap-5 items-start"
                      >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden mt-0.5">
                          <img src={item.image || BOTTLE_HERO_URL} alt={item.name} className="h-14 md:h-18 object-contain" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[9px] uppercase tracking-[0.3em] text-brand-gold font-bold">{item.volume}</span>
                              <h4 className="font-serif text-base md:text-lg text-white leading-tight">{item.name}</h4>
                            </div>
                            <button onClick={() => removeCartItem(item.id)} className="text-white/30 hover:text-red-400 transition-colors flex-shrink-0 mt-1" aria-label="Remove">
                              <X size={15} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                            <div className="flex items-center gap-1 bg-white/10 rounded-full p-1">
                              <button onClick={() => updateCartQuantity(item.id, -1)} className="w-7 h-7 rounded-full bg-white/15 text-white hover:bg-brand-gold hover:text-brand-bark transition-all text-base font-bold flex items-center justify-center">−</button>
                              <span className="w-8 text-center text-sm font-bold text-white">{item.quantity}</span>
                              <button onClick={() => updateCartQuantity(item.id, 1)} className="w-7 h-7 rounded-full bg-white/15 text-white hover:bg-brand-gold hover:text-brand-bark transition-all text-base font-bold flex items-center justify-center">+</button>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-brand-gold text-base md:text-lg">₹{subtotal.toLocaleString()}</div>
                              <div className="text-[10px] text-white/35">₹{unit.toLocaleString()} each</div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Order Summary */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:sticky lg:top-24 h-fit">
                  <div className="bg-white/10 backdrop-blur-sm rounded-3xl border border-white/15 overflow-hidden">
                    <div className="px-6 py-5 border-b border-white/10">
                      <h3 className="font-serif text-xl text-white">Order Summary</h3>
                    </div>
                    <div className="p-6">
                      {cartItems.map(item => (
                        <div key={item.id} className="flex justify-between text-sm py-2 border-b border-white/8 last:border-0">
                          <span className="text-white/60 font-light">{item.volume} × {item.quantity}</span>
                          <span className="font-medium text-white">₹{(getPriceNum(item.price) * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="mt-4 space-y-2 pt-2">
                        <div className="flex justify-between text-sm text-white/55"><span>Subtotal</span><span>₹{getTotal().toLocaleString('en-IN')}</span></div>
                        <div className="flex justify-between text-sm text-white/55"><span>CGST (9%)</span><span>₹{getCGST().toLocaleString('en-IN')}</span></div>
                        <div className="flex justify-between text-sm text-white/55"><span>SGST (9%)</span><span>₹{getSGST().toLocaleString('en-IN')}</span></div>
                        <div className="flex justify-between text-sm text-white/55"><span>Shipping</span><span className="text-emerald-400 font-medium">Free</span></div>
                        <div className="flex justify-between text-base font-bold text-white pt-3 border-t border-white/15">
                          <span>Total (incl. 18% GST)</span>
                          <span className="text-brand-gold text-xl">₹{getGrandTotal().toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('checkout')}
                        className="w-full mt-6 bg-brand-gold text-brand-bark py-4 rounded-2xl font-bold text-sm hover:bg-brand-gold/85 transition-all shadow-lg shadow-brand-gold/20 flex items-center justify-center gap-2"
                      >
                        Proceed to Checkout <ChevronRight size={16} />
                      </motion.button>
                      <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-white/30 uppercase tracking-widest">
                        <Lock size={10} /> Secure Checkout · Free Shipping
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </section>

      ) : currentPage === 'checkout' ? (
        /* ── CHECKOUT PAGE ── */
        <section className="pt-20 md:pt-24 min-h-screen pb-20 relative overflow-hidden" style={{ background: 'linear-gradient(160deg,#2d4c3a 0%,#1e3528 60%,#243d2e 100%)' }}>
          {/* Decorative */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-20 -right-20 text-white/3"><TreePine size={500} strokeWidth={0.5} /></div>
            <div className="absolute bottom-0 -left-16 text-white/3"><Leaf size={350} strokeWidth={0.5} /></div>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-gold/30 to-transparent" />
          </div>

          {/* Breadcrumb */}
          <div className="relative z-10 border-b border-white/10 py-5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2 text-xs text-white/45">
                <button onClick={() => navigate('home')} className="hover:text-brand-gold transition-colors">Home</button>
                <ChevronRight size={12} />
                <button onClick={() => navigate('cart')} className="hover:text-brand-gold transition-colors">Cart</button>
                <ChevronRight size={12} />
                <span className="text-brand-gold font-semibold">Checkout</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <div className="mb-8">
              <h1 className="font-serif text-3xl md:text-4xl text-white">Secure Checkout</h1>
              <p className="text-white/45 text-sm mt-1 font-light">Complete your delivery details and pay securely</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 md:gap-10">
              {/* Delivery Form */}
              <form onSubmit={handleCheckoutSubmit} className="space-y-5">
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl border border-white/15 p-6 md:p-8">
                  <h2 className="font-serif text-xl text-white mb-6 flex items-center gap-2">
                    <MapPin size={17} className="text-brand-gold" /> Delivery Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest text-brand-gold/75 font-bold block">Full Name *</label>
                      <input type="text" required placeholder="Rahul Sharma" value={checkoutForm.name} onChange={e => setCheckoutForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest text-brand-gold/75 font-bold block">Email Address *</label>
                      <input type="email" required placeholder="your@email.com" value={checkoutForm.email} onChange={e => setCheckoutForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[9px] uppercase tracking-widest text-brand-gold/75 font-bold block">Phone Number *</label>
                      <input type="tel" required placeholder="+91 9876543210" value={checkoutForm.phone} onChange={e => setCheckoutForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[9px] uppercase tracking-widest text-brand-gold/75 font-bold block">Delivery Address *</label>
                      <textarea required rows={3} placeholder="Flat/House No., Building, Street, Area" value={checkoutForm.address} onChange={e => setCheckoutForm(f => ({ ...f, address: e.target.value }))} className={`${inputCls} resize-none`} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest text-brand-gold/75 font-bold block">City *</label>
                      <input type="text" required placeholder="Bengaluru" value={checkoutForm.city} onChange={e => setCheckoutForm(f => ({ ...f, city: e.target.value }))} className={inputCls} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest text-brand-gold/75 font-bold block">PIN Code *</label>
                      <input type="text" required placeholder="560001" maxLength={6} value={checkoutForm.pincode} onChange={e => setCheckoutForm(f => ({ ...f, pincode: e.target.value.replace(/\D/g, '') }))} className={inputCls} />
                    </div>
                  </div>
                </div>

                {/* Pay button */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01, boxShadow: '0 8px 30px rgba(197,160,89,0.35)' }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-brand-gold text-brand-bark py-5 rounded-2xl font-bold text-base transition-all shadow-lg shadow-brand-gold/25 flex items-center justify-center gap-3"
                >
                  <Lock size={18} />
                  Pay {fmtCur(getGrandTotal())}
                </motion.button>
                <p className="text-center text-[10px] text-white/30 uppercase tracking-widest flex items-center justify-center gap-2">
                  <Shield size={10} /> 100% Secure · 256-bit Encrypted
                </p>
              </form>

              {/* Sticky Order Summary */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:sticky lg:top-24 h-fit">
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl border border-white/15 overflow-hidden">
                  <div className="px-6 py-5 border-b border-white/10">
                    <h3 className="font-serif text-xl text-white">Order Summary</h3>
                    <p className="text-white/45 text-xs mt-1">{cartItems.length} item{cartItems.length > 1 ? 's' : ''}</p>
                  </div>

                  {/* Currency switcher */}
                  <div className="px-6 pt-5 pb-2">
                    <p className="text-[9px] uppercase tracking-widest text-brand-gold/60 mb-2 font-bold">Display Currency</p>
                    <div className="flex gap-2 flex-wrap">
                      {(Object.keys(CURRENCIES) as Array<keyof typeof CURRENCIES>).map(cur => (
                        <button
                          key={cur}
                          onClick={() => setCurrency(cur)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                            currency === cur
                              ? 'bg-brand-gold text-brand-bark border-brand-gold'
                              : 'bg-white/10 text-white/55 border-white/20 hover:border-brand-gold/50 hover:text-white'
                          }`}
                        >
                          {CURRENCIES[cur].symbol} {cur}
                        </button>
                      ))}
                    </div>
                    {currency !== 'INR' && (
                      <p className="text-[10px] text-white/30 mt-2 italic">Display only — payment charged in INR</p>
                    )}
                  </div>

                  <div className="p-6 pt-3">
                    {cartItems.map(item => (
                      <div key={item.id} className="flex items-center gap-3 py-3 border-b border-white/8 last:border-0">
                        <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <img src={item.image || BOTTLE_HERO_URL} alt={item.name} className="h-9 object-contain" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{item.name}</p>
                          <p className="text-[10px] text-white/45">{item.volume} × {item.quantity}</p>
                        </div>
                        <span className="text-sm font-bold text-brand-gold">{fmtCur(getPriceNum(item.price) * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="mt-4 space-y-2 pt-2">
                      <div className="flex justify-between text-sm text-white/55"><span>Subtotal</span><span>{fmtCur(getTotal())}</span></div>
                      <div className="flex justify-between text-sm text-white/55"><span>CGST (9%)</span><span>{fmtCur(getCGST())}</span></div>
                      <div className="flex justify-between text-sm text-white/55"><span>SGST (9%)</span><span>{fmtCur(getSGST())}</span></div>
                      <div className="flex justify-between text-sm text-white/55"><span>Shipping</span><span className="text-emerald-400 font-medium">Free</span></div>
                      <div className="flex justify-between text-base font-bold text-white pt-3 border-t border-white/15">
                        <span>Total (incl. 18% GST)</span>
                        <span className="text-brand-gold text-lg">{fmtCur(getGrandTotal())}</span>
                      </div>
                    </div>

                    <div className="mt-5 space-y-2">
                      {[
                        { icon: Shield, text: 'Secure Payment via Razorpay' },
                        { icon: Truck, text: 'Free Shipping Across India' },
                        { icon: Package, text: 'Carefully Packed & Delivered' },
                      ].map(({ icon: Icon, text }) => (
                        <div key={text} className="flex items-center gap-2 text-xs text-white/40">
                          <Icon size={11} className="text-brand-gold/60 flex-shrink-0" />
                          {text}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('cart')}
                  className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-white/35 hover:text-brand-gold transition-colors py-2"
                >
                  <ArrowLeft size={13} /> Back to Cart
                </button>
              </motion.div>
            </div>
          </div>
        </section>

      ) : (
        /* ── THANK YOU PAGE ── */
        <section className="pt-20 md:pt-24 min-h-screen pb-20 bg-brand-paper">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              {/* Animated check */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
                className="w-24 h-24 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center mx-auto mb-8"
              >
                <CheckCircle size={48} className="text-green-500" strokeWidth={1.5} />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <span className="text-[10px] uppercase tracking-[0.5em] text-brand-gold mb-3 block font-bold">Payment Successful</span>
                <h1 className="font-serif text-4xl md:text-5xl text-brand-bark mb-4">Thank You!</h1>
                <p className="text-brand-bark/60 text-base md:text-lg font-light max-w-lg mx-auto leading-relaxed">
                  Your order has been placed successfully. We're preparing your Enriclance Adivasi Hair Oil with care.
                </p>
              </motion.div>
            </motion.div>

            {/* Order details card */}
            {orderDetails && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-10 bg-white rounded-3xl border border-brand-leaf/10 shadow-[0_8px_40px_rgba(45,76,58,0.1)] overflow-hidden"
              >
                <div className="bg-brand-leaf px-6 py-5 flex items-center gap-3">
                  <Package size={20} className="text-white/70" />
                  <h3 className="font-serif text-xl text-white">Order Confirmed</h3>
                </div>
                <div className="p-6 md:p-8">
                  <div className="space-y-3 mb-6">
                    {orderDetails.items.map(item => (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-brand-linen/60 rounded-2xl flex items-center justify-center flex-shrink-0">
                          <img src={item.image || BOTTLE_HERO_URL} alt={item.name} className="h-12 object-contain" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-brand-bark">{item.name}</p>
                          <p className="text-xs text-brand-bark/50">{item.volume} × {item.quantity}</p>
                        </div>
                        <span className="font-bold text-brand-leaf">
                          ₹{(getPriceNum(item.price) * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-brand-leaf/8 pt-4 space-y-2">
                    <div className="flex justify-between text-sm text-brand-bark/60">
                      <span>Subtotal</span>
                      <span>₹{orderDetails.total.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm text-brand-bark/60">
                      <span>CGST (9%)</span>
                      <span>₹{orderDetails.cgst.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm text-brand-bark/60">
                      <span>SGST (9%)</span>
                      <span>₹{orderDetails.sgst.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm text-brand-bark/60">
                      <span>Shipping</span>
                      <span className="text-green-600 font-medium">Free</span>
                    </div>
                    <div className="flex justify-between font-bold text-brand-bark text-base pt-2 border-t border-brand-leaf/8">
                      <span>Total Paid (incl. 18% GST)</span>
                      <span className="text-brand-leaf text-xl">₹{orderDetails.grandTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="mt-6 bg-brand-linen rounded-2xl p-5 space-y-2">
                    <div className="flex gap-2 items-start">
                      <MapPin size={14} className="text-brand-gold mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-brand-bark">{orderDetails.form.name}</p>
                        <p className="text-xs text-brand-bark/60">{orderDetails.form.address}, {orderDetails.form.city} – {orderDetails.form.pincode}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Mail size={14} className="text-brand-gold flex-shrink-0" />
                      <p className="text-xs text-brand-bark/60">{orderDetails.form.email}</p>
                    </div>
                    <div className="pt-2 border-t border-brand-bark/10">
                      <p className="text-[10px] text-brand-bark/40 uppercase tracking-widest">Payment ID</p>
                      <p className="text-xs font-mono text-brand-bark/60 mt-0.5">{orderDetails.paymentId}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* What's next */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="mt-8 bg-brand-leaf/5 border border-brand-leaf/10 rounded-3xl p-6"
            >
              <h4 className="font-serif text-lg text-brand-bark mb-4">What happens next?</h4>
              <div className="space-y-3">
                {[
                  { step: '01', text: "You'll receive an order confirmation on your email." },
                  { step: '02', text: 'Our team will prepare and dispatch your order within 1-2 business days.' },
                  { step: '03', text: "You'll receive a tracking link once your order is shipped." },
                ].map(s => (
                  <div key={s.step} className="flex gap-4 items-start">
                    <span className="text-brand-gold font-bold text-xs font-mono mt-0.5 flex-shrink-0">{s.step}</span>
                    <p className="text-sm text-brand-bark/70 font-light">{s.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="text-center mt-10 space-y-4"
            >
              <button
                onClick={() => navigate('home')}
                className="inline-block bg-brand-leaf text-white px-10 py-4 rounded-full font-bold hover:bg-brand-gold hover:text-brand-bark transition-all shadow-lg"
              >
                Continue Shopping
              </button>
              <div>
                <p className="text-xs text-brand-bark/40 mt-4">
                  Questions? Contact us at{' '}
                  <a href="mailto:ashirvadenterprises1972@gmail.com" className="text-brand-leaf hover:underline">
                    ashirvadenterprises1972@gmail.com
                  </a>
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #1a2f24 0%, #121e18 100%)' }}>
        {/* Decorative */}
        <div className="absolute top-0 right-0 opacity-[0.04] pointer-events-none">
          <TreePine size={600} className="text-white" />
        </div>
        <div className="absolute bottom-0 left-0 opacity-[0.03] pointer-events-none">
          <Leaf size={400} className="text-white rotate-45" />
        </div>

        {/* Main grid */}
        <div className="relative z-10 py-14 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12">
              {/* Brand */}
              <div className="sm:col-span-2 lg:col-span-1 space-y-5">
                {logoLoaded ? (
                  <img src={LOGO_URL} alt="Enriclance" className="w-28 h-auto opacity-90" />
                ) : (
                  <span className="font-serif text-2xl text-white">Enriclance</span>
                )}
                <p className="text-white/55 text-sm leading-relaxed font-light max-w-xs">
                  Rooted in Adivasi tradition. Crafted with 108 forest-sourced herbs. Ancient wisdom for modern hair care.
                </p>
                <div className="flex gap-3 pt-1">
                  {[
                    {
                      label: 'Instagram',
                      svg: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                          <circle cx="12" cy="12" r="4" />
                          <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
                        </svg>
                      ),
                    },
                    {
                      label: 'Facebook',
                      svg: (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ),
                    },
                    {
                      label: 'X (Twitter)',
                      svg: (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      ),
                    },
                  ].map(({ label, svg }) => (
                    <a
                      key={label}
                      href="#"
                      aria-label={label}
                      className="w-9 h-9 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-white/60 hover:bg-brand-gold hover:border-brand-gold hover:text-brand-bark transition-all duration-300"
                    >
                      {svg}
                    </a>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div className="space-y-5">
                <h4 className="text-[10px] uppercase tracking-[0.45em] text-brand-gold font-bold">Quick Links</h4>
                <ul className="space-y-3">
                  {[
                    { label: 'Home', action: () => navigate('home') },
                    { label: 'About Us', action: () => navigate('aboutPage') },
                    { label: 'Ingredients', action: () => navigate('home') },
                    { label: 'Usage Guide', action: () => navigate('home') },
                    { label: 'Shop', action: () => navigate('home') },
                  ].map(link => (
                    <li key={link.label}>
                      <button
                        onClick={link.action}
                        className="text-sm text-white/55 hover:text-brand-gold transition-colors flex items-center gap-2 group"
                      >
                        <ChevronRight size={12} className="text-brand-gold/40 group-hover:translate-x-1 transition-transform" />
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Products */}
              <div className="space-y-5">
                <h4 className="text-[10px] uppercase tracking-[0.45em] text-brand-gold font-bold">Our Products</h4>
                <ul className="space-y-3">
                  {[
                    { label: 'Hair Oil – 250ml', action: () => navigate('home') },
                    { label: 'Hair Oil – 500ml', action: () => navigate('home') },
                    { label: 'View Cart', action: () => navigate('cart') },
                    { label: 'Checkout', action: () => navigate('checkout') },
                  ].map(link => (
                    <li key={link.label}>
                      <button
                        onClick={link.action}
                        className="text-sm text-white/55 hover:text-brand-gold transition-colors flex items-center gap-2 group"
                      >
                        <ChevronRight size={12} className="text-brand-gold/40 group-hover:translate-x-1 transition-transform" />
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact */}
              <div className="space-y-5">
                <h4 className="text-[10px] uppercase tracking-[0.45em] text-brand-gold font-bold">Get In Touch</h4>
                <div className="space-y-4">
                  <a href="tel:+918088021881" className="flex gap-3 items-start group">
                    <Phone size={14} className="text-brand-gold mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-white/55 group-hover:text-white/80 transition-colors">+91 8088021881</p>
                      <p className="text-sm text-white/55 group-hover:text-white/80 transition-colors">+91 8431838491</p>
                    </div>
                  </a>
                  <a href="mailto:ashirvadenterprises1972@gmail.com" className="flex gap-3 items-start group">
                    <Mail size={14} className="text-brand-gold mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-white/55 group-hover:text-white/80 transition-colors break-all">
                      ashirvadenterprises1972@gmail.com
                    </p>
                  </a>
                  <div className="flex gap-3 items-start">
                    <MapPin size={14} className="text-brand-gold mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-white/55 leading-relaxed">
                      No. 108, 10th A Main Road, 3rd Stage,<br />
                      Rajajinagar, Bengaluru – 560010
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Certifications strip */}
        <div className="border-t border-white/8 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-wrap justify-center gap-4 md:gap-8">
              {['ISO Certified', 'GMP Certified', 'Ayush Certified', '100% Natural'].map(cert => (
                <div key={cert} className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-gold/50" />
                  {cert}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-[9px] uppercase tracking-[0.4em] text-white/25">
              <p>© 2025 Enriclance Adivasi Herbal. All rights reserved.</p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-brand-gold transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-brand-gold transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-brand-gold transition-colors">Refund Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
