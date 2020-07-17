/**
 * @example
 * binaryInsert(obj, objects, (l, r) => l.id - r.id);
 */
export function binaryInsert(value, array, comparator, startVal, endVal) {
    const length = array.length;
    const start = typeof(startVal) != 'undefined' ? startVal : 0;
    const end = typeof(endVal) != 'undefined' ? endVal : length - 1; //!! endVal could be 0 don't use || syntax
    const m = start + Math.floor((end - start)/2);

    if (length === 0) {
        array.push(value);
        return;
    }
    if (comparator(value, array[end]) > 0) {
        array.splice(end + 1, 0, value);
        return;
    }
    if (comparator(value, array[start]) < 0) {
        array.splice(start, 0, value);
        return;
    }
    if (start >= end) {
        return;
    }

    const compareResult = comparator(value, array[m]);
    if (compareResult < 0) {
        binaryInsert(value, array, comparator, start, m - 1);
    } else if (compareResult > 0) {
        binaryInsert(value, array, comparator, m + 1, end);
    }
    // we don't insert duplicates
}

