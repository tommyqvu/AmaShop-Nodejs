const path = require('path');
const { check, body } = require('express-validator/check');

const express = require('express');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/isAuth');
const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post(
  '/add-product',
  [
    body('title', 'Invalid title').isLength({ min: 3 }).isString().trim(),
    body('imageUrl', 'Invalid url').isURL(),
    body('price', 'Invalid number').isFloat(),
    body('description', 'Invalid description').isLength({ min: 5, max: 100 }).trim(),
  ],
  isAuth,
  adminController.postAddProduct,
);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post(
  '/edit-product',
  [
   body('title', 'Invalid title').isLength({ min: 3 }).isString().trim(),
    body('imageUrl', 'Invalid url').isURL(),
    body('price', 'Invalid').isFloat(),
    body('description', 'Invalid')
      .isLength({ min: 10, max: 100 })
      .trim(),
  ],
  isAuth,
  adminController.postEditProduct,
);

router.post('/delete-product', isAuth, adminController.postDeleteProduct);

module.exports = router;
