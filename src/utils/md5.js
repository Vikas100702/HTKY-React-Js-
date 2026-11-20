import md5 from 'blueimp-md5';

const VAAP_SALT = '~$vaap';

export const encryptVaapField = (value) => {
    const raw = String(value ?? '').trim();
    if (!raw) return '';
    return md5(md5(`${raw}${VAAP_SALT}`));
};

export const detectCardType = (cardNumber) => {
    const sanitized = String(cardNumber ?? '').replace(/[\s-]/g, '');
    if (!sanitized) return 'UNKNOWN CARD TYPE';

    const patterns = [
        ['ELECTRON', /^(4026|417500|4405|4508|4844|4913|4917)\d+$/],
        ['MAESTRO', /^(5018|5020|5038|5612|5893|6304|6759|6761|6762|6763|0604|6390)\d+$/],
        ['DANKORT', /^(5019)\d+$/],
        ['INTERPAYMENT', /^(636)\d+$/],
        ['UNIONPAY', /^(62|88)\d+$/],
        ['VISA', /^4[0-9]{12}(?:[0-9]{3})?$/],
        ['MASTERCARD', /^5[1-5][0-9]{14}$/],
        ['AMEX', /^3[47][0-9]{13}$/],
        ['DINERS', /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/],
        ['DISCOVER', /^6(?:011|5[0-9]{2})[0-9]{12}$/],
        ['JCB', /^(?:2131|1800|35\d{3})\d{11}$/],
    ];

    for (const [cardType, regex] of patterns) {
        if (regex.test(sanitized)) {
            return cardType;
        }
    }

    return 'UNKNOWN CARD TYPE';
};

export default {
    encryptVaapField,
    detectCardType,
};