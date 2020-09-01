import * as THREE from 'three';

export default class Renderer {

    /** @type {THREE.Scene} */
    scene;

    /** @type {THREE.PerspectiveCamera} */
    camera;

    /** @type {THREE.Scene} ortographic scene used to render 2d graphics  */
    sceneOrtho;

    /** @type {THREE.PerspectiveCamera} */
    cameraOrtho;

    /** @type {THREE.WebGLRenderer} */
    renderer;

    postConstruct({scene, camera, renderer, options} = {options: {useDefaultLight: true}}) {
        const width = window.innerWidth, height = window.innerHeight;

        if (!scene) {
            scene = new THREE.Scene();
        }
        if (!camera) {
            camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        }
        if (!renderer) {
            renderer = new THREE.WebGLRenderer();
            renderer.setSize(window.innerWidth, window.innerHeight);
            window.document.body.appendChild(renderer.domElement);
        }

        let geometry = new THREE.BoxGeometry( 1, 1, 1 );
        let material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
        let cube = new THREE.Mesh(geometry, material);
        cube.position.z = -100;
        scene.add(cube);

        geometry = new THREE.BoxGeometry( 1, 1, 1 );
        material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
        cube = new THREE.Mesh(geometry, material);
        cube.position.z = -50;
        cube.position.x = 10;
        scene.add(cube);

        geometry = new THREE.BoxGeometry( 1, 1, 1 );
        material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
        cube = new THREE.Mesh(geometry, material);
        cube.position.z = -50;
        cube.position.x = -10;
        scene.add(cube);

        geometry = new THREE.BoxGeometry( 1, 1, 1 );
        material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
        cube = new THREE.Mesh(geometry, material);
        cube.position.z = -30;
        cube.position.x = -5;
        scene.add(cube);

        geometry = new THREE.BoxGeometry( 1, 1, 1 );
        material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
        cube = new THREE.Mesh(geometry, material);
        cube.position.z = -30;
        cube.position.x = 5;
        scene.add(cube);

        this.scene = scene;
        this.sceneOrtho = new THREE.Scene();
        this.camera = camera;
        this.cameraOrtho = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, - height / 2, 1, 10);
        this.cameraOrtho.position.z = 10;
        this.camera.matrixAutoUpdate = false;
        this.renderer = renderer;
        this.renderer.autoClear = false;

        if (options.useDefaultLight) {
            //const light = new THREE.HemisphereLight(0xbbbbff, 0x444422);
            const light = new THREE.PointLight();
            light.position.set(0, 100, 0);
            this.scene.add(light);

            const ambientLight = new THREE.AmbientLight(0xF3F3F3); // soft white light
            scene.add(ambientLight);
        }

        return Promise.resolve();
    }

    render() {
        this.renderer.clear();
        this.renderer.render(this.scene, this.camera);
        this.renderer.clearDepth();
        this.renderer.render(this.sceneOrtho, this.cameraOrtho);
    }

}
