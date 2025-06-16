import Favorite from "../models/Favorite.js";

export default async function removeFavoriteForDeletedItem(itemId) {
  try {
    const deletedFavorites = await Favorite.deleteMany({ itemId });
    console.log("deletedFavorites", deletedFavorites);
    return deletedFavorites.deletedCount;
  } catch (error) {
    console.error(error);
  }
}
