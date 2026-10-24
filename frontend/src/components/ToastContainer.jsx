import { AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import useStore from '../store/useStore'

function ToastContainer() {
    const { toasts, removeToast } = useStore()

    return (
        <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border bg-white ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' :
                                toast.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' :
                                    'border-primary-200 bg-primary-50 text-primary-800'
                            }`}
                    >
                        {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> :
                            toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-600" /> :
                                <Info className="w-5 h-5 text-primary-600" />}
                        <span className="font-medium text-sm">{toast.message}</span>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </AnimatePresence>
        </div>
    )
}

export default ToastContainer
