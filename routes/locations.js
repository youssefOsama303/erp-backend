const router = require('express').Router();
const { Country, State, City } = require('country-state-city');

// 1. جلب كل الدول
router.get('/countries', (req, res, next) => {
  try {
    const countries = Country.getAllCountries().map(c => ({
      code: c.isoCode,      // كود الدولة زي EG أو SA
      name: c.name,         // اسم الدولة
      phonecode: c.phonecode, // مفتاح التليفون زي +20
      currency: c.currency  // العملة
    }));
    res.json(countries);
  } catch (err) { next(err); }
});

// 2. جلب المحافظات/الولايات لدولة معينة
router.get('/states/:countryCode', (req, res, next) => {
  try {
    const states = State.getStatesOfCountry(req.params.countryCode).map(s => ({
      code: s.isoCode,
      name: s.name
    }));
    res.json(states);
  } catch (err) { next(err); }
});

// 3. جلب المدن لمحافظة معينة
router.get('/cities/:countryCode/:stateCode', (req, res, next) => {
  try {
    const cities = City.getCitiesOfState(req.params.countryCode, req.params.stateCode).map(c => ({
      name: c.name
    }));
    res.json(cities);
  } catch (err) { next(err); }
});

module.exports = router;