"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin,
  Heart,
  ArrowRight,
  ChevronDown,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCompanyContact } from '@/actions/contact';

const FooterLinkGroup = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="py-2">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full md:cursor-default"
      >
        <h3 className="text-base font-semibold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>{title}</h3>
        <ChevronDown 
          size={16} 
          className={`transition-transform md:hidden text-white ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={`mt-4 space-y-2 transition-all overflow-hidden md:block ${isOpen ? 'max-h-96' : 'max-h-0 md:max-h-none'}`}>
        {children}
      </div>
    </div>
  );
};

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [companyContact, setCompanyContact] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch company contact info
  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const response = await getCompanyContact();
        if (response.success && response.contact) {
          setCompanyContact(response.contact);
        }
      } catch (error) {
        console.error("Failed to load company contact information", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchContactInfo();
  }, []);

  /* Newsletter functionality is commented out
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setEmail('');
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
    }, 1000);
  };
  */

  return (
    <footer className="bg-[#6B2F1A] text-white">
      {/* Main footer content */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
          {/* About column - wider on larger screens */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-block mb-6">
              <div className="flex items-center">
                <div className="relative w-28 h-10 mr-2 flex items-center justify-center overflow-hidden">
                  <Image 
                    src="/assets/images/logo.png" 
                    alt="Kauthuk Logo" 
                    fill
                    className="object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.parentNode.classList.add('flex', 'items-center', 'justify-center');
                      e.target.parentNode.innerHTML = '<span class="text-lg font-bold text-white">Kauthuk</span>';
                    }}
                  />
                </div>
              </div>
            </Link>
            <p className="text-white/80 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
              We're dedicated to providing high-quality handcrafted products that celebrate the rich cultural heritage of India.
            </p>
            
            {/* Newsletter - commented out 
            <div className="mb-6">
              <h3 className="text-base font-semibold mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
                Subscribe to our newsletter
              </h3>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white rounded-md"
                />
                <Button 
                  type="submit" 
                  variant="outline" 
                  size="icon" 
                  disabled={isSubmitting}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  {isSubmitting ? (
                    <span className="animate-spin">⟳</span>
                  ) : (
                    <Send size={16} />
                  )}
                </Button>
              </form>
              {submitSuccess && (
                <p className="text-green-400 text-sm mt-2">Thank you for subscribing!</p>
              )}
            </div>
            */}
            
            {/* Social icons - made dynamic */}
            {companyContact && (
              <div className="flex flex-wrap gap-3">
                {companyContact.facebook_url && (
                  <a 
                    href={companyContact.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook" 
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <Facebook size={16} />
                  </a>
                )}
                {companyContact.instagram_url && (
                  <a 
                    href={companyContact.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram" 
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <Instagram size={16} />
                  </a>
                )}
                {companyContact.twitter_url && (
                  <a 
                    href={companyContact.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter" 
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <Twitter size={16} />
                  </a>
                )}
                {companyContact.youtube_url && (
                  <a 
                    href={companyContact.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="YouTube" 
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <Youtube size={16} />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Links columns */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-8">
              {/* Quick Links */}
              <div className="md:border-0 md:pb-0">
                <FooterLinkGroup title="Quick Links">
                  <ul className="space-y-2">
                    <li>
                      <Link href="/pages/about" className="text-white/80 hover:text-white transition-colors block py-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        About Us
                      </Link>
                    </li>
                    <li>
                      <Link href="/products" className="text-white/80 hover:text-white transition-colors block py-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Shop
                      </Link>
                    </li>
                    <li>
                      <Link href="/contact" className="text-white/80 hover:text-white transition-colors block py-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Contact
                      </Link>
                    </li>
                    <li>
                      <Link href="/blog" className="text-white/80 hover:text-white transition-colors block py-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Blog
                      </Link>
                    </li>
                    <li>
                      <Link href="/faq" className="text-white/80 hover:text-white transition-colors block py-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        FAQ
                      </Link>
                    </li>
                  </ul>
                </FooterLinkGroup>
              </div>

              {/* Policy Links */}
              <div className="md:border-0 md:pb-0">
                <FooterLinkGroup title="Customer Service">
                  <ul className="space-y-2">
                    <li>
                      <Link href="/pages/shipping" className="text-white/80 hover:text-white transition-colors block py-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Shipping Policy
                      </Link>
                    </li>
                    <li>
                      <Link href="/pages/returns" className="text-white/80 hover:text-white transition-colors block py-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Returns & Refunds
                      </Link>
                    </li>
                    <li>
                      <Link href="/pages/privacy" className="text-white/80 hover:text-white transition-colors block py-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Privacy Policy
                      </Link>
                    </li>
                    <li>
                      <Link href="/pages/terms" className="text-white/80 hover:text-white transition-colors block py-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Terms & Conditions
                      </Link>
                    </li>
                    <li>
                      <Link href="/track-order" className="text-white/80 hover:text-white transition-colors block py-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Track Your Order
                      </Link>
                    </li>
                  </ul>
                </FooterLinkGroup>
              </div>

              {/* Contact - made dynamic */}
              <div className="md:border-0 md:pb-0">
                <FooterLinkGroup title="Contact Us">
                  {loading ? (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-4 bg-white/30 rounded w-3/4"></div>
                      <div className="h-4 bg-white/30 rounded w-2/3"></div>
                      <div className="h-4 bg-white/30 rounded w-1/2"></div>
                    </div>
                  ) : companyContact ? (
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <MapPin size={16} className="mt-1 mr-2 flex-shrink-0" />
                        <p className="text-white/80" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {companyContact.address_line1}
                          {companyContact.address_line2 && <><br/>{companyContact.address_line2}</>}<br/>
                          {companyContact.city}, {companyContact.state} {companyContact.postal_code}<br/>
                          {companyContact.country}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <Phone size={16} className="mr-2 flex-shrink-0" />
                        <p className="text-white/80" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {companyContact.phone}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <Mail size={16} className="mr-2 flex-shrink-0" />
                        <a 
                          href={`mailto:${companyContact.email}`} 
                          className="text-white/80 hover:text-white transition-colors"
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                          {companyContact.email}
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <MapPin size={16} className="mt-1 mr-2 flex-shrink-0" />
                        <p className="text-white/80" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          Contact information unavailable
                        </p>
                      </div>
                    </div>
                  )}
                </FooterLinkGroup>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="mt-10 pt-6 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white/70" style={{ fontFamily: 'Poppins, sans-serif' }}>
              © {currentYear} Kauthuk. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center gap-6 text-sm text-white/70">
              <Link 
                href="/pages/privacy" 
                className="hover:text-white transition-colors"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Privacy Policy
              </Link>
              <Link 
                href="/pages/terms" 
                className="hover:text-white transition-colors"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Terms of Service
              </Link>
              
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;