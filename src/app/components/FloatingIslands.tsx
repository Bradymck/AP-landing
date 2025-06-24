'use client';

import * as React from "react";
import { motion } from "framer-motion";
import { useMediaQuery } from "react-responsive";

const FloatingIslands: React.FC = () => {
  const isMobile = useMediaQuery({ maxWidth: 768 });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full z-[1]">
        <img
          src="/AquaPrimeBG.png"
          alt="Background"
          className="w-full h-full object-cover blur-sm"
        />
      </div>

      {/* Bufficorn in back */}
      <motion.div
        className="absolute top-40 -right-20 w-[400px] h-[400px] opacity-60 z-[2]"
        animate={{
          x: isMobile ? 500 : 0,
          y: [0, -40, 0],
          rotate: [0, 2, 0],
        }}
        transition={{
          x: { duration: 0.5 },
          y: { duration: 8, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 8, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        <img
          src="/Bufficorn.png"
          alt="Floating Island"
          width={150}
          height={150}
          className="object-contain blur-[0.5px]"
        />
      </motion.div>

      {/* Other islands in front */}
      <motion.div
        className="absolute top-[12%] left-[20%] w-[180px] h-[180px] opacity-60 z-[3]"
        animate={{
          x: isMobile ? -500 : 0,
          y: [0, -12, 0],
          rotate: [0, 1.5, 0],
        }}
        transition={{
          x: { duration: 0.5 },
          y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 5, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        <img
          src="/headz.png"
          alt="Background Island 1"
          width={780}
          height={780}
          className="object-contain blur-[0.5px]"
        />
      </motion.div>

      <motion.div
        className="absolute top-[40%] right-[8%] w-[280px] h-[280px] opacity-80 z-[3]"
        animate={{
          x: isMobile ? 500 : 0,
          y: [0, -15, 0],
          rotate: [0, -1.5, 0],
        }}
        transition={{
          x: { duration: 0.5 },
          y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        <img
          src="/MemeFactoryCruiser.png"
          alt="Background Island 2"
          width={380}
          height={380}
          className="object-contain"
        />
      </motion.div>

      <motion.div
        className="absolute top-[100px] -left-70 w-[250px] h-[250px] opacity-70 z-[4]"
        animate={{
          x: isMobile ? -500 : 0,
          y: [0, 20, 0],
          rotate: [0, -2, 0],
        }}
        transition={{
          x: { duration: 0.5 },
          y: { duration: 10, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 10, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        <img
          src="/doge.png"
          alt="Floating Island"
          width={400}
          height={400}
          className="object-contain"
        />
      </motion.div>

      <motion.div
        className="absolute -bottom-20 -left-30 w-[500px] h-[500px] opacity-90 z-[5]"
        animate={{
          x: isMobile ? -500 : 0,
          y: [0, 20, 0],
          rotate: [0, -2, 0],
        }}
        transition={{
          x: { duration: 0.5 },
          y: { duration: 10, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 10, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        <img
          src="/Maverik.png"
          alt="Floating Island"
          width={400}
          height={400}
          className="object-contain"
        />
      </motion.div>
    </div>
  );
};

export default FloatingIslands;