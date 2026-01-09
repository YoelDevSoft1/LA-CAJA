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
  const particleCount = 100
  const logoRadius = 80 // Radio del círculo alrededor del logo
  const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : 0
  const centerY = typeof window !== 'undefined' ? window.innerHeight / 2 : 0

  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => {
      // Posición inicial aleatoria en toda la pantalla
      const startX = Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920)
      const startY = Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080)
      
      // Posición final en círculo alrededor del logo
      const angle = (i / particleCount) * Math.PI * 2
      const endX = centerX + Math.cos(angle) * logoRadius
      const endY = centerY + Math.sin(angle) * logoRadius
      
      // Tamaño variado
      const size = Math.random() * 3 + 2
      
      // Delay escalonado para efecto de recolección
      const delay = (i / particleCount) * 0.3
      
      return {
        startX,
        startY,
        endX,
        endY,
        size,
        delay,
        angle,
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
          {/* Partículas que se recogen en círculo alrededor del logo */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((particle, i) => {
              // Calcular progreso de animación con easing suave
              const normalizedProgress = Math.min(progress / 100, 1)
              const easedProgress = normalizedProgress < 0.5
                ? 2 * normalizedProgress * normalizedProgress
                : 1 - Math.pow(-2 * normalizedProgress + 2, 3) / 2
              
              // Solo animar si ha pasado el delay
              const shouldAnimate = easedProgress > particle.delay
              const animationProgress = shouldAnimate 
                ? Math.min((easedProgress - particle.delay) / (1 - particle.delay), 1)
                : 0
              
              // Interpolación suave de posición
              const currentX = particle.startX + (particle.endX - particle.startX) * animationProgress
              const currentY = particle.startY + (particle.endY - particle.startY) * animationProgress
              
              // Opacidad: empieza visible, se intensifica al llegar al círculo
              const opacity = shouldAnimate 
                ? 0.4 + animationProgress * 0.6
                : 0.3
              
              // Escala: crece al llegar al círculo
              const scale = shouldAnimate
                ? 1 + animationProgress * 0.5
                : 1
              
              return (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: `${particle.size}px`,
                    height: `${particle.size}px`,
                    left: `${currentX}px`,
                    top: `${currentY}px`,
                    backgroundColor: 'rgb(13, 129, 206)', // Color azul del logo
                    opacity: opacity,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    boxShadow: `0 0 ${particle.size * 2}px rgba(13, 129, 206, ${opacity * 0.6})`,
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
                  {/* Logo real con glow sutil */}
                  <motion.div
                    className="relative"
                    animate={{
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
                    <div className="relative bg-white p-4 rounded-2xl shadow-2xl border-2 border-slate-200/50">
                      <img 
                        src="/favicon.svg" 
                        alt="LA CAJA Logo" 
                        className="w-16 h-16"
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

                  {/* Barra de progreso con porcentaje */}
                  <motion.div
                    className="flex flex-col items-center gap-2 mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <motion.div
                      className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden"
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: 'rgb(13, 129, 206)', // Color azul del logo
                          boxShadow: `0 0 8px rgba(13, 129, 206, 0.5)`,
                        }}
                        transition={{
                          duration: 0.1,
                          ease: 'linear',
                        }}
                      />
                    </motion.div>
                    <motion.span
                      className="text-sm font-semibold"
                      style={{
                        color: 'rgb(13, 129, 206)', // Color azul del logo
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
                    Bienvenido{firstName && firstName.toLowerCase().endsWith('a') ? 'a' : ''}
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

