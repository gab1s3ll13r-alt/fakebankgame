import api from './api.js';

const tpe = {
    /**
     * Créer une demande de paiement TPE (commerçant)
     * POST /api/tpe/request
     */
    async requestPayment(amount, label = '', description = '') {
        return await api.tpe.request({
            amount,
            label,
            description
        });
    },

    /**
     * Récupérer les détails d’un QR code (payeur)
     * GET /api/tpe/pay/:qrCodeUuid
     */
    async getPaymentDetails(qrCodeUuid) {
        return await api.tpe.getPayment(qrCodeUuid);
    },

    /**
     * Payer un TPE (payeur connecté)
     * POST /api/tpe/pay/:qrCodeUuid
     */
    async confirmPayment(qrCodeUuid) {
        return await api.tpe.pay(qrCodeUuid, {});
    },

    /**
     * Annuler une demande TPE (commerçant/admin)
     * POST /api/tpe/cancel/:qrCodeUuid
     */
    async cancelPayment(qrCodeUuid) {
        return await api.tpe.cancel(qrCodeUuid);
    },

    /**
     * Historique TPE (commerçant)
     * GET /api/tpe/history
     */
    async getHistory() {
        return await api.tpe.history();
    },

    /**
     * Demandes en attente (commerçant)
     * GET /api/tpe/pending
     */
    async getPendingRequests() {
        return await api.tpe.pending();
    }
};

export default tpe;
