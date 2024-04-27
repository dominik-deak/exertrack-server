/**
 * Source: https://www.unitconverters.net/weight-and-mass/kg-to-lbs.htm
 */
const conversionVal = 2.2046226218;

/**
 * Converts kilos to pounds
 * @param kilos the weight in kilos
 * @returns the weight in pounds
 */
export function kilosToPounds(kilos: number) {
	return kilos * conversionVal;
}
