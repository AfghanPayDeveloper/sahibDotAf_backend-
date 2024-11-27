
const Product = require('../src/schemas/product.schema');


const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};


const createProduct = async (req, res) => {
  const { name, description, price, category } = req.body;

  const newProduct = new Product({ name, description, price, category });

  try {
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ message: 'Error creating product' });
  }
};

module.exports = {
  getProducts,
  createProduct,
};
