import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface PaymentStatusProps {
  transactionId: string;
  uid: string;
  onFinish: (success: boolean) => void;
}

export const PaymentStatus: React.FC<PaymentStatusProps> = ({ transactionId, uid, onFinish }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await axios.get(`/api/payment/status/${transactionId}`);
        const paymentData = response.data;

        if (paymentData.success && paymentData.code === 'PAYMENT_SUCCESS') {
          // Update user profile in Firestore
          const userRef = doc(db, 'users', uid);
          await setDoc(userRef, { 
            isSubscribed: true,
            updatedAt: serverTimestamp(),
            lastTransactionId: transactionId
          }, { merge: true });

          setStatus('success');
          setMessage('Subscription activated successfully!');
          setTimeout(() => onFinish(true), 3000);
        } else {
          setStatus('failed');
          setMessage(paymentData.message || 'Payment failed or was cancelled.');
        }
      } catch (error) {
        console.error('Check status error:', error);
        setStatus('failed');
        setMessage('Unable to verify payment status.');
      }
    };

    if (transactionId) {
      checkStatus();
    }
  }, [transactionId, uid, onFinish]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-gray-950 p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl p-10 shadow-xl border border-gray-100 dark:border-gray-700 text-center"
      >
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verifying Payment</h2>
            <p className="text-gray-500 dark:text-gray-400">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Successful!</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">{message}</p>
            <button 
              onClick={() => onFinish(true)}
              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition-all"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {status === 'failed' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Failed</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">{message}</p>
            <button 
              onClick={() => onFinish(false)}
              className="w-full py-4 bg-gray-900 dark:bg-gray-700 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Pricing
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
