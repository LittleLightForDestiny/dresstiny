import {PerspectiveCamera,
	MeshBasicMaterial,
	AmbientLight,
	DirectionalLight,
	Color,
	Clock,
	LinearToneMapping,
	Vector2,
	Vector3,
    Raycaster} from 'three';
import {TimelineLite} from 'gsap';
import {BaseScene} from './base.scene';
import {CameraControls } from '../controls/camera.controls';

export class MainScene extends BaseScene {
	controls: CameraControls;
	clock: Clock;

	constructor(width: number, height: number, public domElement: HTMLElement) {
		super(width, height);
		this.setupCustomRenderer(width, height);
		this.setupCameraControls();
		// this.setupDebugger();
	}

	addLights() {
		let ambient = new AmbientLight(0xffffff, 0.1);
		this.add(ambient);

		let light1 = new DirectionalLight(0xFFFFFF, .8);
		light1.position.set(2,2, 1);
		this.add(light1);

		let light2 = new DirectionalLight(0xFFFFFF, .5);
		light2.position.set(1,2,-1);
		this.add(light2);

		let light3 = new DirectionalLight(0xFFFFFF, .6);
		light3.position.set(-2,2,0);
		this.add(light3);
	}

	createCamera(width: number, height: number) {
		this.camera = new PerspectiveCamera(25, width / height, .3, 200);
		this.camera.filmGauge = width;
		this.add(this.camera);
	}

	setupCameraControls() {
		this.controls = new CameraControls(this.camera, this.renderer.domElement);
		this.controls.autoRotateSpeed = 0;
		this.controls.target = new Vector3();
		this.controls.theta = Math.PI/2;
	}

	updateCameraControls(center:Vector3, distance:number){
		this.controls.minDistance = this.camera.near + distance*2;
		this.controls.maxDistance = this.camera.near + distance*10;
		this.controls.target = center;
		let timeline: TimelineLite = new TimelineLite();
		timeline.to(this.controls, 2, { distance: this.camera.near + distance*6, phi: Math.PI/2 }, "0");
		timeline.call(() => {
			this.controls.enabled = true;
		}, [], this, ".5");
	}

	setupCustomRenderer(width: number, height: number) {
		super.setupRenderer(width, height);
		this.renderer.setPixelRatio(1.5);
		this.renderer.setClearColor(0xFFFFFF);
		this.renderer.toneMappingExposure = 1.5;
		this.renderer.gammaInput = true;
		this.renderer.gammaOutput = true;
		this.renderer.toneMapping = LinearToneMapping;
		this.clock = new Clock();
	}

	changeSize(width:number, height:number){
		this.camera.filmGauge = width;
		this.renderer.setSize(width, height);
		super.changeSize(width, height);
	}

	render() {
		if(this.controls) this.controls.update();
		this.renderer.render(this, this.camera);
	}

	setupDebugger(){
		let debugColors = [
			0xFF0000,
			0xFF8800,
			0xFFFF00,
			0x00FF00,
			0x00FFFF,
			0x0088FF,
			0x0000FF,
			0xFF00FF,
			0xFF0088
		];
		let mouse:Vector2 = new Vector2();
		let raycaster:Raycaster = new Raycaster();
		let intersected:MeshBasicMaterial[] = null;
		let lockIntersected:boolean = false;
		document.addEventListener( 'mousemove', (event:MouseEvent)=>{
			mouse.x = ( event.clientX / this.renderer.getSize().width ) * 2 - 1;
			mouse.y = - ( event.clientY / this.renderer.getSize().height ) * 2 + 1;
			raycaster.setFromCamera( mouse, this.camera );
			let intersects = raycaster.intersectObjects( this.children );
			if(intersected && !lockIntersected){
				intersected.forEach((intersect)=>intersect.color = new Color(1, 1, 1));
			}
			if(intersects.length > 0 && !lockIntersected){
				let ordered = intersects.sort((objA, objB)=>objB.distanceToRay - objA.distanceToRay);
				intersected = ordered.map((intersect, index)=>{
					(intersect.object as any).material[intersect.face.materialIndex].color = new Color(debugColors[index]);
					return (intersect.object as any).material[intersect.face.materialIndex];
				});
			}
		}, false );
		document.addEventListener('mouseup', (event:MouseEvent)=>{
			if(event.shiftKey){
				lockIntersected = !lockIntersected;
				intersected.forEach((intersect)=>intersect.color = new Color(1, 1, 1));
				(window as any).selected = intersected.map((intersect)=>{
					return {
						material:intersect,
						data:intersect.userData
					}
				});
				console.log((window as any).selected);
			}

		})
	}
}
