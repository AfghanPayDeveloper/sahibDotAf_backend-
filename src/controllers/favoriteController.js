import Favorite from "../models/Favorite.js";

export const addFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId, itemModel } = req.body;

    const existingFavorite = await Favorite.findOne({
      userId,
      itemId,
      itemModel,
    });
    if (existingFavorite) {
      await existingFavorite.remove()
      return res.status(200).json({ message: "Item Removed from Favorites" });
    }

    const favorite = new Favorite({ userId, itemId, itemModel });
    await favorite.save();

    res.status(201).json({ message: "Favorite added successfully", favorite });
  } catch (error) {
    console.log(error)
    res
      .status(500)
      .json({ message: "Failed to add favorite", error: error.message });
  }
};

export const getFavoritesByUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const favorites = await Favorite.find({ userId }).populate("itemId");

    res.status(200).json(favorites);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch favorites", error: error.message });
  }
};

export const removeFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId, itemModel } = req.body;

    const favorite = await Favorite.findOneAndDelete({
      userId,
      itemId,
      itemModel,
    });
    if (!favorite) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    res.status(200).json({ message: "Favorite removed successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to remove favorite", error: error.message });
  }
};
