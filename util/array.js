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


export function binarySearchClosest(array, comparator, start, end) {
    if (start === end) {
        return array[start];
    }

    const middle = start + Math.floor((end - start) / 2);
    const middleResult = comparator(array[middle]);

    let subset1End = Math.max(middle - 1, start);
    let subset1Middle = start + Math.floor((subset1End - start) / 2);
    let subset1MiddleResult = comparator(array[subset1Middle]);
    while (subset1MiddleResult === middleResult && subset1Middle > start) {
        subset1End = subset1Middle - 1;
        subset1Middle = start + Math.floor((subset1End - start) / 2);
        subset1MiddleResult = comparator(array[subset1Middle]);
    }

    let subset2Start = Math.min(middle + 1, end);
    let subset2Middle = subset2Start + Math.floor((end - subset2Start) / 2);
    let subset2MiddleResult = comparator(array[subset2Middle]);
    while (subset2MiddleResult === middleResult && subset2Middle < end) {
        subset2Start = subset2Middle + 1;
        subset2Middle = subset2Start + Math.floor((end - subset2Start) / 2);
        subset2MiddleResult = comparator(array[subset2Middle]);
    }

    if (middleResult < subset1MiddleResult && middleResult < subset2MiddleResult) {
        if (subset1End === start && subset2Start === end) {
            return array[middle];
        } else {
            return binarySearchClosest(array, comparator, subset1End, subset2Start);
        }
    } else if (subset1MiddleResult < middleResult) {
        return binarySearchClosest(array, comparator, start, subset1End);
    } else {
        return binarySearchClosest(array, comparator, subset2Start, end);
    }
}

export function binarySearchClosestInUniqueArray(array, comparator, start, end) {
    if (start === end) {
        return array[start];
    }

    const middle = start + Math.floor((end - start) / 2);
    const middleResult = comparator(array[middle]);

    const subset1End = Math.max(middle - 1, start);
    const subset1Middle = start + Math.floor((subset1End - start) / 2);
    const subset1MiddleResult = comparator(array[subset1Middle]);

    const subset2Start = Math.min(middle + 1, end);
    const subset2Middle = subset2Start + Math.floor((end - subset2Start) / 2);
    const subset2MiddleResult = comparator(array[subset2Middle]);

    if (middleResult < subset1MiddleResult && middleResult < subset2MiddleResult) {
        if (subset1End === start && subset2Start === end) {
            return array[middle];
        } else {
            return binarySearchClosest(array, comparator, subset1End, subset2Start);
        }
    } else if (subset1MiddleResult < middleResult) {
        return binarySearchClosest(array, comparator, start, subset1End);
    } else {
        return binarySearchClosest(array, comparator, subset2Start, end);
    }
}