var db=require("../config/connection")
const { Collection } = require("mongodb")
const collections = require("../config/collections")
var objectId =require("mongodb").ObjectId
module.exports={
    addProduct:(product,callback)=>{
       
      db.get().collection("product").insertOne(product).then((data)=>{
callback(data.insertedId)
      })  
    },
  getAllproducts:()=>{
return new Promise(async (resolve, reject) => {
let products=await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray()
  resolve(products)
})
  },
  deleteProduct:(proId)=>{
    return new Promise((resolve, reject) => {
      db.get().collection(collections.PRODUCT_COLLECTION).deleteOne({_id:new objectId(proId)}).then((response)=>{
        resolve(response)
      })
     
    })

  },
  getProductDetails:(proId)=>{
    return new Promise((resolve, reject) => {
      db.get().collection(collections.PRODUCT_COLLECTION).findOne({_id:new objectId(proId)}).then((response)=>{
        resolve(response)
      })
     
    })

  },
 updateProduct:(proId,proDetails)=>{
    return new Promise((resolve, reject) => {
      db.get().collection(collections.PRODUCT_COLLECTION).updateOne({_id:new objectId(proId)},{


      $set:{
        name:proDetails.name,
        description:proDetails.description,
        price:proDetails.price,
        category:proDetails.category
      } 
        
      }).then((response)=>{
        resolve()
      })
     
    })

  }

} 