import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../design-system/components';

const slides = [
  {
    title: 'Discover Premium Healthcare Worldwide',
    description: 'Access top clinics, hospitals, and specialists across the globe with verified credentials and transparent pricing.',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop',
  },
  {
    title: 'Book Beauty & Wellness Services',
    description: 'Find and book treatments at premium salons, spas, gyms, and wellness centers in your area or abroad.',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=600&fit=crop',
  },
  {
    title: 'All-in-One Travel & Care Support',
    description: 'Get hotels, transfers, translation, insurance, and post-care follow-up all in one seamless platform.',
    image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&h=600&fit=crop',
  },
  {
    title: 'Earn Rewards & Save More',
    description: 'Join our loyalty club, earn points on every booking, unlock exclusive deals, and refer friends for rewards.',
    image: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=800&h=600&fit=crop',
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate('/login');
    }
  };
  
  const handleSkip = () => {
    navigate('/login');
  };
  
  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Skip Button */}
      <div className="px-6 py-4 flex justify-end">
        <button
          onClick={handleSkip}
          className="text-gray-500 font-medium hover:text-gray-700 transition"
        >
          Skip
        </button>
      </div>
      
      {/* Slides */}
      <div className="flex-1 overflow-hidden">
        <div 
          className="h-full flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div key={index} className="w-full flex-shrink-0 px-6 flex flex-col items-center justify-center">
              <div className="w-full max-w-md">
                {/* Image */}
                <div className="aspect-square rounded-3xl overflow-hidden mb-8 shadow-lg">
                  <img 
                    src={slide.image} 
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Content */}
                <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
                  {slide.title}
                </h2>
                <p className="text-gray-600 text-center text-lg leading-relaxed">
                  {slide.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Indicators and Button */}
      <div className="px-6 py-8 space-y-6">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide 
                  ? 'w-8 bg-[#083f30]' 
                  : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>
        
        {/* Button */}
        <Button 
          variant="primary" 
          size="lg" 
          className="w-full"
          onClick={handleNext}
        >
          {currentSlide < slides.length - 1 ? 'Next' : 'Get Started'}
        </Button>
      </div>
    </div>
  );
}
