/**
 * public/js/users.js
 * Recherche et identification des utilisateurs.
 * Basé sur les routes :
 * - GET /api/users/search
 * - GET /api/users/lookup
 */

import api from './api.js';

const users = {
    // Recherche partielle par nom ou IBAN
    async search(query) {
        return await api.users.search(query);
    },

    // Vérification d'un IBAN complet pour un virement
    async lookupIban(iban) {
        return await api.users.lookup(iban);
    }
};

export default users;
