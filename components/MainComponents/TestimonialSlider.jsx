"use client"
import { getTestimonials } from '@/actions/testimonial';
import { Quote, Star, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { Autoplay, Navigation, Pagination, EffectFade } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

const TestimonialCard = ({ name, location, description, rating = 5, role = "Customer" }) => (
  <div className="relative bg-white rounded-xl shadow-md p-8 md:p-10 overflow-hidden transition-all duration-300 h-full flex flex-col">
    {/* Subtle top accent line */}
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#6B2F1A] to-[#F0B775]"></div>
    
    <div className="testimonial-content flex-1 relative z-10">
      <Quote className="w-10 h-10 text-[#6B2F1A]/10 absolute -top-1 -left-1" />
      
      <p className="font-poppins text-lg leading-relaxed text-gray-700 mb-6 mt-6 relative z-10">
        "{description}"
      </p>
      
      <div className="mt-auto pt-4 border-t border-gray-100">
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              className={`w-4 h-4 ${i < rating ? 'text-[#F0B775] fill-[#F0B775]' : 'text-gray-200'}`}
            />
          ))}
        </div>
        
        <div className="flex items-center">
          <div className="flex-shrink-0 mr-3">
            <div className="w-10 h-10 rounded-full bg-[#F9F4F0] flex items-center justify-center">
              <span className="font-playfair text-[#6B2F1A] text-base font-semibold">{name.charAt(0)}</span>
            </div>
          </div>
          
          <div>
            <h4 className="font-playfair text-base font-semibold text-[#6B2F1A]">
              {name}
            </h4>
            
            <div className="flex items-center text-gray-500 mt-0.5">
              <MapPin className="w-3 h-3 mr-1 text-[#6B2F1A]/60" />
              <span className="font-poppins text-xs">{location}</span>
              <span className="mx-1.5 text-gray-300">•</span>
              <span className="font-poppins text-xs text-[#6B2F1A]/80">
                {role}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const TestimonialSlider = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoading(true);
        const response = await getTestimonials({
          limit: 10,
          status: 'active',
          sort: 'rating_high'
        });
        
        if (response && response.testimonials) {
          setTestimonials(response.testimonials.slice(0, 10));
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching testimonials:', err);
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  if (loading || !testimonials || testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-white to-[#F9F4F0] overflow-hidden">
      <div className="max-w-6xl mx-auto relative">
        <div className="text-center mb-12">
          <div className="inline-block bg-[#6B2F1A]/10 rounded-full px-4 py-1 mb-3">
            <p className="font-poppins text-xs font-medium uppercase tracking-wider text-[#6B2F1A]">
              Testimonials
            </p>
          </div>
          
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-[#6B2F1A] mb-3">
            What Our Customers Say
          </h2>
          
          <p className="font-poppins text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
            Discover authentic stories from our customers who have experienced the artistry and craftsmanship of our handcrafted treasures
          </p>
        </div>
        
        <div className="relative mx-auto">
          {/* Multi-card layout with fade effect */}
          <div className="md:px-10">
            <Swiper
              modules={[Navigation, Pagination, Autoplay, EffectFade]}
              spaceBetween={20}
              slidesPerView={1}
              effect="fade"
              speed={600}
              navigation={{
                prevEl: prevRef.current,
                nextEl: nextRef.current,
              }}
              breakpoints={{
                768: {
                  slidesPerView: 1,
                  effect: "fade"
                }
              }}
              pagination={{
                clickable: true,
                dynamicBullets: true,
                renderBullet: function (index, className) {
                  return `<span class="${className} hidden"></span>`;
                }
              }}
              autoplay={{
                delay: 6000,
                disableOnInteraction: false,
              }}
              onInit={(swiper) => {
                swiper.params.navigation.prevEl = prevRef.current;
                swiper.params.navigation.nextEl = nextRef.current;
                swiper.navigation.init();
                swiper.navigation.update();
              }}
              onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
              className="testimonial-slider pb-16"
            >
              {testimonials.map((testimonial) => (
                <SwiperSlide key={testimonial.id} className="py-6 px-2">
                  <TestimonialCard 
                    name={testimonial.name}
                    location={testimonial.location}
                    description={testimonial.description}
                    rating={testimonial.rating || 5}
                    role={testimonial.role || "Verified Customer"}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Custom navigation - now as floating absolute circles */}
          <button 
            ref={prevRef}
            className="absolute -left-1 md:-left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/90 backdrop-blur-sm shadow-lg text-[#6B2F1A] hover:bg-[#6B2F1A] hover:text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#6B2F1A]/20"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button 
            ref={nextRef}
            className="absolute -right-1 md:-right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/90 backdrop-blur-sm shadow-lg text-[#6B2F1A] hover:bg-[#6B2F1A] hover:text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#6B2F1A]/20"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          
          {/* Modern progress indicators */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-10 flex justify-center gap-1.5 mb-4">
            {testimonials.map((_, i) => (
              <button 
                key={i}
                onClick={() => {}} // Swiper will handle this
                className={`h-1 rounded-full transition-all duration-300 focus:outline-none ${
                  i === activeIndex ? 'w-8 bg-[#6B2F1A]' : 'w-2 bg-[#6B2F1A]/20'
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
              ></button>
            ))}
          </div>
        </div>
        
        {/* Subtle decorative elements */}
        <div className="absolute -left-20 -bottom-20 w-40 h-40 rounded-full bg-[#6B2F1A]/5 blur-xl z-0"></div>
        <div className="absolute -right-12 top-0 w-28 h-28 rounded-full bg-[#6B2F1A]/5 blur-xl z-0"></div>
        <div className="absolute right-1/3 bottom-10 w-12 h-12 rounded-full bg-[#F0B775]/10 blur-md z-0"></div>
        
        {/* Add custom styles */}
        <style jsx global>{`
          .swiper-fade .swiper-slide {
            opacity: 0 !important;
            transition: opacity 0.6s ease;
          }
          
          .swiper-fade .swiper-slide-active {
            opacity: 1 !important;
          }
          
          .testimonial-slider .swiper-button-disabled {
            opacity: 0.3;
            cursor: not-allowed;
          }
          
          .testimonial-slider .swiper-pagination {
            display: none;
          }
        `}</style>
      </div>
    </section>
  );
};

export default TestimonialSlider;