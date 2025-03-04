import { getCountries, getProvincesByCountry, getDistrictsByProvince } from '../services/locationService.js';

export const fetchCountries = async (req, res) => {
    try {
        const countries = await getCountries();
        res.json(countries);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const fetchProvinces = async (req, res) => {
    try {
        const provinces = await getProvincesByCountry(req.params.countryId);
        res.json(provinces);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const fetchDistricts = async (req, res) => {
    try {
        const districts = await getDistrictsByProvince(req.params.provinceId);
        res.json(districts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
