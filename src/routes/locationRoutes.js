import express from 'express';
import { fetchCountries, fetchProvinces, fetchDistricts } from '../controllers/locationController.js';

const router = express.Router();

router.get('/countries', fetchCountries);
router.get('/provinces/:countryId', fetchProvinces);
router.get('/districts/:provinceId', fetchDistricts);

export default router;
