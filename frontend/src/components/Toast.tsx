import { useEffect } from 'react'
import { CheckCircle2, X, ShoppingCart, AlertCircle, Info } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'cart'

interface ToastProps {
  message: string
  type?: ToastType
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  const config = {
    success: {
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      iconColor: 'text-emerald-500'
    },
    error: {
      icon: AlertCircle,
      gradient: 'from-red-500 to-rose-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      iconColor: 'text-red-500'
    },
    info: {
      icon: Info,
      gradient: 'from-blue-500 to-indigo-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      iconColor: 'text-blue-500'
    },
    cart: {
      icon: ShoppingCart,
      gradient: 'from-emerald-500 to-teal-600',
      bg: 'bg-white',
      border: 'border-emerald-200',
      text: 'text-gray-800',
      iconColor: 'text-white'
    }
  }

  const { icon: Icon, gradient, bg, border, text, iconColor } = config[type]

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-slide-in-right">
      <div className={`${bg} border-2 ${border} rounded-2xl shadow-2xl max-w-md overflow-hidden`}>
        <div className="flex items-start gap-4 p-4">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-lg`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pt-1">
            <p className={`${text} font-bold text-sm leading-relaxed`}>
              {message}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div 
            className={`h-full bg-gradient-to-r ${gradient} animate-progress`}
            style={{ animationDuration: `${duration}ms` }}
          />
        </div>
      </div>
    </div>
  )
}

// Add to your global CSS (index.css)
// @keyframes slide-in-right {
//   from {
//     transform: translateX(100%);
//     opacity: 0;
//   }
//   to {
//     transform: translateX(0);
//     opacity: 1;
//   }
// }
// 
// @keyframes progress {
//   from {
//     width: 100%;
//   }
//   to {
//     width: 0%;
//   }
// }
// 
// .animate-slide-in-right {
//   animation: slide-in-right 0.3s ease-out;
// }
// 
// .animate-progress {
//   animation: progress linear;
// }
