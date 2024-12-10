import React, { useState, useEffect } from 'react';

const ParticleBackground: React.FC = () => {
  const [particles, setParticles] = useState<Array<{
    width: number;
    height: number;
    left: number;
    top: number;
    delay: number;
    duration: number;
  }>>([]);

  useEffect(() => {
    // Only generate particles client-side
    const particleArray = Array(50).fill(null).map(() => ({
      width: Math.random() * 10 + 2,
      height: Math.random() * 10 + 2,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 10,
      duration: Math.random() * 20 + 10
    }));

    setParticles(particleArray);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle, i) => (
        <div 
          key={i} 
          className="absolute bg-white/10 rounded-full animate-float"
          style={{
            width: `${particle.width}px`,
            height: `${particle.height}px`,
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`
          }}
        />
      ))}
    </div>
  );
};

export default ParticleBackground;