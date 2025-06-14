import { Router } from "express";
import {
  addFavorite,
  getFavoritesByUser,
  removeFavorite,
} from "../controllers/favoriteController.js";
import { authenticateToken as authenticate } from "../middleware/auth.js";

const favoritesRouter = Router();

favoritesRouter.use(authenticate);

favoritesRouter
  .route("/")
  .get(getFavoritesByUser)
  .put(addFavorite)
  .delete(removeFavorite);

export default favoritesRouter;
