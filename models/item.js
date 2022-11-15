const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ItemSchema = new Schema({
  name: { type: String, required: true,maxLength: 100,minLength: 3 },
  description: {type:String, required:true, maxLength:300},
  category:[{type:Schema.Types.ObjectId, ref:"Category"}],
  price : {type:Number,required:true},
  numberInStock: {type:Number, required:true}

});

// Virtual for book's URL
ItemSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/catalog/item/${this._id}`;
});

// Export model
module.exports = mongoose.model("Item", ItemSchema);