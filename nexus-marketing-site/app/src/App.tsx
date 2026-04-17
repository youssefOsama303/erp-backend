import { useEffect, useState } from 'react'
import './App.css'
import { Navbar } from './sections/Navbar'
import { Hero } from './sections/Hero'
import { Features } from './sections/Features'
import { Modules } from './sections/Modules'
import { Pricing } from './sections/Pricing'
import { Testimonials } from './sections/Testimonials'
import { CTA } from './sections/CTA'
import { Footer } from './sections/Footer'
import { Toaster } from '@/components/ui/sonner'

function App() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <div className={`min-h-screen bg-[#0a0f1c] transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Modules />
        <Pricing />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
      <Toaster />
    </div>
  )
}

export default App
