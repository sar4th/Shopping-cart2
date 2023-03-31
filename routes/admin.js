var express = require('express');
const session = require('express-session');
var router = express.Router();
var productHelper = require("../helpers/product-helpers")
var collection = require("../config/collections");
const productHelpers = require('../helpers/product-helpers');
const { response } = require('../app');
const userHelpers = require('../helpers/user-helpers');
/* GET users listing. */
router.get('/', function (req, res, next) {
  // req.session.loggedIn = true
  // productHelpers.getAllproducts().then((products) => {
  //   console.log(req.session.user)
    res.render("admin/adminHome")
  })
  router.get("/view-product",(req,res)=>{
    req.session.loggedIn = true
    productHelpers.getAllproducts().then((products) => {
      console.log(req.session.user)
      res.render("admin/view-product", { admin: true, products, user:req.session.user})
  })


});

router.get("/add-product", function (req, res) {
  res.render("admin/add-product")
})
router.post("/add-product", (req, res) => {
  productHelper.addProduct(req.body, (productId) => {
    let id = productId
    let image = req.files.Image
    image.mv("./public/product-image/" + id + ".jpg", (err) => {
      if (!err) {
        res.render("admin/add-product")
      } else {
        console.log(err)
      }
    })

  })
})
router.get("/delete-product/:id", (req, res) => {
  let proId = req.params.id
  productHelpers.deleteProduct(proId).then((response) => {
    res.redirect("/admin/")
  })
})
router.get("/edit-product/:id", async (req, res) => {
  let product = await productHelpers.getProductDetails(req.params.id)
  console.log(product)
  res.render("admin/edit-product", { product })

})
router.post("/edit-product/:id", (req, res) => {
  let id = req.params.id
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    res.redirect("/admin")
    if (req.files.image) {
      let Image = req.files.image
      Image.mv("./public/product-image/" + id + ".jpg")
    }
  })
})
router.get("/view-order", async (req, res) => {
  let Orders = await userHelpers.GetuserOrders(req.session.user._id)
  res.render("user/view-orders", { user: req.session.user, Orders })
})
router.get("/allUsers", async (req, res) => {
  console.log(req.session.user)

  // let allUsers = await userHelpers.GetallUsers(req.session.user._id)
  // res.render("admin/allUsers", { users: allUsers }) // pass the allUsers data to the view
});

module.exports = router;
