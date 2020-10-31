import {diContainer} from "../globals";

export default function applyMixin(classRef, mixin, dependencies) {
    if (dependencies) {
        dependencies = [...dependencies, 'diContainer'];
        if (classRef.dependencies) {
            const existingDependencies = classRef.dependencies();
            dependencies = dependencies.filter(dependency => existingDependencies.indexOf(dependency) === -1);
            classRef.dependencies = function() { return [...existingDependencies, ...dependencies]; };

            if (classRef.prototype.postConstruct) {
                const origPostConstruct = classRef.prototype.postConstruct;
                classRef.prototype.postConstruct = function() {
                    for (const dependency of dependencies) {
                        // dependency should be already initialized, because we update static dependencies() method
                        this[dependency] = diContainer.get(dependency);
                    }

                    return origPostConstruct();
                };
            } else {
                classRef.prototype.postConstruct = function() {
                    for (const dependency of dependencies) {
                        // dependency should be already initialized, because we update static dependencies() method
                        this[dependency] = diContainer.get(dependency);
                    }
                };
            }
        } else {
            throw new Error('applyMixin can work only with classes which have static dependencies() method');
        }
    }

    return Object.assign(classRef.prototype, mixin);
}
