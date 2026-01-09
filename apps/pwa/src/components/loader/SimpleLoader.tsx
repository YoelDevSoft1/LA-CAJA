import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useMemo } from 'react'

interface SimpleLoaderProps {
  onComplete?: () => void
  duration?: number
  userName?: string | null
}

/**
 * Loader avanzado con partículas que se recogen en círculo alrededor del logo
 * Optimizado para rendimiento sin sacrificar la estética
 */
export default function SimpleLoader({
  onComplete,
  duration = 4000,
  userName,
}: SimpleLoaderProps) {
  // Obtener primer nombre del usuario
  const getFirstName = (fullName: string | null | undefined): string => {
    if (!fullName) return 'Usuario'
    return fullName.split(' ')[0] || 'Usuario'
  }

  const firstName = getFirstName(userName)
  const [isComplete, setIsComplete] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showWelcome, setShowWelcome] = useState(false)

  // Calcular posiciones iniciales y finales de las partículas
  const particleCount = 400 // Muchas más partículas para círculo denso y épico
  const logoRadius = 200 // Círculo grande y visible
  const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : 0
  const centerY = typeof window !== 'undefined' ? window.innerHeight / 2 : 0

  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => {
      // Posición inicial aleatoria en toda la pantalla (muy dispersa)
      const angle = Math.random() * Math.PI * 2
      const maxDistance = Math.max(
        typeof window !== 'undefined' ? window.innerWidth : 1920,
        typeof window !== 'undefined' ? window.innerHeight : 1080
      ) * 0.7
      const distance = Math.random() * maxDistance
      const startX = centerX + Math.cos(angle) * distance
      const startY = centerY + Math.sin(angle) * distance
      
      // Posición final en un solo círculo denso y perfecto
      // Distribución uniforme para evitar gaps
      const finalAngle = (i / particleCount) * Math.PI * 2
      // Pequeña variación aleatoria en el radio para hacerlo más orgánico pero denso
      const radiusVariation = logoRadius + (Math.random() - 0.5) * 8
      const endX = centerX + Math.cos(finalAngle) * radiusVariation
      const endY = centerY + Math.sin(finalAngle) * radiusVariation
      
      // Tamaño variado pero más consistente
      const size = Math.random() * 3 + 4
      
      // Delay escalonado más suave para recolección fluida
      const delay = (i / particleCount) * 0.4
      
      return {
        startX,
        startY,
        endX,
        endY,
        size,
        delay,
        angle: finalAngle,
      }
    })
  }, [centerX, centerY, logoRadius])

  useEffect(() => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const currentProgress = Math.min((elapsed / duration) * 100, 100)
      setProgress(currentProgress)
      
      if (currentProgress >= 100) {
        clearInterval(interval)
        // Mostrar mensaje de bienvenida cuando las partículas terminen
        setShowWelcome(true)
        // Completar la animación después de mostrar el mensaje
        setTimeout(() => {
          setIsComplete(true)
          onComplete?.()
        }, 2000) // 2 segundos para mostrar el mensaje de bienvenida
      }
    }, 16) // ~60fps

    return () => clearInterval(interval)
  }, [duration, onComplete])

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-white flex items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {/* Círculo guía animado más visible que se forma mientras las partículas se recogen */}
          <motion.div
            className="absolute pointer-events-none"
            style={{
              left: `${centerX}px`,
              top: `${centerY}px`,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: progress > 20 ? 0.5 : 0,
              scale: progress > 20 ? 1 : 0,
            }}
            transition={{ duration: 0.5 }}
          >
            <svg width={logoRadius * 2 + 60} height={logoRadius * 2 + 60} className="overflow-visible">
              <circle
                cx={(logoRadius * 2 + 60) / 2}
                cy={(logoRadius * 2 + 60) / 2}
                r={logoRadius}
                fill="none"
                stroke="rgba(13, 129, 206, 0.4)"
                strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * logoRadius}`}
                strokeDashoffset={`${2 * Math.PI * logoRadius * (1 - progress / 100)}`}
                style={{
                  transition: 'stroke-dashoffset 0.1s linear',
                  filter: 'drop-shadow(0 0 8px rgba(13, 129, 206, 0.5))',
                }}
              />
            </svg>
          </motion.div>

          {/* Partículas que se recogen en círculo alrededor del logo */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((particle, i) => {
              // Calcular progreso de animación con easing más suave y dramático
              const normalizedProgress = Math.min(progress / 100, 1)
              const easedProgress = normalizedProgress < 0.5
                ? 2 * normalizedProgress * normalizedProgress
                : 1 - Math.pow(-2 * normalizedProgress + 2, 3) / 2
              
              // Solo animar si ha pasado el delay
              const shouldAnimate = easedProgress > particle.delay
              const animationProgress = shouldAnimate 
                ? Math.min((easedProgress - particle.delay) / (1 - particle.delay), 1)
                : 0
              
              // Interpolación suave con easing adicional para movimiento más natural
              const smoothProgress = animationProgress < 0.5
                ? 2 * animationProgress * animationProgress
                : 1 - Math.pow(-2 * animationProgress + 2, 2) / 2
              
              const currentX = particle.startX + (particle.endX - particle.startX) * smoothProgress
              const currentY = particle.startY + (particle.endY - particle.startY) * smoothProgress
              
              // Opacidad: más visible desde el inicio, muy intensa al llegar
              const opacity = shouldAnimate 
                ? Math.min(0.6 + smoothProgress * 0.5, 1)
                : 0.5
              
              // Escala: crece suavemente al llegar
              const scale = shouldAnimate
                ? 0.8 + smoothProgress * 0.6
                : 0.8
              
              return (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: `${particle.size}px`,
                    height: `${particle.size}px`,
                    left: `${currentX}px`,
                    top: `${currentY}px`,
                    background: `radial-gradient(circle, rgba(13, 129, 206, 1) 0%, rgba(13, 129, 206, 0.9) 40%, rgba(13, 129, 206, 0.6) 100%)`,
                    opacity: opacity,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    boxShadow: `0 0 ${particle.size * 4}px rgba(13, 129, 206, ${opacity * 0.9}), 
                                0 0 ${particle.size * 8}px rgba(13, 129, 206, ${opacity * 0.5}),
                                0 0 ${particle.size * 12}px rgba(13, 129, 206, ${opacity * 0.2})`,
                  }}
                  animate={{
                    opacity: opacity,
                    scale: scale,
                  }}
                  transition={{
                    duration: 0.1,
                    ease: 'linear',
                  }}
                />
              )
            })}
          </div>

          {/* Efecto de pulso épico en el centro cuando las partículas se recogen */}
          {progress > 60 && (
            <>
              <motion.div
                className="absolute pointer-events-none"
                style={{
                  left: `${centerX}px`,
                  top: `${centerY}px`,
                  transform: 'translate(-50%, -50%)',
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.2, 0.5, 0.2],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <div 
                  className="rounded-full"
                  style={{
                    width: `${logoRadius * 2}px`,
                    height: `${logoRadius * 2}px`,
                    background: 'radial-gradient(circle, rgba(13, 129, 206, 0.3) 0%, rgba(13, 129, 206, 0.1) 50%, transparent 80%)',
                  }}
                />
              </motion.div>
              {/* Segundo pulso más grande */}
              <motion.div
                className="absolute pointer-events-none"
                style={{
                  left: `${centerX}px`,
                  top: `${centerY}px`,
                  transform: 'translate(-50%, -50%)',
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.1, 0.3, 0.1],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.5,
                }}
              >
                <div 
                  className="rounded-full"
                  style={{
                    width: `${logoRadius * 2.5}px`,
                    height: `${logoRadius * 2.5}px`,
                    background: 'radial-gradient(circle, rgba(13, 129, 206, 0.2) 0%, transparent 70%)',
                  }}
                />
              </motion.div>
            </>
          )}
          {/* Contenedor central con transición logo -> bienvenida */}
          <div className="flex flex-col items-center gap-4 relative z-10">
            <AnimatePresence mode="wait">
              {!showWelcome ? (
                // Logo con barra de progreso
                <motion.div
                  key="logo"
                  className="flex flex-col items-center gap-4"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{
                    duration: 0.4,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                >
                  {/* Logo real con glow épico y animación mejorada */}
                  <motion.div
                    className="relative"
                    animate={{
                      rotate: [0, 5, -5, 0],
                      scale: progress > 80 ? [1, 1.05, 1] : 1,
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    {/* Múltiples capas de glow para efecto más épico */}
                    <motion.div 
                      className="absolute inset-0 blur-3xl rounded-full"
                      style={{
                        background: 'radial-gradient(circle, rgba(13, 129, 206, 0.4) 0%, rgba(13, 129, 206, 0.1) 50%, transparent 100%)',
                        width: '200%',
                        height: '200%',
                        left: '-50%',
                        top: '-50%',
                      }}
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.4, 0.6, 0.4],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                    <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full" />
                    <div className="relative bg-white p-6 rounded-3xl shadow-2xl border-2 border-slate-200/50 backdrop-blur-sm">
                      <img 
                        src="/favicon.svg" 
                        alt="LA CAJA Logo" 
                        className="w-20 h-20"
                      />
                    </div>
                  </motion.div>

                  {/* Texto LA CAJA */}
                  <motion.div
                    className="text-center"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    <motion.h2
                      className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                      animate={{
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      style={{
                        backgroundSize: '200% 200%',
                      }}
                    >
                      LA CAJA
                    </motion.h2>
                  </motion.div>

                  {/* Barra de progreso épica con porcentaje */}
                  <motion.div
                    className="flex flex-col items-center gap-3 mt-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <motion.div
                      className="w-64 h-3 bg-slate-200/50 rounded-full overflow-hidden shadow-inner relative"
                    >
                      <motion.div
                        className="h-full rounded-full relative overflow-hidden"
                        style={{
                          width: `${progress}%`,
                          background: 'linear-gradient(90deg, rgb(13, 129, 206) 0%, rgba(13, 129, 206, 0.8) 100%)',
                          boxShadow: `0 0 12px rgba(13, 129, 206, 0.6), 
                                      0 0 24px rgba(13, 129, 206, 0.3),
                                      inset 0 1px 0 rgba(255, 255, 255, 0.3)`,
                        }}
                        transition={{
                          duration: 0.1,
                          ease: 'linear',
                        }}
                      >
                        {/* Efecto de brillo animado en la barra */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                          animate={{
                            x: ['-100%', '200%'],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                        />
                      </motion.div>
                    </motion.div>
                    <motion.span
                      className="text-lg font-bold tracking-wider"
                      style={{
                        color: 'rgb(13, 129, 206)',
                        textShadow: '0 0 10px rgba(13, 129, 206, 0.3)',
                      }}
                      animate={{
                        scale: progress === 100 ? [1, 1.1, 1] : 1,
                      }}
                      transition={{
                        duration: 0.3,
                        repeat: progress === 100 ? Infinity : 0,
                      }}
                    >
                      {Math.round(progress)}%
                    </motion.span>
                  </motion.div>
                </motion.div>
              ) : (
                // Mensaje de bienvenida
                <motion.div
                  key="welcome"
                  className="flex flex-col items-center gap-4 text-center"
                  initial={{ scale: 0.8, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                >
                  <motion.h1
                    className="text-4xl font-bold"
                    style={{
                      color: 'rgb(13, 129, 206)', // Color azul del logo
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    {firstName && firstName.toLowerCase().endsWith('a') ? 'Bienvenida' : 'Bienvenido'}
                  </motion.h1>
                  {firstName && (
                    <motion.p
                      className="text-2xl font-semibold text-slate-700"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                    >
                      {firstName}
                    </motion.p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  )
}

