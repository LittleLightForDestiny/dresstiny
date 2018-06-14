import {
	EventDispatcher,
	Camera,
	Spherical,
	Vector3,
	Vector2,
	PerspectiveCamera,
} from 'three';
import {TweenLite} from 'gsap';

export class CameraControls extends EventDispatcher {
	camera: Camera;
	domElement: HTMLElement;
	window: Window;
	enabled:boolean = false;

	private _target: Vector3;
	set target(target: Vector3) {
		this._target = target;
	}
	get target(): Vector3 {
		return this._target;
	}

	private spherical: Spherical = new Spherical();
	set phi(phi: number) {
		this.spherical.phi = Math.min(this.maxPhi, Math.max(this.minPhi, phi));
	 }
	get phi(): number { return this.spherical.phi; }
	set theta(theta: number) { this.spherical.theta = theta; }
	get theta(): number { return this.spherical.theta; }
	set distance(distance: number) { this.spherical.radius = distance; }
	get distance(): number { return this.spherical.radius; }

	set fov(fov: number) {
		(this.camera as PerspectiveCamera).fov = fov;
		(this.camera as PerspectiveCamera).updateProjectionMatrix();
	}
	get fov(): number { return (this.camera as PerspectiveCamera).fov; }
	maxPhi: number = Math.PI - 0.001;
	minPhi: number = 0.001;

	minDistance: number = 4;
	maxDistance: number = 10;
	rotateSpeed: number = 1;
	decelerationTime: number = 1;

	private _autoRotateSpeed: number = 0;
	set autoRotateSpeed(speed: number) {
		this._autoRotateSpeed = speed;
		this.currentSpeed.x = speed * 0.01;
	}
	get autoRotateSpeed(): number { return this._autoRotateSpeed };

	private prevMousePos: Vector2;
	private currentSpeed: Vector2 = new Vector2(0, 0);


	constructor(camera: Camera, domElement?: HTMLElement, domWindow?: Window) {
		super();
		this.camera = camera;
		this.domElement = (domElement !== undefined) ? domElement : document.body;
		this.window = (domWindow !== undefined) ? domWindow : window;
		this._target = new Vector3();
		this.domElement.addEventListener("mousedown", this.mouseDownListener);
		this.domElement.addEventListener("mousewheel", this.mouseWheelListener, {passive:true});
		this.domElement.addEventListener("doubletap", this.doubleTapListener);
	}

	doubleTapListener:EventListener = ()=>{
		if(!this.enabled) return;
		if(this.distance == this.minDistance){
			TweenLite.to(this, .5, { distance: this.maxDistance });
		}else{
			TweenLite.to(this, .5, { distance: this.minDistance });
		}
	}

	mouseDownListener: EventListener = () => {
		if(!this.enabled) return;
		this.currentSpeed = new Vector2(0, 0);
		this.window.addEventListener("mousemove", this.mouseMoveListener);
		this.window.addEventListener("mouseup", this.mouseUpListener);
	};

	mouseMoveListener: EventListener = (event: MouseEvent) => {
		this.cursorMove(event.clientX, event.clientY);
	};

	cursorMove(x:number, y:number){
		if(!this.enabled) return;
		let mousePos = new Vector2(x, y);
		if (this.prevMousePos) {
			var element: HTMLElement = this.domElement;
			let speed: Vector2 = new Vector2(
				this.rotateSpeed * 1.5 * Math.PI * (mousePos.x - this.prevMousePos.x) / element.clientWidth,
				this.rotateSpeed * Math.PI * (mousePos.y - this.prevMousePos.y) / element.clientHeight
			);
			this.currentSpeed = speed;
		}
		this.prevMousePos = mousePos;
	}

	mouseUpListener: EventListener = () => {
		if(!this.enabled) return;
		this.prevMousePos = null;
		TweenLite.to(this.currentSpeed, this.decelerationTime, { x: this.autoRotateSpeed * 0.01, y: 0 });
		this.window.removeEventListener("mousemove", this.mouseMoveListener);
		this.window.removeEventListener("mouseup", this.mouseUpListener);
	};

	mouseWheelListener: EventListener = (event: WheelEvent) => {
		if(!this.enabled) return;
		let distanceOffset = event.deltaY / 4;
		let distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance + distanceOffset));
		TweenLite.to(this, .5, { distance: distance });
	};

	update() {
		this.theta-=this.currentSpeed.x;
		this.phi-=this.currentSpeed.y;
		let offset = new Vector3().setFromSpherical(this.spherical);
		this.camera.position.copy(offset.add(this.target));
		this.camera.lookAt(this.target);
	}
}
