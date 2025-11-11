import { motion } from "framer-motion";
import { Lock, MapPin, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Lock,
    title: "Secure Authentication",
    description: "ID card verification ensures only authorized users can vote",
    color: "text-success",
  },
  {
    icon: MapPin,
    title: "GPS Verification",
    description: "Location-based voting eligibility ensures votes are cast from authorized locations",
    color: "text-primary",
  },
  {
    icon: BarChart3,
    title: "Real-time Results",
    description: "Transparent vote counting and comprehensive history tracking for complete transparency",
    color: "text-warning",
  },
];

export const Features = () => {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Why Choose VoteEase?
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Built with security, transparency, and ease of use at its core
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="glass-card p-8 hover-scale hover-glow group"
            >
              <div className={`${feature.color} mb-4 inline-block`}>
                <feature.icon size={48} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-white/70 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
