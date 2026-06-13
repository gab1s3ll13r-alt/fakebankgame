import api from './api.js';

const transactions = {
    /**
     * Effectue un virement
     * POST /api/transactions/transfer
     */
    async transfer(recipientId, amount, description = '') {
        return await api.transactions.transfer({
            recipientId,
            amount,
            description
        });
    },

    /**
     * Récupère l'historique des transactions
     * GET /api/transactions/history
     */
    async getHistory(params = {}) {
        return await api.transactions.history(params);
    },

    /**
     * Récupère une transaction précise
     * GET /api/transactions/:id
     */
    async getTransaction(id) {
        return await api.transactions.get(id);
    },

    /**
     * Récupère résumé (dashboard)
     * GET /api/transactions/summary
     */
    async getSummary(days = 14) {
        return await api.transactions.summary({ days });
    }
};

export default transactions;
