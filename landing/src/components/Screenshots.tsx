import { motion } from 'framer-motion'
import { Smartphone, Monitor, Tablet } from 'lucide-react'

export const Screenshots = () => {
  const screenshots = [
    {
      title: "Beautiful Chat Interface",
      description: "Clean, modern design with smooth animations",
      device: Monitor,
      color: "from-blue-500 to-purple-600"
    },
    {
      title: "Mobile Experience",
      description: "Optimized for all screen sizes",
      device: Smartphone,
      color: "from-green-500 to-teal-600"
    },
    {
      title: "Tablet Ready",
      description: "Perfect for larger mobile devices",
      device: Tablet,
      color: "from-orange-500 to-pink-600"
    }
  ]

  return (
    <section id="screenshots" className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="neon-text">Available Everywhere</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Experience Nebula Chat on all your devices with our responsive design
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {screenshots.map((screenshot, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="glass-morphism p-8 rounded-2xl"
            >
              <div className={`h-64 bg-gradient-to-br ${screenshot.color} rounded-xl mb-6 flex items-center justify-center animate-pulse-slow`}>
                <screenshot.device className="w-24 h-24 text-white/80" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">{screenshot.title}</h3>
              <p className="text-gray-300">{screenshot.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}