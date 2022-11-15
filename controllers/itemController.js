const Item = require("../models/item");
const Category = require("../models/category")


const async = require("async");

const { body, validationResult } =require("express-validator");
const { getMaxListeners } = require("../models/category");

exports.index = (req, res) => {
    async.parallel(
        {
            item_count(callback){
                Item.countDocuments({},callback)
            },
            category_count(callback){
                Category.countDocuments({},callback)
            },
        },
        (err,results) =>{
            res.render("index", {
            title:'Inventory App Home',
            error:err,
            data:results}

    )}
    )
  };

// Display list of all books.
exports.item_list = (req, res, next) => {
  Item.find({}, )
  .sort({title:1})
  .exec(function (err, list_items){
    if (err){
        return next(err)
    }
    list_items.map(item =>{
        item.name = item.name.replace('&#x27;',"'")
        return item
    })

    
    res.render("item_list",{title:"Item List",
    item_list: list_items})
  })
  
};

// Display detail page for a specific book.
exports.item_detail = (req, res,next) => {
    async.parallel(
        {
            item(callback){
                Item.findById(req.params.id)
                .populate("category")
                .exec(callback)
            },
        },
        (err, results) => {
        if (err) {
            return next(err)
        }
        if (results.item==null){
            const err = new Error ("Item not found");
            err.status = 404;
            return next(err);
        }
        results.item.name = results.item.name.replace('&#x27;',"'")
        results.item.description = results.item.description.replace('&#x27;',"'")
        res.render("item_detail",{
            title:results.item.name,
            item:results.item,

        })
        }
    )
  
};

// Display book create form on GET.
exports.item_create_get = (req, res) => {
  async.parallel({
    categories(callback){
        Category.find(callback);
    },
},
(err, results) => {
 if (err) {
    return next(err)
}
results.categories.map(e => {
    e.name = e.name.replace('&#x27;',"'")
    return e
})
res.render("item_form",{
    title: "Create Item",
    categories:results.categories,
})
  })
};

// Handle book create on POST.
exports.item_create_post = [
    (req,res,next)=>{
    if (!Array.isArray(req.body.category)){
        req.body.category = 
        typeof req.body.category ==='undefined' ? []:
        [req.body.category];
    }
    next()
    },
    body("name","Name must not be empty.")
    .trim()
    .isLength({min:1, max:40})
    .escape(),
    body("description","Description length must be between 1 and 300")
    .trim()
    .isLength({min:1, max:300})
    .escape(),
    body("price","Only numbers allowed")
    .optional({checkFalsy:true})
    .isNumeric(),
    body("numberInStock","Only numbers allowed")
    .optional({checkFalsy:true})
    .isNumeric(),
    body("category.*").escape(),

    (req,res,next)=> {
        const errors = validationResult(req)

        const item = new Item({
            name: req.body.name,
            description:req.body.description,
            price: req.body.price,
            numberInStock:req.body.numberInStock,
            category:req.body.category,  
        })
        if (!errors.isEmpty()){
            async.parallel(
                {
                    categories(callback){
                        Category.find(callback)
                    },
                },
                (err, results) => {
                    if(err) {
                        return next(err)
                    }
                
                for (const category of results.categories){
                if (item.category.includes(category._id)){
                    category.checked="true"
                }
                }
                
                res.render("item_form",{
                    title:"Create Item",
                    categories:results.categories,
                    item,
                    errors:errors.array()
                })
            }
            )
            return;
        }
        item.save((err)=>{
            if (err) {
                return next(err)
            }
            res.redirect(item.url)
        })
    }


    
]

// Display book delete form on GET.
exports.item_delete_get = (req, res,next) => {
  async.parallel(
    {
        item(callback){
        Item.findById(req.params.id).exec(callback)
    }
    },
    (err, results) =>{
        if(err) {
            return next(err)
        }
        if (results.item==null){
            res.redirect("/catalog/items")
        }
        res.render("item_delete", {
            title:"Delete Author",
            item:results.item,

        })
    }
  )}

// Handle book delete on POST.
exports.item_delete_post = (req, res, next) => {
  async.parallel(
    {
    item(callback){
        Item.findById(req.body.itemid).exec(callback)},
  })
, (err,results) => {
    if(err) {
        return next(err)
    }
    res.render("item_delete",{
        title:"Delete Item",
        item:results.item,
    });
    return;
}
   Item.findByIdAndRemove(req.body.itemid,(err)=>{
    if(err){
        return next(err)
    }
    res.redirect("/catalog/items")
   })
}



// Display book update form on GET.
exports.item_update_get = (req, res, next) => {
    async.parallel(
    {
        item(callback){
            Item.findById(req.params.id)
            .populate("category")
            .exec(callback)
        },
        categories(callback) {
            Category.find(callback)
        }
    },
    (err,results) => {
        if (err){
            return next(err)
        }
        if (results.it = null){
            const err = new Error ("Item not found")
            err.status= 404
            return next(err)
        }
        for (const category of results.categories) {
            for (const itemCategory of results.item.category){
                if (category._id.toString()===itemCategory._id.toString()){
                    category.checked='true'
                }
            }
        }
        results.item.name = results.item.name.replace('&#x27;',"'")
        results.item.description = results.item.description.replace('&#x27;',"'")
        results.categories.map(e =>{
            e.name = e.name.replace('&#x27;',"'")
            return e
        })
        res.render('item_form',{
            title:"Update Item",
            item: results.item,
            categories: results.categories
        })
    }
  )
};

// Handle book update on POST.
exports.item_update_post = [
    (req, res, next) => {
        if (!Array.isArray(req.body.category)){
            req.body.genre=
            typeof req.body.genre==='undefined' ? []:
            [req.body.category]
        }
        next()
    },
    body("name","Name must not be empty.")
    .trim()
    .isLength({min:1, max:40})
    .escape(),
    body("description","Description length must be between 1 and 300")
    .trim()
    .isLength({min:1, max:300})
    .escape(),
    body("price","Only numbers allowed")
    .optional({checkFalsy:true})
    .isNumeric(),
    body("numberInStock","Only numbers allowed")
    .optional({checkFalsy:true})
    .isNumeric(),
    body("category.*").escape(),

    (req, res, next)=> {
        const errors = validationResult(req)

        const item = new Item({
            name: req.body.name,
            description:req.body.description,
            price: req.body.price,
            numberInStock:req.body.numberInStock,
            category: typeof req.body.category ==='undefined' ?[]:req.body.category,
            _id: req.params.id
        })
        if (!errors.isEmpty()){
            async.parallel(
                {
                    categories(callback){
                        Category.find(callback)
                    }
                },
                (err,results) =>{
                    if(err) {
                        return next(err)
                    }
                for (const category of results.categories){
                    if (item.category.includes(category._id)){
                        category.checked="true"
                    }
                }
                res.render("item_form",{
                    title:"Update Item",
                    item,
                    categories: results.categories,
                    errors:errors.array()
                })
            }
            )
            return;
        }
        Item.findByIdAndUpdate(req.params.id, item,{},(err,thebook)=>{
            if (err){
                return next(err)
            }
            res.redirect(thebook.url)
        })
    }

]