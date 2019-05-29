const Product = require('../models/product');
const User = require('../models/user');
const { validationResult } = require('express-validator/check');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    valErrors: [],
    errorMessage: null,
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  const userId = req.session.user.id;
  const errors = validationResult(req);


  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: true,
      errorMessage: errors.array()[0].msg,
      valErrors: errors.array(),
      hasError: true,
      product: {
        title,
        imageUrl,
        price,
        description,
      },
    });
  }
  User.findByPk(req.session.user.id)
    .then(user => {
      user
        .createProduct({
          title,
          price,
          imageUrl,
          description,
          userId,
        })
        .then(result => res.redirect('/admin/products'))
        .catch(console.log);
    })
    .catch(console.log);
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  User.findByPk(req.session.user.id)
    .then(user => {
      user
        .getProducts({ where: { id: prodId } })
        .then(products => {
          const product = products[0];
          if (!product) {
            return res.redirect('/');
          }
          res.render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: editMode,
            product: product,
            hasError: false,
            errorMessage: null,
            valErrors: [],
          });
        })
        .catch(err => {
          return res.status(500).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            errorMessage: 'Database operation failed',
            valErrors: [],
            hasError: true,
            product: {
              title,
              imageUrl,
              price,
              description,
            },
          });
        });
    })
    .catch(console.log);
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedImageUrl = req.body.imageUrl;
  const updatedDescription = req.body.description;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      product: {
        title: updatedTitle,
        imageUrl: updatedImageUrl,
        price: updatedPrice,
        description: updatedDescription,
        id: prodId,
      },
      editing: true,
      hasError: true,
      errorMessage: errors.array()[0].msg,
      valErrors: errors.array(),
    });
  }
  Product.update(
    {
      title: updatedTitle,
      price: updatedPrice,
      imageUrl: updatedImageUrl,
      description: updatedDescription,
    },
    { where: { id: prodId, userId: req.session.user.id } },
  )

    .then(result => res.redirect('/admin/products'))
    .catch(console.log);
};

exports.getProducts = (req, res, next) => {
  Product.findAll({ where: { userId: req.session.user.id } })
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
      });
    })
    .catch(console.log);
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  // Product.findByPk(prodId)
  //   .then(product => {
  //     product.destroy();
  //   })
  Product.destroy({ where: { id: prodId, userId: req.session.user.id } })
    .then(result => {
      res.redirect('/admin/products');
    })
    .catch(console.log);
};
