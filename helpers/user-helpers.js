var db = require("../config/connection")
const collections = require("../config/collections")
const bcrypt = require("bcrypt")
var nodemailer = require('nodemailer');
var objectId = require("mongodb").ObjectId
const { response } = require("../app")
const Razorpay = require('razorpay');


var instance = new Razorpay({
  key_id: 'rzp_test_vCjJCnp6IIgh2D',
  key_secret: 'BIQPIwo36rdYBeYBAcQjYz6Z',
});
module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      userData.password = await bcrypt.hash(userData.password, 10)
      db.get().collection(collections.USER_COLLECTION).insertOne(userData).then((data) => {
        resolve(data)
      })
    })
  },
  dbLogin: (logindata) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let user = await db
        .get()
        .collection(collections.USER_COLLECTION)
        .findOne({ email: logindata.email });
      if (user) {
        bcrypt.compare(logindata.password, user.password).then((status) => {
          if (status) {
            response.user = user;
            response.status = true;
            resolve(response);
            console.log("Loginned Successfully");
          } else {
            console.log("Login failed");
            resolve({ status: false });
          }
        });
      } else {
        console.log("user not Found");
      }
    });
  },
  addtoCart: (proId, userId) => {
    let proObj = {
      item: new objectId(proId),
      quantity: 1
    }
    return new Promise(async (resolve, reject) => {
      let userCart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: new objectId(userId) })

      if (userCart) {
        let proExist = userCart.product.findIndex(product => product.item == proId)

        if (proExist != -1) {
          db.get().collection(collections.CART_COLLECTION).
            updateOne({ user: new objectId(userId), "product.item": new objectId(proId) },
              {
                $inc: { "product.$.quantity": 1 }
              }
            ).then(() => {
              resolve()
            })

        } else {
          db.get().collection(collections.CART_COLLECTION)
            .updateOne(
              { user: new objectId(userId) },
              { $push: { product: proObj } }
            )
            .then((response) => {
              resolve();
            });
        }
      } else {
        let cartObj = {
          user: new objectId(userId),
          product: [proObj]
        }
        db.get().collection(collections.CART_COLLECTION).insertOne(cartObj).then((response) => {
          resolve()
        })
      }
    })
  },
  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db.get().collection(collections.CART_COLLECTION).aggregate([
        {
          $match: { user: new objectId(userId) },
        },
        {
          $unwind: "$product",
        },
        {
          $project: {
            item: "$product.item",
            quantity: "$product.quantity",

          }
        },



        {
          $lookup: {
            from: collections.PRODUCT_COLLECTION,
            localField: "item",
            foreignField: "_id",
            as: "product"
          }
        },
        {
          $project: {
            item: 1, quantity: 1, product: { $arrayElemAt: ["$product", 0] }

          }

        }
      ]).toArray();

      resolve(cartItems);
    });
  },
  getCartcount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0
      let cart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: new objectId(userId) })

      if (cart) {
        count = cart.product.length
      }
      resolve(count)
    })
  },
  changeProductCount: (detials) => {
    detials.count = parseInt(detials.count)
    detials.quantity = parseInt(detials.quantity)
    return new Promise((resolve, reject) => {
      if (detials.count == -1 && detials.quantity == 1) {
        db.get().collection(collections.CART_COLLECTION).
          updateOne({ _id: new objectId(detials.cart) },
            {
              $pull: { product: { item: new objectId(detials.product) } }
            }
          ).then((response) => {

            resolve({ removeProduct: true })
          })
      } else {
        db.get().collection(collections.CART_COLLECTION).
          updateOne({ _id: new objectId(detials.cart), "product.item": new objectId(detials.product) },
            {
              $inc: { "product.$.quantity": detials.count }
            }
          ).then((response) => {

            resolve({ status: true })
          })
      }

    })


  },
  getTotal: (userID) => {
    return new Promise(async (resolve, reject) => {
      let total = await db.get().collection(collections.CART_COLLECTION).aggregate([
        {
          $match: { user: new objectId(userID) },
        },
        {
          $unwind: "$product",
        },
        {
          $project: {
            item: "$product.item",
            quantity: "$product.quantity",

          }
        },



        {
          $lookup: {
            from: collections.PRODUCT_COLLECTION,
            localField: "item",
            foreignField: "_id",
            as: "product"
          }
        },
        {
          $project: {
            item: 1, quantity: 1, product: { $arrayElemAt: ["$product", 0] }

          }

        },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: [{ $toInt: "$quantity" }, { $toInt: "$product.price" }] } }
          }
        }
      ]).toArray();
      resolve(total[0].total)
    });
  },
  removeProduct: (Detials) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collections.CART_COLLECTION).
        updateOne({ _id: new objectId(Detials.cart) },
          {
            $pull: { product: { item: new objectId(Detials.product) } }
          }
        ).then((response) => {

          resolve({ removeProduct: true })
        })
    }
    )
  },
  placeOrder: (order, product, Totalcash) => {
    Totalcash = parseInt(Totalcash)
    return new Promise((resolve, reject) => {
      let status = order["paymentMethod"] === "cod" ? "placed" : "pending"
      let orderObj = {
        delivaryDetails: {
          mobile: order.mobile,
          adress: order.address,
          pincode: order.pincode
        },
        userId: new objectId(order.userId),
        paytmentMethod: order["paymentMethod"],
        product: product,
        totalAmount: Totalcash,
        date: new Date(),
        status: status


      }
      db.get().collection(collections.ORDER_COLLECTION).insertOne(orderObj).then((responce) => {
        db.get().collection(collections.CART_COLLECTION).deleteOne({ user: new objectId(order.userId) })
        resolve(responce.insertedId)
      })
    })

  },
  getCartProductlist: (userID) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: new objectId(userID) })
      resolve(cart.product)
    })
  },
  GetuserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      let Orders = await db.get().collection(collections.ORDER_COLLECTION).find({ userId: new objectId(userId) }).toArray()
      resolve(Orders)

    })
  },
  oderedProducts:(Id)=>{
  return new Promise(async (resolve, reject) => {
    let OrderItems = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
      {
        $match: { _id:new objectId(Id)},
      },
      {
        $unwind: "$product",
      },
      {
        $project: {
          item: "$product.item",
          quantity: "$product.quantity",

        }
      },



      {
        $lookup: {
          from: collections.PRODUCT_COLLECTION,
          localField: "item",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $project: {
          item: 1, quantity: 1, product: { $arrayElemAt: ["$product", 0] }

        }

      },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: [{ $toInt: "$quantity" }, { $toInt: "$product.price" }] } }
        }
      }
    ]).toArray();
    resolve(OrderItems)
  })
  },
  getAllorders:(id)=>{
    return new Promise(async(resolve, reject) => {
        let Allorders = await db.get().collection(collections.ORDER_COLLECTION).find({ userId: new objectId(id) }).toArray()
        resolve(Allorders)
    })
  },
  GetallUsers:(id)=>{
    return new Promise( async(resolve, reject) => {
      let allUsers=await db.get().collection(collections.USER_COLLECTION).find({userId: new objectId(id)}).toArray()
      console.log(allUsers)
      resolve(allUsers)
      })
  },
  CreateRazorpay:(orderId,totalAmount)=>{
    return new Promise((resolve, reject) => {
      var options = {
        amount: totalAmount*100,  // amount in the smallest currency unit
        currency: "INR",
        receipt: ""+orderId
      };
      instance.orders.create(options, function(err, order) {
        console.log(order)
        resolve(order)
      });
    })

  },
  verifyPayment:(Detials)=>{
    return new Promise((resolve, reject) => {
      const crypto=require("crypto");
      let hmac=crypto.createHmac('sha256','BIQPIwo36rdYBeYBAcQjYz6Z',);
      hmac.update(Detials["payment[razorpay_order_id]"]+"|"+Detials["payment[razorpay_payment_id]"])
      hmac=hmac.digest("hex")
      if(hmac==Detials["payment[razorpay_signature]"]){
        resolve()
      }else{
        reject()
      }
    })
  },
 changeStatus:(orderId)=>{
    return new Promise((resolve, reject) => {
      db.get().collection(collections.ORDER_COLLECTION).updateOne({_id: new objectId(orderId)},
      {
        $set:{
          status:"placed"
        }
      }).then(()=>{
        resolve()
      })
    })
  },
  sendMails:()=>{
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'mailtest0475@gmail.com',
        pass: 'gvweuvidogpcqeqo'
      }
    });

    var mailOptions = {
      from: 'mailtest0475@gmail.com',
      to: 'sarathrajkrla@gmail.com',
      subject: 'Sending Email using Node.js',
      text: 'That was easy!'
    }

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });

  },
  ChangeStatus:(OrderId)=>{
    return new Promise((resolve, reject) => {
      db.get().collection(collections.ORDER_COLLECTION).updateOne({_id: new objectId(OrderId)},
      {
        $set:{
          status:"Canceled"
        }
      }).then(()=>{
        resolve(response)
      })
    })
  },
  adminLogin: (loginData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let admin = await db
        .get()
        .collection(collections.ADMIN_COLLECTION)
        .findOne({ username: loginData.username });
      if (admin) {
        bcrypt.compare(loginData.password, admin.password).then((status) => {
          if (status) {
            response.admin = admin;
            response.status = true;
            resolve(response);
            console.log("Loginned Successfully");
          } else {
            console.log("Login failed");
            resolve({ status: false });
          }
        });
      } else {
        console.log("Admin not found");
        resolve({ status: false });
      }
    });
  }


  // adminLogin:(userData)=>{
  //   return new Promise((resolve, reject) => {
  //     console.log(userData)
  //   })
  // }


}
