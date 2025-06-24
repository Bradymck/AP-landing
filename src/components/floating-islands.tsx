import { motion } from 'framer-motion';

export default function FloatingIslands() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute w-64 h-64 bg-gradient-to-br from-purple-600/30 to-blue-600/30 rounded-full filter blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          top: '20%',
          left: '20%',
        }}
      />
      <motion.div
        className="absolute w-96 h-96 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full filter blur-3xl"
        animate={{
          x: [0, -150, 0],
          y: [0, 100, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          top: '40%',
          right: '20%',
        }}
      />
    </div>
  );
} 