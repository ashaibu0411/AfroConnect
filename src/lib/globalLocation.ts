import { Country, State, City } from "country-state-city";

export function getAllCountries() {
  return Country.getAllCountries().map((c) => ({
    name: c.name,
    isoCode: c.isoCode,
  }));
}

export function getStatesByCountry(countryCode: string) {
  return State.getStatesOfCountry(countryCode).map((s) => ({
    name: s.name,
    isoCode: s.isoCode,
  }));
}

export function getCitiesByState(countryCode: string, stateCode: string) {
  return City.getCitiesOfState(countryCode, stateCode).map((c) => c.name);
}
