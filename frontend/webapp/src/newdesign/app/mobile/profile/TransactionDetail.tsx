import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Download, Share2, CheckCircle2, XCircle, AlertCircle, Clock, CreditCard, MapPin, FileText } from 'lucide-react';

export default function TransactionDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Mock transaction data - in real app, fetch based on id
  const transaction = {
    id: id || '1',
    type: 'debit',
    title: 'Hair Transplant Payment',
    subtitle: 'Istanbul Medical Center',
    amount: -2499.00,
    currency: 'USD',
    date: '2026-03-05T14:30:00',
    status: 'completed',
    paymentMethod: 'Visa ****4532',
    transactionId: 'TXN-2026-03-05-4827',
    bookingId: 'BK-18294',
    providerName: 'Istanbul Medical Center',
    providerAddress: 'Nisantasi, Istanbul, Turkey',
    description: 'FUE Hair Transplant - 4000 Grafts',
    fee: 0.00,
    subtotal: 2499.00,
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = () => {
    switch (transaction.status) {
      case 'completed':
        return <CheckCircle2 size={24} className="text-green-600" />;
      case 'pending':
        return <AlertCircle size={24} className="text-orange-600" />;
      case 'failed':
        return <XCircle size={24} className="text-red-600" />;
      default:
        return <Clock size={24} className="text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (transaction.status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors active:scale-95"
            >
              <ArrowLeft size={20} className="text-gray-900" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Transaction Details</h1>
          </div>

          <div className="flex gap-2">
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
              <Share2 size={20} className="text-gray-600" />
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
              <Download size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-4">
        {/* Amount Card */}
        <div className="bg-white rounded-3xl p-6 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center">
            {getStatusIcon()}
          </div>
          
          <div className={`text-4xl font-bold mb-2 ${
            transaction.type === 'credit'
              ? 'text-green-600'
              : transaction.status === 'failed'
              ? 'text-red-600'
              : 'text-gray-900'
          }`}>
            {transaction.type === 'credit' ? '+' : ''}
            {transaction.currency === 'USD' ? '$' : ''}
            {Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>

          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor()}`}>
            <span className="text-sm font-semibold capitalize">{transaction.status}</span>
          </div>

          <p className="text-sm text-gray-600 mt-4">{formatDate(transaction.date)}</p>
        </div>

        {/* Transaction Information */}
        <div className="bg-white rounded-2xl p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Transaction Information</h2>

          <div className="space-y-3">
            {/* Transaction ID */}
            <div className="flex items-start justify-between py-3 border-b border-gray-100">
              <div className="flex items-start gap-3">
                <FileText size={20} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600 mb-0.5">Transaction ID</p>
                  <p className="font-semibold text-gray-900">{transaction.transactionId}</p>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="flex items-start justify-between py-3 border-b border-gray-100">
              <div className="flex items-start gap-3">
                <CreditCard size={20} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600 mb-0.5">Payment Method</p>
                  <p className="font-semibold text-gray-900">{transaction.paymentMethod}</p>
                </div>
              </div>
            </div>

            {/* Booking Reference */}
            {transaction.bookingId && (
              <div className="flex items-start justify-between py-3 border-b border-gray-100">
                <div className="flex items-start gap-3">
                  <FileText size={20} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600 mb-0.5">Booking Reference</p>
                    <p className="font-semibold text-gray-900">{transaction.bookingId}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="flex items-start justify-between py-3 border-b border-gray-100">
              <div className="flex items-start gap-3">
                <FileText size={20} className="text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-0.5">Description</p>
                  <p className="font-semibold text-gray-900">{transaction.description}</p>
                </div>
              </div>
            </div>

            {/* Provider */}
            <div className="flex items-start justify-between py-3">
              <div className="flex items-start gap-3">
                <MapPin size={20} className="text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-0.5">Provider</p>
                  <p className="font-semibold text-gray-900 mb-1">{transaction.providerName}</p>
                  <p className="text-sm text-gray-600">{transaction.providerAddress}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="bg-white rounded-2xl p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Payment Breakdown</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold text-gray-900">
                ${transaction.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Service Fee</span>
              <span className="font-semibold text-gray-900">
                ${transaction.fee.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
              <span className="font-bold text-gray-900">Total</span>
              <span className="text-xl font-bold text-gray-900">
                ${Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {transaction.status === 'completed' && (
          <div className="space-y-2">
            <button className="w-full h-14 bg-white border-2 border-gray-300 rounded-xl font-semibold text-gray-900 hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
              <Download size={20} />
              Download Receipt
            </button>

            {transaction.bookingId && (
              <button 
                onClick={() => navigate(`/app/booking-detail/${transaction.bookingId}`)}
                className="w-full h-14 bg-[#083f30] text-white rounded-xl font-semibold hover:bg-[#0a5a44] transition-all"
              >
                View Booking Details
              </button>
            )}
          </div>
        )}

        {transaction.status === 'failed' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <XCircle size={20} className="text-red-600 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-900 mb-1">Payment Failed</h3>
                <p className="text-sm text-red-700 mb-4">
                  This payment could not be processed. Please try again or use a different payment method.
                </p>
                <button className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors">
                  Retry Payment
                </button>
              </div>
            </div>
          </div>
        )}

        {transaction.status === 'pending' && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-bold text-orange-900 mb-1">Payment Pending</h3>
                <p className="text-sm text-orange-700">
                  This transaction is being processed. It may take up to 24 hours to complete.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Support */}
        <div className="bg-gray-100 rounded-2xl p-5 text-center">
          <p className="text-sm text-gray-600 mb-3">
            Need help with this transaction?
          </p>
          <button 
            onClick={() => navigate('/app/support')}
            className="px-6 py-3 bg-white text-[#083f30] font-semibold rounded-xl hover:shadow-md transition-all"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
