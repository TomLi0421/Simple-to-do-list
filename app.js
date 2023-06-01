//jshint esversion:6

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI);

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const drinking = new Item({
  name: "Drink 8 cups of water",
});

const eating = new Item({
  name: "Eat health",
});

const sleeping = new Item({
  name: "Sleep 8 hrs",
});

const defaultItems = [drinking, eating, sleeping];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  const newList = req.body.newList;

  Item.find()
    .then(function (foundItem) {
      if (foundItem.length === 0) {
        Item.insertMany(defaultItems)
          .then(function () {
            console.log("All items added");
          })
          .catch(function (err) {
            console.log(err);
          });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: getDay(), newListItems: foundItem });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then(function (foundName) {
      if (foundName === null) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          listTitle: foundName.name,
          newListItems: foundName.items,
        });
      }
    })
    .catch(function (err) {
      if (err) {
        console.log(err);
      }
    });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = _.capitalize(req.body.list);

  const item = new Item({
    name: itemName,
  });

  if (listName === getDay()) {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then(function (foundList) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
      .catch(function (err) {
        console.log(err);
      });
  }
});

app.post("/delete", function (req, res) {
  const checkItemId = req.body.checkbox;
  const listName = _.capitalize(req.body.listName);

  if (listName === getDay()) {
    Item.findByIdAndRemove({ _id: checkItemId })
      .then(function () {
        res.redirect("/");
      })
      .catch(function (err) {
        console.log(err);
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkItemId } } }
    )
      .then(function (foundList) {
        res.redirect("/" + listName);
      })
      .catch(function (err) {
        console.log(err);
      });
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server has started successfully");
});

const getDay = function () {
  const today = new Date();
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  return _.capitalize(today.toLocaleDateString("en-US", options));
};
