export default function createDefaultObjectFactory(objectClass) {
    return function(objectId) {
        return new objectClass(objectId);
    }
}
