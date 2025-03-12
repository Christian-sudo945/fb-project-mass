'use client'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

export default function ErrorPage() {
  const errorMessages: Record<string, string> = {
    No_code_provided: 'Authentication code was not provided',
    Auth_failed: 'Authentication failed',
    Server_error: 'Server error occurred',
  }

  function ErrorContent() {
    const searchParams = useSearchParams()
    const message = searchParams.get('message')
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
      >
        <div className="flex items-center gap-4 mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Error Occurred</h1>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          {errorMessages[message as string] || 'An unexpected error occurred'}
        </p>

        <Link 
          href="/"
          className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Return to Home
        </Link>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <Suspense fallback={<div>Loading...</div>}>
        <ErrorContent />
      </Suspense>
    </div>
  )
}
