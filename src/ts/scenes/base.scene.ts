import {
	Scene,
	WebGLRenderer,
	PerspectiveCamera,
	DirectionalLight
} from 'three';

export class BaseScene extends Scene{
	camera:PerspectiveCamera;
	renderer:WebGLRenderer;

	constructor(width:number, height:number){
		super();
		this.addObjects();
		this.createCamera(width, height);
		this.setupRenderer(width, height);

		this.addLights();
	}

	setupRenderer(width:number, height:number){
		this.renderer = new WebGLRenderer();
		this.renderer.setSize(width, height);
	}

	createCamera(width:number, height:number){
		this.camera = new PerspectiveCamera(75, width / height, 0.1, 1000);
		this.camera.position.x = 5;
		this.camera.position.y = 5;
		this.camera.position.z = 5;
		this.camera.lookAt(this.position);
	}

	addLights(){
		let light = new DirectionalLight(0xffffff, 1.0)
		light.position.set(100, 100, 100)
		this.add(light);

		let light2 = new DirectionalLight(0xffffff, 1.0);
		light2.position.set(-100, 100, -100);
		this.add(light2);
	}


	addObjects(){
	}

	changeSize(width:number, height:number){
		this.renderer.setSize(width, height);
		this.camera.aspect = width/height;
		this.camera.updateProjectionMatrix();
	}

	render(){
		this.renderer.render(this, this.camera);
	}
}
