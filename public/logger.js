/* eslint-disable */

console.log('hello from logger')
const oldCall = Function.prototype.call;
var newCall = function (self) {
  Function.prototype.call = oldCall;
  console.log('Function called:', this.name);
  const args = Array.prototype.slice.call(arguments, 1);
  const res = this.apply(self, args);
  Function.prototype.call = newCall;
  return res;
};
Function.prototype.call = newCall;
