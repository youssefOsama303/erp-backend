import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, X, Zap } from 'lucide-react'
import { SITE_CONFIG } from '@/config'

const navLinks = [
  { name: 'المميزات', href: '#features' },
  { name: 'الوحدات', href: '#modules' },
  { name: 'الأسعار', href: '#pricing' },
  { name: 'تواصل معنا', href: '#contact' },
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#0a0f1c]/90 backdrop-blur-lg border-b border-cyan-500/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-cyan-500/30 transition-all">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              Nexus<span className="text-cyan-400">ERP</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-gray-300 hover:text-cyan-400 transition-colors text-sm font-medium"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => window.location.href = SITE_CONFIG.demoUrl}
              className="text-gray-300 hover:text-white hover:bg-white/10"
            >
              تسجيل الدخول
            </Button>
            <Button 
              onClick={() => window.location.href = SITE_CONFIG.demoUrl}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0"
            >
              جرب مجاناً
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-gray-300 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-800">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-gray-300 hover:text-cyan-400 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-gray-800">
                <Button
                  variant="ghost"
                  onClick={() => { window.location.href = SITE_CONFIG.demoUrl; setIsMobileMenuOpen(false); }}
                  className="text-gray-300 hover:text-white justify-start"
                >
                  تسجيل الدخول
                </Button>
                <Button 
                  onClick={() => { window.location.href = SITE_CONFIG.demoUrl; setIsMobileMenuOpen(false); }}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                >
                  جرب مجاناً
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
