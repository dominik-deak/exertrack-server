"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kilosToPounds = void 0;
/**
 * Source: https://www.unitconverters.net/weight-and-mass/kg-to-lbs.htm
 */
const conversionVal = 2.2046226218;
/**
 * Converts kilos to pounds
 * @param kilos the weight in kilos
 * @returns the weight in pounds
 */
function kilosToPounds(kilos) {
    return kilos * conversionVal;
}
exports.kilosToPounds = kilosToPounds;
