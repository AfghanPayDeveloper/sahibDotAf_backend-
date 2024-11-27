import { check, validationResult } from 'express-validator';

export const validateSignup = [
  check('fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isString()
    .withMessage('Full name must be a string'),
  check('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
  check('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  check('role')
    .optional()
    .isIn(['seller', 'buyer', 'superadmin']) 
    .withMessage('Role must be either seller, buyer, or superadmin'),
  check('category')
    .optional()
    .isString()
    .withMessage('Category must be a string'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
];

export const validateLogin = [
  check('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
  check('password')
    .notEmpty()
    .withMessage('Password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
];
