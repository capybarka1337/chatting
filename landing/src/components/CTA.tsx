import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'

export const CTA = () => {
  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="glass-morphism p-12 rounded-3xl text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-accent-500/20 animate-pulse-slow"></div>
          
          <div className="relative z-10">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-6"
            >
              <Sparkles className="w-12 h-12 text-yellow-400" />
            </motion.div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="neon-text">Ready to Join the Future?</span>
            </h2>

            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Start connecting with friends, family, and colleagues in a whole new way. 
              No credit card required.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/register"
                className="button-primary group flex items-center justify-center space-x-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="/app"
                className="px-8 py-4 rounded-full border-2 border-cyan-400 text-cyan-400 font-semibold hover:bg-cyan-400 hover:text-white transition-all duration-300"
              >
                Try Demo
              </a>
            </div>

            <p className="text-sm text-gray-400 mt-6">
              Join 10,000+ users already on Nebula Chat
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}