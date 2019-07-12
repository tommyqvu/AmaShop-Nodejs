const Product = require('../models/product');
const User = require('../models/user');
const Order = require('../models/order');
const ITEMS_PER_PAGE = 3;
const stripe = require('stripe')(process.env.STRIPE_TESTAPI);

exports.getProducts = (req, res, next) => {
  const page = req.query.page || 1;
  let totalItems;
  Product.count().then(prodNumbers => {
    totalItems = prodNumbers;
    Product.findAll({
      limit: ITEMS_PER_PAGE,
      offset: (page - 1) * ITEMS_PER_PAGE,
    })

      .then(products => {
        res.render('shop/product-list', {
          prods: products,
          pageTitle: 'Shop',
          path: '/',
          currentPage: page,
          hasNextPage: ITEMS_PER_PAGE * page < totalItems,
          hasPrevPage: page > 1,
          nextPage: page + 1,
          prevPage: page - 1,
          lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
        });
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findByPk(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
      });
    })
    .catch(console.log);
};

exports.getIndex = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  let totalItems;
  Product.count().then(prodNumbers => {
    totalItems = prodNumbers;
    Product.findAll({
      limit: ITEMS_PER_PAGE,
      offset: (page - 1) * ITEMS_PER_PAGE,
    })

      .then(products => {
        res.render('shop/index', {
          prods: products,
          pageTitle: 'Shop',
          path: '/',
          currentPage: page,
          hasNextPage: ITEMS_PER_PAGE * page < totalItems,
          hasPrevPage: page > 1,
          nextPage: page + 1,
          prevPage: page - 1,
          lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
        });
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.getCart = (req, res, next) => {
  User.findByPk(req.session.user.id)
    .then(user =>
      user
        .getCart()
        .then(cart => cart.getProducts())
        .then(cartProducts => {
          res.render('shop/cart', {
            path: '/cart',
            pageTitle: 'Your Cart',
            products: cartProducts,
          });
        })
        .catch(console.log),
    )
    .catch(console.log);
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  let fetchedCart;
  let newQuantity = 1;
  User.findByPk(req.session.user.id)
    .then(user => {
      user
        .getCart()
        .then(cart => {
          fetchedCart = cart;
          return cart.getProducts({ where: { id: prodId } });
        })
        .then(products => {
          let product;
          if (products.length > 0) {
            product = products[0];
          }
          if (product) {
            const oldQuantity = product.cartItem.quantity;
            newQuantity = oldQuantity + 1;
            return product;
          }
          return Product.findByPk(prodId);
        })
        .then(product => {
          return fetchedCart.addProduct(product, {
            through: { quantity: newQuantity },
          });
        })
        .then(result => res.redirect('/cart'))
        .catch(console.log);
    })
    .catch(console.log);
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  User.findByPk(req.session.user.id)
    .then(user => {
      user
        .getCart()
        .then(cart => {
          return cart.getProducts({ where: { id: prodId } });
        })
        .then(products => {
          const product = products[0];
          return product.cartItem.destroy();
        })
        .then(result => res.redirect('/cart'))
        .catch(console.log);
    })
    .catch(console.log);
};

exports.postOrder = (req, res, next) => {
  const token = req.body.stripeToken;
  let fetchedCart;
  User.findByPk(req.session.user.id)
    .then(user => {
      user
        .getCart()
        .then(cart => {
          fetchedCart = cart;
          return cart.getProducts();
        })
        .then(products => {
          return user
            .createOrder({ userId: req.session.user.id })
            .then(order => {
              return order.addProducts(
                products.map(product => {
                  product.orderItem = { quantity: product.cartItem.quantity };
                  return product;
                }),
              );
            })
            .then(result => {
              let totalSum = 0;
              products.forEach(product => {
                totalSum += product.orderItem.quantity * product.price;
              });
              console.log("Uniquesum" + totalSum)
              const charge = stripe.charges.create({
                amount: totalSum * 100 ,
                currency: 'usd',
                source: token,
                description: 'Charge for email@test.com',
                metadata: { order_id: result.toString() },
              });
              fetchedCart.setProducts(null);
              res.redirect('/orders');
            })
            .catch(console.log);
        }).catch(console.log);
    })
    .catch(console.log);
};

exports.getOrders = (req, res, next) => {
  User.findByPk(req.session.user.id)
    .then(user => {
      user
        .getOrders({ include: ['products'] })
        .then(orders => {
          res.render('shop/orders', {
            path: '/orders',
            pageTitle: 'Your Orders',
            orders: orders,
          });
        })
        .catch(err => console.log(err));
    })
    .catch(console.log);
};

exports.getCheckout = (req, res, next) => {
  User.findByPk(req.session.user.id)
    .then(user =>
      user
        .getCart()
        .then(cart => cart.getProducts())
        .then(cartProducts => {
          let total = 0;
          cartProducts.forEach(product => {
            total += product.cartItem.quantity * product.price;
          });
          res.render('shop/checkout', {
            path: '/checkout',
            pageTitle: 'Checkout',
            products: cartProducts,
            isAuthenticated: req.session.isLoggedIn,
            totalSum: total,
          });
        })
        .catch(console.log),
    )
    .catch(console.log);
};
