import { ORIGIN, IS_REF } from "./_enums";

/**
 * @returns {boolean}
 */
export function isSame(oldVal, newVal) {
  return oldVal === newVal || (oldVal !== oldVal && newVal !== newVal);
}
export function getOrigin(v) {
  return v[ORIGIN] || v;
}
/**
 * @returns {boolean}
 */
export function isReactive(v) {
  return !!v[ORIGIN];
}
/**
 * @returns {boolean}
 */
export function isRef(v) {
  return v[IS_REF];
}
/**
 * @returns {boolean}
 */
export function isMap(o) {
  return Object.prototype.toString.call(o) === "[object Map]";
}
