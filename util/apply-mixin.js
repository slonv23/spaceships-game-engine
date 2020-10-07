export default function applyMixin(classRef, mixin) {
    return Object.assign(classRef.prototype, mixin);
}
