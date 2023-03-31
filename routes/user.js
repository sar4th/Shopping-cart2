var express = require('express');
const session = require('express-session');
const { response } = require('../app');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers')
const userHelpers = require("../helpers/user-helpers")
var verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect("/login")
  }
}
/* GET home page. */
router.get('/', async function (req, res, next) {
  let user = req.session.user;
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartcount(req.session.user._id)
  }
  productHelpers.getAllproducts().then((products) => {
    res.render("user/user-view-product", { products, user, cartCount });
  });
});
router.get("/login", function (req, res) {
  if (req.session.loggedIn) {
    res.redirect("/")
  } else {
    res.render("user/login", { loginErr: req.session.loginErr })
    req.session.loginErr = false
  }
})
router.get("/signup", (req, res) => {
  res.render("user/signup")
})
router.post("/signup", (req, res) => {
  userHelpers.doSignup(req.body).then((responce) => {
    req.session.loggedIn = true
    req.session.user = responce
    res.redirect("/")
  })
})
router.post("/login", (req, res) => {
  userHelpers.dbLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect("/")
    } else {
      req.session.loginErr = "Invalid user name or password"
      res.redirect("/login")
    }
  })
})
router.get("/logout", (req, res) => {
  req.session.destroy()
  res.redirect("/")
})
router.get("/cart", verifyLogin, async (req, res) => {
  let product = await userHelpers.getCartProducts(req.session.user._id)
  let totalAmount=0;
  if(product.length>0){
    totalAmount = await userHelpers.getTotal(req.session.user._id)
  }
  let user=req.session.user._id
  res.render("user/cart", { product, user: req.session.user, totalAmount })
})
router.get("/add-to-cart/:id", (req, res) => {
  userHelpers.addtoCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true })
  })
})
router.post("/change-product-quantity/", (req, res, next) => {
  userHelpers.changeProductCount(req.body).then(async (responce) => {
    responce.Total = await userHelpers.getTotal(req.session.user._id)
    res.json(responce)


  })
})
router.get("/place-order", verifyLogin, async (req, res) => {
  let total = await userHelpers.getTotal(req.session.user._id)
  res.render("user/place-order", { total, user: req.session.user })
})
router.post("/remove-product", (req, res) => {
  userHelpers.removeProduct(req.body).then((responce) => {
    res.json(responce)
  })
})
router.post("/place-order", async (req, res) => {
  let totalPrice = await userHelpers.getTotal(req.body.userId);
  let products = await userHelpers.getCartProductlist(req.body.userId);
  userHelpers.placeOrder(req.body, products, totalPrice).then(async (orderID) => {
    if (req.body["paymentMethod"] == "cod") {
      res.json({ codSucess:true});
    } else {
      userHelpers.CreateRazorpay(orderID,totalPrice).then((response)=>{
        res.json(response)
      })
     
    }
  })
});


router.get("/order-placed", (req, res) => {
  res.render("user/order-placed")
})
router.get("/view-orders", async (req, res) => {
  let Orders = await userHelpers.GetuserOrders(req.session.user._id)
  res.render("user/view-orders", { user: req.session.user, Orders })
})
router.get("/oderedProducts/:id", async (req, res) => {
  let oderedProducts = await userHelpers.oderedProducts(req.params.id)
  res.render("user/oderedProducts", { user: req.session.user, oderedProducts })
})
router.get("/orders", async (req, res) => {
  let Orders = await userHelpers.getAllorders(req.session.user._id)
  res.render("user/view-orders", { user: req.session.user, Orders })
})
router.post("/verify-payment",(req,res)=>{
  console.log(req.body)
  userHelpers.verifyPayment(req.body).then(()=>{
    userHelpers.changeStatus(req.body["order[receipt]"]).then(()=>{
      res.json({status:true})
    })
  }).catch((err)=>{
    res.json({status:false})
  })
})


module.exports = router;
