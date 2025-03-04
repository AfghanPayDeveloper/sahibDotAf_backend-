import Country from '../models/Country.js';
import Province from '../models/Province.js';
import District from '../models/District.js';

export const getCountries = async () => {
    return await Country.find();
};

export const getProvincesByCountry = async (countryId) => {
    return await Province.find({ country_id: countryId }).populate('country_id');
};

export const getDistrictsByProvince = async (provinceId) => {
    return await District.find({ province_id: provinceId }).populate('country_id province_id');
};
