import { motion } from 'framer-motion'
import { MessageCircle, Users, Globe, Zap, Shield, Heart, Star, Coffee } from 'lucide-react'

export const Features = () => {
  const features = [
    {
      icon: MessageCircle,
      title: "Real-time Messaging",
      description: "Instant message delivery with WebSocket technology"
    },
    {
      icon: Users,
      title: "Mental Channels",
      description: "Unique communication spaces for different mindsets"
    },
    {
      icon: Globe,
      title: "Cloud Rooms",
      description: "Persistent spaces that float across devices"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimized for speed with Cloudflare Workers"
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Your data is yours, encrypted and secure"
    },
    {
      icon: Heart,
      title: "Emotional Responses",
      description: "Dynamic reactions that adapt to conversation context"
    }
  ]

  return (
    <section id="features" className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="neon-text">Revolutionary Features</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Experience messaging reimagined with unique features you won't find anywhere else
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="glass-morphism p-8 rounded-2xl hover:scale-105 transition-transform duration-300"
            >
              <feature.icon className="w-12 h-12 text-cyan-400 mb-4" />
              <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 glass-morphism p-8 rounded-3xl"
        >
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0">
              <h3 className="text-3xl font-bold mb-2 neon-text">What Makes Us Different?</h3>
              <p className="text-gray-300 max-w-2xl">
                We're not just another messenger. We're rethinking how people connect online with 
                innovative features like mental channels and cloud rooms.
              </p>
            </div>
            <div className="flex space-x-4">
              <Star className="w-8 h-8 text-yellow-400" />
              <Coffee className="w-8 h-8 text-brown-400" />
              <Heart className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}