import { Heart, Stethoscope, Calendar, Shield, Users, Activity, ArrowRight, Building2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}

export function LandingPage({ onNavigateToLogin, onNavigateToRegister }: LandingPageProps) {
  // Background image configuration
  // To use your own image:
  // 1. Place your image file in the 'public' folder (e.g., public/background.jpg)
  // 2. Replace the URL below with '/background.jpg' or your image filename
  // 3. Recommended: Use high-quality healthcare/medical themed images (1920x1080 or larger)
  // 4. Keep file size under 500KB for optimal loading performance
  const backgroundImageUrl = '../../public/background.jpg';
  
  const features = [
    {
      icon: Calendar,
      title: 'Easy Appointments',
      description: 'Book your medical appointments online with just a few clicks. Choose your preferred doctor and time slot.',
    },
    {
      icon: Stethoscope,
      title: 'Expert Care',
      description: 'Connect with qualified doctors and healthcare professionals from top hospitals in your area.',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your medical records and personal information are protected with industry-standard security.',
    },
    {
      icon: Activity,
      title: 'Health Tracking',
      description: 'Monitor your vital signs, lab results, and medical history all in one convenient place.',
    },
    {
      icon: Heart,
      title: 'Pharmacy Integration',
      description: 'Get your prescriptions filled at partner pharmacies with automatic insurance processing.',
    },
    {
      icon: Users,
      title: 'Insurance Support',
      description: 'Seamlessly manage your insurance claims and payments directly through the platform.',
    },
  ];

  return (
    <div className="min-h-screen relative">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${backgroundImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Multiple gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/85 via-teal-900/75 to-cyan-900/85"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/20 via-transparent to-emerald-900/30"></div>
      </div>
      
      {/* Content Container */}
      <div className="relative z-10 min-h-screen">
      {/* Navigation Bar */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-emerald-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-600 p-2 rounded-lg shadow-lg">
                <Building2 className="text-white" size={24} />
              </div>
              <span className="text-2xl font-bold text-gray-900 drop-shadow-sm">EasyHealth</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="secondary"
                onClick={onNavigateToLogin}
                className="hidden sm:inline-flex"
              >
                Sign In
              </Button>
              <Button
                onClick={onNavigateToRegister}
                className="hidden sm:inline-flex"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-white/20 backdrop-blur-md p-4 rounded-full animate-pulse border-2 border-white/30 shadow-xl">
              <Heart className="text-white" size={48} />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 drop-shadow-lg">
            Your Health,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300">
              Made Easy
            </span>
          </h1>
          <p className="text-xl sm:text-2xl text-emerald-50 max-w-3xl mx-auto mb-10 drop-shadow-md">
            Experience seamless healthcare management. Book appointments, track your health, 
            manage prescriptions, and connect with healthcare professionals—all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={onNavigateToRegister}
              className="group"
            >
              Get Started Free
              <ArrowRight className="inline ml-2 group-hover:translate-x-1 transition-transform" size={20} />
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={onNavigateToLogin}
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 drop-shadow-lg">
            Everything You Need for Better Healthcare
          </h2>
          <p className="text-lg text-emerald-50 max-w-2xl mx-auto drop-shadow-md">
            EasyHealth provides all the tools you need to manage your health and healthcare needs efficiently.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-emerald-100 hover:border-emerald-200"
              >
                <div className="bg-emerald-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="text-emerald-600" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white/70 backdrop-blur-md border-t border-b border-emerald-200/50 py-12 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-emerald-600 mb-2">100+</div>
              <div className="text-sm sm:text-base text-gray-600">Partner Hospitals</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-emerald-600 mb-2">500+</div>
              <div className="text-sm sm:text-base text-gray-600">Expert Doctors</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-emerald-600 mb-2">50+</div>
              <div className="text-sm sm:text-base text-gray-600">Pharmacy Partners</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-emerald-600 mb-2">24/7</div>
              <div className="text-sm sm:text-base text-gray-600">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 sm:p-12 text-center text-white shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Transform Your Healthcare Experience?
          </h2>
          <p className="text-lg sm:text-xl mb-8 text-emerald-50 max-w-2xl mx-auto">
            Join thousands of patients who trust EasyHealth for their medical needs. 
            Get started today and take control of your health journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              onClick={onNavigateToRegister}
              className="bg-white text-emerald-600 hover:bg-emerald-50"
            >
              Create Free Account
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={onNavigateToLogin}
              className="bg-emerald-700 text-white hover:bg-emerald-800 border border-white"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900/95 backdrop-blur-sm text-gray-300 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 sm:mb-0">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <Building2 className="text-white" size={20} />
              </div>
              <span className="text-lg font-bold text-white">EasyHealth</span>
            </div>
            <p className="text-sm text-center sm:text-right">
              © {new Date().getFullYear()} EasyHealth. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}

