import { motion } from 'framer-motion'
import { ArrowRight, MessageCircle, Zap, Shield, Globe, Sparkles } from 'lucide-react'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { Features } from './components/Features'
import { Screenshots } from './components/Screenshots'
import { CTA } from './components/CTA'
import { Footer } from './components/Footer'

function App() {
  return (
    <div className="min-h-screen text-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <Features />
      <Screenshots />
      <CTA />
      <Footer />
    </div>
  )
}

export default App