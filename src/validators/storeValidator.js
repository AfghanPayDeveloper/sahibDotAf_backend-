

import { body } from 'express-validator';

export const updatestoreValidator = [
    body('fullName').optional().isString().withMessage('Full name must be a string'),
    body('email').optional().isEmail().withMessage('Email must be valid'),
    body('business').optional().isString().withMessage('Business must be a string'),
    body('address').optional().isString().withMessage('Address must be a string'),
    body('city').optional().isString().withMessage('City must be a string'),
    body('zip').optional().isString().withMessage('Zip must be a string'),
    body('whatsapp').optional().isString().withMessage('WhatsApp number must be a string'),
    body('phone').optional().isString().withMessage('Phone number must be a string'),
    body('brandName').optional().isString().withMessage('Brand name must be a string'),
    body('brandEmail').optional().isEmail().withMessage('Brand email must be valid'),
    body('certificateNo').optional().isString().withMessage('Certificate number must be a string'),
    body('brandAddress').optional().isString().withMessage('Brand address must be a string'),
    body('brandCity').optional().isString().withMessage('Brand city must be a string'),
    body('brandZipCode').optional().isString().withMessage('Brand zip code must be a string'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('brandWhatsapp').optional().isString().withMessage('Brand whatsapp code must be a string'),
    body('brandPhone').optional().isString().withMessage('Brand phone must be a string'),
];
