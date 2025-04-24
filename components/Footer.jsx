"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Facebook,
  Instagram,
  Twitter,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { FaPinterest } from "react-icons/fa";
import { getCompanyContact } from "@/actions/contact";
import { getFooterData } from "@/actions/footer"; // Import the new action

const FooterLinkGroup = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="py-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full md:cursor-default group"
      >
        <h3 className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
          {title}
        </h3>
        <ChevronDown
          size={14}
          className={`transition-transform md:hidden text-white/70 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`mt-1.5 space-y-0.5 transition-all overflow-hidden md:block ${
          isOpen ? "max-h-96" : "max-h-0 md:max-h-none"
        }`}
      >
        {children}
      </div>
    </div>
  );
};

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [companyContact, setCompanyContact] = useState(null);
  const [footerData, setFooterData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch company contact info and footer data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both in parallel
        const [contactResponse, footerResponse] = await Promise.all([
          getCompanyContact(),
          getFooterData(),
        ]);

        if (contactResponse.success && contactResponse.contact) {
          setCompanyContact(contactResponse.contact);
        }

        if (footerResponse.success && footerResponse.categories) {
          setFooterData(footerResponse.categories);
        }
      } catch (error) {
        console.error("Failed to load footer data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <footer className="w-full bg-gradient-to-b from-[#7B3B24] to-[#5A2714] text-white">
      <div className="px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
          {/* Logo and Description - 4 columns on md+ */}
          <div className="md:col-span-4">
            <div className="flex flex-col space-y-4">
              {/* Logo */}
              <Link href="/" className="inline-block">
                <div className="flex items-center">
                  <div className="relative w-36 h-12">
                    <Image
                      src="/assets/images/logo.png"
                      alt="Kauthuk Logo"
                      fill
                      className="object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.parentNode.innerHTML =
                          '<span class="text-xl font-bold text-white">Kauthuk</span>';
                      }}
                    />
                  </div>
                </div>
              </Link>

              {/* Condensed Description */}
              <p className="text-white/80 text-sm poppins">
                {loading ? (
                  <span className="inline-block w-full animate-pulse">
                    <span className="h-3 bg-white/20 rounded w-full block mb-1"></span>
                    <span className="h-3 bg-white/20 rounded w-5/6 block"></span>
                  </span>
                ) : companyContact?.description ? (
                  companyContact.description
                ) : (
                  "Kauthuk connects technology, art and artisans for eco-friendly living. We create unique handmade products and sustainable crafts with innovative designs for domestic & international markets."
                )}
              </p>

              {/* Social Icons */}
              {companyContact && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {companyContact.facebook_url && (
                    <a
                      href={companyContact.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all"
                    >
                      <Facebook size={14} />
                    </a>
                  )}
                  {companyContact.instagram_url && (
                    <a
                      href={companyContact.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all"
                    >
                      <Instagram size={14} />
                    </a>
                  )}
                  {companyContact.twitter_url && (
                    <a
                      href={companyContact.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Twitter"
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all"
                    >
                      <Twitter size={14} />
                    </a>
                  )}
                  {companyContact.pinterest_url && (
                    <a
                      href={companyContact.pinterest_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Pinterest"
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all"
                    >
                      <FaPinterest size={14} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Footer Categories - 8 columns dynamically divided */}
          <div className="md:col-span-8">
            {loading ? (
              // Loading state for footer links
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="animate-pulse">
                    <div className="h-4 bg-white/20 rounded w-24 mb-3"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-white/20 rounded w-3/4"></div>
                      <div className="h-3 bg-white/20 rounded w-2/3"></div>
                      <div className="h-3 bg-white/20 rounded w-5/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Dynamic footer categories
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {footerData.length > 0 &&
                  footerData.map((category) => (
                    <div key={category.id} className="playfair">
                      <FooterLinkGroup title={category.title}>
                        <ul className="space-y-0.5 poppins">
                          {category.FooterLinks.map((link) => (
                            <li key={link.id}>
                              {link.isExternal ? (
                                <a
                                  href={link.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-white/70 hover:text-white transition-colors flex items-center group"
                                >
                                  {link.title}
                                  <ExternalLink size={10} className="ml-1" />
                                </a>
                              ) : (
                                <Link
                                  href={link.link}
                                  className="text-xs text-white/70 hover:text-white transition-colors group"
                                >
                                  {link.title}
                                </Link>
                              )}
                            </li>
                          ))}
                        </ul>
                      </FooterLinkGroup>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Contact Section - Positioned at the bottom */}
        <div className="mt-8 pt-4 border-t border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 playfair">
              <FooterLinkGroup title="Contact Us">
                {companyContact ? (
                  <div className="space-y-2">
                    <div className="flex items-start group">
                      <MapPin
                        size={12}
                        className="mt-0.5 mr-1.5 flex-shrink-0 text-white/70 group-hover:text-white transition-colors"
                      />
                      <p className="text-xs text-white/70 group-hover:text-white transition-colors poppins">
                        {companyContact.address_line1}
                        {companyContact.address_line2 && (
                          <>
                            <br />
                            {companyContact.address_line2}
                          </>
                        )}
                        <br />
                        {companyContact.city}, {companyContact.state}{" "}
                        {companyContact.postal_code}
                      </p>
                    </div>
                    <div className="flex items-center group">
                      <Phone
                        size={12}
                        className="mr-1.5 flex-shrink-0 text-white/70 group-hover:text-white transition-colors"
                      />
                      <a
                        href={`tel:${companyContact.phone}`}
                        className="text-xs text-white/70 group-hover:text-white transition-colors"
                      >
                        {companyContact.phone}
                      </a>
                    </div>
                    <div className="flex items-center group">
                      <Mail
                        size={12}
                        className="mr-1.5 flex-shrink-0 text-white/70 group-hover:text-white transition-colors"
                      />
                      <a
                        href={`mailto:${companyContact.email}`}
                        className="text-xs text-white/70 group-hover:text-white transition-colors"
                      >
                        {companyContact.email}
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start">
                    <MapPin
                      size={12}
                      className="mt-0.5 mr-1.5 flex-shrink-0 text-white/70"
                    />
                    <p className="text-xs text-white/70">
                      Contact information unavailable
                    </p>
                  </div>
                )}
              </FooterLinkGroup>
            </div>
            
            <div className="md:col-span-2">
              {/* Empty space for now or could add a newsletter signup form */}
            </div>
          </div>
        </div>

        {/* Bottom Footer - Copyright and Links */}
        <div className="mt-8 pt-4 border-t border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="text-xs text-white/60">
              © {currentYear} Kauthuk. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/pages/privacy"
                className="text-xs text-white/60 hover:text-white/90 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/pages/terms"
                className="text-xs text-white/60 hover:text-white/90 transition-colors"
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