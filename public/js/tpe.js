import api from './api.js';

const tpe = {
    create: (amount, label, description) =>
        api.tpe.requestPayment(amount, label, description),

    get: (uuid) =>
        api.tpe.getPayment(uuid),

    pay: (uuid) =>
        api.tpe.pay(uuid),

    cancel: (uuid) =>
        api.tpe.cancel(uuid),

    history: (page) =>
        api.tpe.history(page),

    pending: () =>
        api.tpe.pending()
};

export default tpe;
