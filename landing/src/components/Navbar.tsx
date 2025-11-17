import { motion } from 'framer-motion'
import { MessageCircle, Menu, X } from 'lucide-react'
import { useState } from 'react'

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 w-full z-50 glass-morphism px-6 py-4"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-8 h-8 text-cyan-400" />
          <span className="text-2xl font-bold neon-text">Nebula Chat</span>
        </div>

        <div className="hidden md:flex items-center space-x-8">
          <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
          <a href="#screenshots" className="hover:text-cyan-400 transition-colors">Screenshots</a>
          <a href="#about" className="hover:text-cyan-400 transition-colors">About</a>
          <a 
            href="/login" 
            className="button-primary"
          >
            Sign In
          </a>
          <a 
            href="/register" 
            className="px-8 py-4 rounded-full border-2 border-cyan-400 text-cyan-400 font-semibold hover:bg-cyan-400 hover:text-white transition-all duration-300"
          >
            Get Started
          </a>
        </div>

        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden mt-4 glass-morphism rounded-xl p-4"
        >
          <div className="flex flex-col space-y-4">
            <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
            <a href="#screenshots" className="hover:text-cyan-400 transition-colors">Screenshots</a>
            <a href="#about" className="hover:text-cyan-400 transition-colors">About</a>
            <a href="/login" className="button-primary text-center">Sign In</a>
            <a href="/register" className="border-2 border-cyan-400 text-cyan-400 font-semibold hover:bg-cyan-400 hover:text-white transition-all duration-300 rounded-full py-3 text-center">
              Get Started
            </a>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}