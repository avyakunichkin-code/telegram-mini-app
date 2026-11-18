import assert from 'node:assert/strict';
import { formatIntGrouped, sanitizeIntInput } from './numberFields.js';

// Поле суммы показывает разряды, как суммы на экране («100 000», не «100000»).
assert.equal(formatIntGrouped(100000).replace(/\s/g, ' '), '100 000');
assert.equal(formatIntGrouped(1234567).replace(/\s/g, ' '), '1 234 567');
assert.equal(formatIntGrouped(999), '999');
assert.equal(formatIntGrouped(0), '');
assert.equal(formatIntGrouped(null), '');

// Обратный разбор: разделители и пробелы при вводе отбрасываются.
assert.equal(sanitizeIntInput(formatIntGrouped(100000)), '100000');

console.log('numberFields: ok');
