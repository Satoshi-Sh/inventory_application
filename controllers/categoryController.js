const Category = require("../models/category");
const Item = require("../models/item")

const async = require("async")

const { body, validationResult } =require("express-validator"); 
const category = require("../models/category");

// Display list of all Genre.
exports.category_list = (req, res, next) => {
   Category.find()
   .sort([['name','ascending']])
   .exec(function(err, list_categories){
    if (err) {
      return next(err)
    }
    list_categories.map(e=>{
    e.name = e.name.replace('&#x27;',"'")
    return e
    })
    res.render("category_list",{
      title: "Category List", 
      category_list: list_categories,
    })
   })  
};

// Display detail page for a specific Genre.
exports.category_detail = (req, res, next) => {
  async.parallel(
    {
      category(callback){
        Category.findById(req.params.id).exec(callback);
      },
      category_items(callback){
        Item.find( {category: req.params.id}).exec(callback)
      }
    },
    (err, results) => {
      if (err) {
        return next(err)
      }
      if (results.category==null){
        const err = new Error("Category not found");
        err.status=404;
        return next(err)
      }
      results.category.name = results.category.name.replace('&#x27;',"'")
      results.category.description = results.category.description.replace('&#x27;',"'")
      results.category_items.map(item=>{
        item.name = item.name.replace('&#x27;',"'")
        item.description= item.description.replace('&#x27;',"'")
      })
      res.render("category_detail", {
        title:"Category Detail",
        category: results.category,
        category_items: results.category_items,
      })
    }
  )
};

// Display Genre create form on GET.
exports.category_create_get = (req, res, next) => {
   res.render("category_form", {title:'Create Category'})  
};

// Handle Genre create on POST.
exports.category_create_post = [
  body("name","Category name required").trim().isLength(
    {min:1}
  ).escape(),
  body("description")
  .trim()
  .isLength({min:1,max:300})
  .escape()
  .withMessage("Description length must be between 1 to 300 characters"),
  (req,res,next)=> {
    const errors = validationResult(req);
    const category = new Category({name:req.body.name,description:req.body.description})

    if (!errors.isEmpty()){
      res.render("category_form",{
        title: "Create Category",
        category,
        errors: errors.array()
      })
      return;
    } else {
      Category.findOne( {name:req.body.name}).exec((err,found_category)=>{
        if (err) {
          return next(err)
        }
        if (found_category) {
          res.redirect(found_category.url);
        } else{
          category.save((err)=>{
            if (err){
              return next(err)
            }
            res.redirect(category.url);
          })
        }
      })
    }
  }
]

// Display Genre delete form on GET.
exports.category_delete_get = (req, res,next) => {
   async.parallel(
    {
      category(callback){
        Category.findById(req.params.id).exec(callback);
      },
      category_items(callback){
        Item.find({category:req.params.id}).exec(callback)
      }
    },
    (err, results) => {
      if (err){
        return next(err);
      }
      if (results.category==null){
        res.redirect("/catalog/categories")
      }
      results.category.name = results.category.name.replace('&#x27;',"'")
      results.category_items.map(e=>{
        e.name= e.name.replace('&#x27;',"'")
        e.description = e.description.replace('&#x27;',"'")
        return e
      })
      res.render("category_delete", {
        title:"Delete Category",
        category: results.category,
        category_items: results.category_items
      })
    }

   ) 
};

// Handle Genre delete on POST.
exports.category_delete_post = (req, res,next) => {
  async.parallel({
    category(callback){
      Category.findById(req.body.categoryid).exec(callback)
    },
    category_items(callback){
      Item.find({category:req.body.categoryid}).exec(callback)
    }

  },
  (err,results)=> {
    if(err) {
      return next(err)
    }
    if (results.category_items.length>0){
      res.render("category_delete",{
        titel:"Delete Category",
        category: results.category,
        category_items: results.category_items,
      })
      return;
    }
    Category.findByIdAndRemove(req.body.categoryid,(err)=>{
      if (err){
        return next(err);
      }
      res.redirect("/catalog/categories")
    })
  })
};

// Display Genre update form on GET.
exports.category_update_get = (req, res,next) => {
  async.parallel(
    {
      category(callback){
        Category
        .findById(req.params.id)
        .exec(callback)
      }
    },
    (err,results) => {
      if (err) {
        return next(err);
      }
      if (results.category==null){
        const err = new Error("Category not found")
        err.status=404;
        return next(err)
      }
      results.category.name = results.category.name.replace('&#x27;',"'")
      results.category.description = results.category.description.replace('&#x27;',"'")
      res.render("category_form",{
        title:"Update Category",
        category: results.category
      })
    }
  )
};

// Handle Genre update on POST.
exports.category_update_post = [
  body('name', "Category must not be empty. 300 characters at most")
  .trim()
  .isLength({min:1,max:300})
  .escape(),
  body('description','Description length must be between 1 and 400')
  .trim()
  .isLength({min:1,max:400})
  .escape(),
  (req,res,next) =>{
    const errors = validationResult(req);
    const category = new Category({
      name:req.body.name,
      description:req.body.description,
      _id: req.params.id,
    })
    if (!errors.isEmpty()){
      async.parallel(
        {
          category(callback){
            Category
            .findById(req.params.id)
            .exec(callback)
          }
        },
        (err, results) => {
          if (err){
            return next(err)
          }
          res.render("category_form",{
            title: "Update Category",
            category:results.category,
            errros: errors.array(),
          })
        
        }

      )
      return
    }
   
   Category.findByIdAndUpdate(req.params.id, category,{}, (err,thecategory)=>
   {
    if (err){
      return next(err)
    }
    res.redirect(thecategory.url)
   })
  }
]