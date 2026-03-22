import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as paymentService from '../services/paymentService';

function TransactionHistoryPage() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const data = await paymentService.getTransactions();
            setTransactions(data);
        } catch (err) {
            setError('Failed to load transactions');
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = filter === 'all'
        ? (transactions || [])
        : (transactions || []).filter(t => t.status === filter);

    const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">✅ Completed</span>;
            case 'pending':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">⏳ Pending</span>;
            case 'refunded':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">↩️ Refunded</span>;
            default:
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg p-8">
                <h1 className="text-3xl font-bold mb-1">Transaction History</h1>
                <p className="text-purple-200">
                    {user?.role === 'student' ? 'Your payments for lessons' : 'Payments received for your lessons'}
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Total Transactions</div>
                    <div className="text-3xl font-bold text-gray-900">{(transactions || []).length}</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">
                        {user?.role === 'student' ? 'Total Spent' : 'Total Earned'}
                    </div>
                    <div className="text-3xl font-bold text-green-600">
                        ${(transactions || []).reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Completed</div>
                    <div className="text-3xl font-bold text-blue-600">
                        {(transactions || []).filter(t => t.status === 'completed').length}
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {['all', 'completed', 'pending', 'refunded'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Transactions List */}
            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            ) : error ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            ) : filteredTransactions.length === 0 ? (
                <div className="card text-center py-12 text-gray-500">
                    <div className="text-5xl mb-4"></div>
                    <p className="text-xl font-medium">No transactions found</p>
                    <p className="text-sm mt-2">
                        {filter === 'all'
                            ? 'Your payment history will appear here after your first booking.'
                            : `No ${filter} transactions.`}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-5 gap-4 px-6 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <div className="col-span-2">
                            {user?.role === 'student' ? 'Teacher' : 'Student'}
                        </div>
                        <div>Subject</div>
                        <div>Amount</div>
                        <div>Status</div>
                    </div>

                    {/* Table Rows */}
                    <div className="divide-y divide-gray-100">
                        {filteredTransactions.map((transaction) => {
                            const otherPerson = user?.role === 'student'
                                ? transaction.teacherId
                                : transaction.studentId;

                            return (
                                <div key={transaction._id} className="grid grid-cols-5 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors">
                                    {/* Person */}
                                    <div className="col-span-2 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                                            {otherPerson?.name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{otherPerson?.name || 'Unknown'}</div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric', month: 'short', day: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Subject */}
                                    <div className="text-sm text-gray-700">{transaction.subject || '—'}</div>

                                    {/* Amount */}
                                    <div className="font-bold text-gray-900">
                                        ${transaction.amount.toFixed(2)}
                                        <span className="text-xs font-normal text-gray-400 ml-1">{transaction.currency}</span>
                                    </div>

                                    {/* Status */}
                                    <div>{getStatusBadge(transaction.status)}</div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer total */}
                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-sm text-gray-500">{filteredTransactions.length} transaction(s)</span>
                        <span className="font-bold text-gray-900">Total: ${totalAmount.toFixed(2)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TransactionHistoryPage;
